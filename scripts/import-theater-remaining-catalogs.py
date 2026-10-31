"""Import the four previously unrecorded supplied PDFs without downgrading prices.

No network requests or source-PDF edits. Explicit page/model mappings document
visual transcription where table extraction or the PDF's item codes are ambiguous.
"""
import argparse
import hashlib
import json
import re
import runpy
from pathlib import Path

import pdfplumber
import pymupdf
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/data/theater'
PUBLIC = ROOT / 'public/theater-catalog'
FILES = [
    ('Rotel', "rotel retail price - dec'22.pdf", '2022-12-01'),
    ('Focal', 'FOCAL MRP ARIA PRICE LIST JULY-2023-1.pdf', '2023-07-01'),
    ('Sonus faber', 'Sonus faber INDIA RETAIL Pricelist APR26.pdf', '2026-04-01'),
    ('Marantz', 'Marantz Price List June 2023.pdf', '2023-06-01'),
]
SONUS = {
    6: 'Suprema', 8: 'Aida', 10: 'Lilium', 12: 'Il Cremonese',
    14: 'Il Cremonese Ex3me', 16: 'Il Cremonese Ex3me Automobili Lamborghini Edition',
    18: 'Amati Supreme', 20: 'Stradivari', 21: 'Amati Folgore Limited Edition',
    22: 'Amati', 23: 'Serafino', 24: 'Guarneri', 25: 'Vox',
    27: 'Maxima Amator', 28: 'Electa Amator III', 29: 'Concertino Standard Edition',
    31: 'Olympica Nova V', 32: 'Olympica Nova III', 33: 'Olympica Nova II',
    34: 'Olympica Nova I', 35: 'Olympica Nova C II', 36: 'Olympica Nova C I',
    37: 'Olympica Nova Wall', 39: 'Sonetto G2 VIII', 40: 'Sonetto G2 V',
    41: 'Sonetto G2 III', 42: 'Sonetto G2 II', 43: 'Sonetto G2 I',
    44: 'Sonetto G2 Center', 45: 'Sonetto G2 Wall', 47: 'Lumina V Amator',
    48: 'Lumina V', 49: 'Lumina III', 50: 'Lumina II Amator', 51: 'Lumina II',
    52: 'Lumina I', 53: 'Lumina C I', 55: 'Gravis VI', 56: 'Gravis V',
    57: 'Gravis III', 58: 'Gravis II', 59: 'Gravis I', 61: 'Duetto', 63: 'Omnia',
    65: ('Arena 30', 'Arena 30H'), 66: ('Arena 20', 'Arena 10'),
    67: ('Arena S15', 'Arena S10'), 68: ('Arena 5', 'Arena 2'), 69: ('Arena 1',),
    72: ('PW 662', 'PC 662'), 73: ('PC 682', 'PC 662P'),
    74: ('PC 664P', 'PC 683'), 75: ('PL 664',),
    77: ('PW 562', 'PC 562'), 78: ('PC 582', 'PC 562P'),
    79: ('PL 563', 'PC 563P'), 80: ('PS G101',), 82: ('Aster',),
}


def clean(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def ident(brand, model):
    # Keep C8 and C8+ separate.
    return re.sub('[^a-z0-9]+', '-', f'{brand}-{model}'.replace('+', ' plus ').lower()).strip('-')


def canonical(model):
    return re.sub('[^A-Z0-9]', '', model.upper().removeprefix('MARANTZ ').replace('+', 'PLUS'))


def money(text):
    m = re.search(r'(?:Rs\.|₹)?\s*(\d[\d, ]*)', text, re.I)
    if not m:
        raise ValueError(f'No price: {text}')
    return int(re.sub(r'\D', '', m[1])) * 100


def crop(page, box):
    x0, y0, x1, y1 = box
    box = (max(0, x0), max(0, y0), min(page.width, x1), min(page.height, y1))
    return page.crop(box).extract_text() or '' if box[2] > box[0] and box[3] > box[1] else ''


def save_image(im, product_id):
    im = im.convert('RGBA')
    bg = Image.new('RGBA', im.size, 'white'); bg.alpha_composite(im)
    im = bg.convert('RGB')
    mask = ImageChops.difference(im, Image.new('RGB', im.size, 'white')).convert('L').point(lambda v: 255 if v > 18 else 0)
    box = mask.getbbox()
    if box:
        im = im.crop((max(0, box[0]-4), max(0, box[1]-4), min(im.width, box[2]+4), min(im.height, box[3]+4)))
    im.thumbnail((640, 480), Image.Resampling.LANCZOS)
    im.save(PUBLIC / f'{product_id}.webp', 'WEBP', quality=88)
    return f'/theater-catalog/{product_id}.webp'


def identity_card(product_id, brand, model):
    # Never substitute a speaker photograph for an unpictured accessory.
    im = Image.new('RGB', (600, 360), '#f0f4f6'); draw = ImageDraw.Draw(im)
    font_path = Path('C:/Windows/Fonts/arial.ttf')
    font = ImageFont.truetype(str(font_path), 23) if font_path.exists() else ImageFont.load_default()
    draw.text((28, 34), brand, font=font, fill='#173448')
    words = model.split(); lines = []; line = ''
    for word in words:
        if len(line + ' ' + word) > 38:
            lines.append(line); line = word
        else:
            line = (line + ' ' + word).strip()
    lines.append(line)
    draw.multiline_text((28, 102), '\n'.join(lines[:5]), font=font, fill='#173448', spacing=10)
    draw.text((28, 310), 'Catalogue reference - photo not supplied', font=font, fill='#536773')
    return save_image(im, product_id)


def pdf_image(doc, page_number, box, product_id):
    pix = doc[page_number-1].get_pixmap(matrix=pymupdf.Matrix(2, 2), clip=pymupdf.Rect(box), alpha=False)
    return save_image(Image.frombytes('RGB', (pix.width, pix.height), pix.samples), product_id)


def photo_box(page, cell):
    candidates = [x for x in page.get_image_info(xrefs=True)
                  if cell[0] <= (x['bbox'][0]+x['bbox'][2])/2 <= cell[2]
                  and cell[1] <= (x['bbox'][1]+x['bbox'][3])/2 <= cell[3]
                  and x['bbox'][2]-x['bbox'][0] > 12 and x['bbox'][3]-x['bbox'][1] > 8]
    if not candidates:
        return None
    return max(candidates, key=lambda x: (x['bbox'][2]-x['bbox'][0])*(x['bbox'][3]-x['bbox'][1]))['bbox']


def category_for(brand, model, desc):
    m = model.upper(); t = (model + ' ' + desc).lower()
    if brand == 'Rotel':
        if 'AMPLIFICATION PACKAGE' in m: return 'electronics-package', ['receiver','extra'], dict(amplifiedChannels=11,processedChannels=11,atmos=True)
        if m.startswith('RSP'): return 'av-processor', ['receiver'], dict(amplifiedChannels=0, processedChannels=11, atmos=True)
        channels = {'S5':2, 'M8':1, 'RB-1590':2, 'RB-1582MKII':2, 'RB-1552MKII':2, 'RMB-1585':5, 'RMB-1555':5, 'RMB-1506':6, 'RMB-1504':4, 'C8':8, 'C8+':8}
        if model in channels: return 'power-amplifier', ['amplifier'], dict(amplifiedChannels=channels[model], externalAmpChannels=channels[model], powerAmpDirect=True, processedChannels=0)
        if m.startswith(('RC-', 'P5')): return 'stereo-preamp', ['extra'], {}
        if 'adaptor' in t: return 'accessory', ['extra'], {}
        if m.startswith(('DT-', 'RCD-', 'CD')): return 'cd-player', ['extra'], {}
        if m.startswith('T'): return 'tuner', ['extra'], {}
        return ('streaming-amplifier' if m == 'S14' else 'integrated-amplifier'), ['extra'], {}
    if re.search(r'\bSTAND\b',m) or 'MOUNTS' in m or 'KIT' in m or 'GRILL' in m or m == 'APTX' or m.startswith('WTX') or m == 'ARIA S900':
        return 'accessory', ['extra'], {}
    if brand == 'Sonus faber':
        if m.startswith(('GRAVIS', 'SUPREMA SUB', 'ARENA S', 'PS G')): return 'subwoofer', ['subwoofer'], {}
        if m.startswith(('PW ', 'PL ', 'ARENA ')): return 'in-wall', ['front', 'center', 'surround', 'rear'], {}
        if m.startswith('PC '): return 'ceiling', ['height'], {}
        if m == 'ASTER': return 'outdoor', ['extra'], {}
        if m in ['DUETTO', 'OMNIA']: return 'active-speaker', ['extra'], {}
        if m in ['VOX', 'OLYMPICA NOVA C I', 'OLYMPICA NOVA C II', 'SONETTO G2 CENTER', 'LUMINA C I']: return 'center', ['center'], {}
        if 'WALL' in m: return 'on-wall', ['front', 'surround', 'rear'], {}
        if m in ['GUARNERI', 'ELECTA AMATOR III', 'CONCERTINO STANDARD EDITION', 'OLYMPICA NOVA I', 'SONETTO G2 I', 'SONETTO G2 II', 'LUMINA I', 'LUMINA II', 'LUMINA II AMATOR']:
            return 'bookshelf', ['front', 'surround', 'rear'], {}
        return 'floorstanding', ['front'], {}
    if brand == 'Marantz':
        if m.startswith('TT'): return 'turntable', ['extra'], {}
        if m.startswith(('SA', 'CD', 'MARANTZ CD')): return 'cd-player', ['extra'], {}
        if m.startswith(('NA', 'ND')): return 'network-player', ['extra'], {}
        if m.startswith(('PM', 'MODEL', 'M-CR', 'NR 1200')): return 'integrated-amplifier', ['extra'], {}
        if m.startswith('MM'):
            ch = {'MM-7025':2, 'MM-7055':5, 'MM-8077':7}[m]
            return 'power-amplifier', ['amplifier'], dict(amplifiedChannels=ch, processedChannels=0)
        if m.startswith('AV'):
            return 'av-processor', ['receiver'], dict(amplifiedChannels=0, processedChannels=13 if '8805' in m else 11, atmos=True)
        ch = {'NR1510':5, 'NR1711':7, 'SR5015':7, 'SR6015':9, 'SR7015':9, 'SR8015':11}.get(canonical(m), 7)
        return 'receiver', ['receiver'], dict(amplifiedChannels=ch, processedChannels=13 if ch == 11 else 11 if ch == 9 else ch, atmos=ch>=7)
    if m == '100 IW SUB8 AMPLIFIER': return 'power-amplifier', ['extra'], {}
    if 'SET' in desc[:4] or m in ['SIB EVO DOLBY ATMOS 5.1.2', 'SIB EVO 5.1']:
        contents = dict(front=2, center=1, surround=2, subwoofer=1)
        if '5.1.2' in m: contents['height']=2
        return 'package', ['package'], dict(packageContents=contents)
    if m in ['DOME FLAX SUB-AIR', 'DIMENSION APTX SUB AIR']:
        return 'electronics-package', ['extra'], {}
    if m == 'SOUNDBAR DIMENSION': return 'soundbar', ['extra'], {}
    if m == '1000 ICW SUB10' or m == '100 IW SUB8' or 'subwoofer' in t or m in ['SUB AIR', 'CUB EVO', 'OD SUB 12']: return 'subwoofer', ['subwoofer'], {}
    if 'outdoor' in t or m.startswith(('OD ', '100 OD', '100OD')): return 'outdoor', ['extra'], {}
    if 'on-wall' in t or m in ['301', '302']: return 'on-wall', ['front', 'center', 'surround', 'rear'], {}
    if 'in-wall' in t and not ('in-ceiling' in t or 'icw' in m.lower()): return 'in-wall', ['front', 'center', 'surround', 'rear'], {}
    if 'in-ceiling' in t or 'ICW' in m or 'IC6' in m or ' IC ' in m: return 'ceiling', ['height'], {}
    if 'sound bar' in t or 'soundbar' in t: return 'soundbar', ['extra'], {}
    if 'center' in t or 'centre' in t or 'central speaker' in t or m == 'ARIA CC 900': return 'center', ['center'], {}
    if 'floor standing' in t or 'floorstanding' in t: return 'floorstanding', ['front'], {}
    if 'surround' in m.lower() or m == 'ARIA SR 900': return 'on-wall', ['surround', 'rear'], {}
    return 'bookshelf', ['front', 'surround', 'rear'], {}


def sonus_rows(doc):
    result = []
    for n, names in SONUS.items():
        page = doc[n-1]; words = page.get_text('words'); anchors = []
        for w in words:
            if re.match(r'^Rs\.', w[4], re.I):
                cy = (w[1]+w[3])/2
                if any(abs(a[1]-cy)<12 and abs(a[0]-w[0])<20 for a in anchors): continue
                anchors.append((w[0], cy))
        for px, cy in sorted(anchors, key=lambda a:(a[1], a[0])):
            half = int(px >= 640); base = names[half] if isinstance(names, tuple) else names
            text = page.get_text(clip=pymupdf.Rect(px-1,cy-10,min(px+110,1279),cy+10))
            amount = money(text)
            left = half*640+50 if isinstance(names, tuple) else 670
            row_text = page.get_text(clip=pymupdf.Rect(left,cy-13,px+110,cy+13))
            code_words = [z for z in words if re.match(r'^(?:DIF|CIL|KIT|CLN|CIN|SBW|WTX)',z[4]) and abs((z[1]+z[3])/2-cy)<14 and px-450<z[0]<px]
            if not code_words: raise ValueError(f'No Sonus code page {n}, {text}')
            code_word = min(code_words,key=lambda z:abs((z[1]+z[3])/2-cy));code = code_word[4].rstrip('.')
            code = 'CLN431FIN' if code == 'CIN431FIN' else code
            unit = 'pair' if re.search(r'\bPAIR\b',row_text) else 'set' if re.search(r'PCS',row_text,re.I) else 'unit'
            pack = int(re.search(r'\(\s*(\d+)\s*PCS',row_text,re.I)[1]) if unit=='set' else 2 if unit=='pair' else 1
            finish = clean(page.get_text(clip=pymupdf.Rect(left,cy-13,code_word[0]-4,cy+13)))
            # Product families and accessory identities are separate, even when
            # the source repeats an item code for two distinct Arena models.
            accessory = code.startswith(('KIT', 'CLN', 'WTX'))
            if n == 6: base = 'Suprema Subwoofer + Electronic Crossover' if code.startswith('DIF411') else 'Suprema Subwoofer' if code.startswith('DIF412') else 'Suprema'
            if accessory:
                if code.startswith('CLN'):
                    base='Olympica Nova Center' if code=='CLN306FIN' else 'Sonetto G2' if code=='CLN431FIN' else base
                    base += ' Stand'
                elif code.startswith('WTX'): base = 'WTX Transmitter'
                else: base = 'Palladio ' + ('Square Grille Kit' if pack==10 else 'Pre-mounting Kit' if pack==5 else 'Premium Frame Kit')
                base += ' ' + code
            # The source maps 120V and 220V references to the same local price.
            # Preserve both references in source evidence, not as two billable items.
            row = dict(page=n, half=half, model=base, code=code, amount=amount, unit=unit, packSize=pack, finish=finish, rowText=clean(row_text), y=cy, accessory=accessory)
            result.append(row)
    return result


def main(source):
    PUBLIC.mkdir(parents=True, exist_ok=True)
    existing = json.loads((DATA/'products.json').read_text(encoding='utf8'))
    sources = json.loads((DATA/'sources.json').read_text(encoding='utf8'))
    # Rebuild our records, while retaining later lists and administrator overrides.
    filenames = {x[1] for x in FILES}
    products = [p for p in existing if p['source']['file'] not in filenames]
    audit = []; manifests = []
    original = runpy.run_path(str(ROOT/'scripts/import-theater-catalog.py'))
    for brand, filename, date in FILES:
        file = source/filename
        if not file.exists(): raise FileNotFoundError(file)
        doc = pymupdf.open(file); digest=hashlib.sha256(file.read_bytes()).hexdigest(); rows=[]
        if brand == 'Sonus faber':
            rows = sonus_rows(doc)
        else:
            with pdfplumber.open(file) as pdf:
                for n, page in enumerate(pdf.pages, 1):
                    for table in page.find_tables():
                        for row in table.rows:
                            cells = [crop(page,b) if b else '' for b in row.cells]
                            if brand=='Rotel' and cells[-1] and re.fullmatch(r'₹\s*[\d,]+',cells[-1]):
                                rows.append(dict(page=n, model=clean(cells[0]), description=clean(' '.join(x for x in cells[1:-1] if x)), amount=money(cells[-1]), unit='unit', packSize=1, cell=row.cells[0]))
                            if brand=='Focal' and cells[-1] and re.fullmatch(r'[\d,]+/-',cells[-1].replace(' ','')):
                                box=row.bbox
                                unit_text=crop(page,(410,box[1],455,box[3]))
                                unit = 'pair' if 'PAIR' in unit_text else 'set' if 'SET' in unit_text else 'unit'
                                model=clean(crop(page,(3,box[1],114,box[3]))).replace('•','').strip()
                                model=re.sub(r'\s+',' ',model).replace('SIB EVO5.1','SIB EVO 5.1').replace('SIB EVOWALL','SIB EVO WALL')
                                rows.append(dict(page=n,model=model,description=clean(crop(page,(115,box[1],410,box[3]))),amount=money(cells[-1]),unit=unit,packSize=2 if unit=='pair' else 1,cell=(3,box[1],114,box[3])))
                            if brand=='Marantz':
                                box=row.bbox; amt=clean(crop(page,(500,box[1],600,box[3])))
                                if re.fullmatch(r'[\d,]+',amt):
                                    model=clean(crop(page,(55,box[1],119,box[3])))
                                    if not model and n==2: model=['Cinema 50','Cinema 60','Cinema 70s'][sum(x['page']==2 for x in rows)]
                                    rows.append(dict(page=n,model=model,description=clean(crop(page,(270,box[1],492,box[3]))),amount=money(amt),unit='unit',packSize=1,cell=(120,box[1],270,box[3])))
            if brand=='Rotel':
                # Nested cells truncate the processor row. The printed row and
                # its repeated package specifications confirm the full record.
                rows.append(dict(page=2,model='RSP-1576MKII',description='7.1.4-channel AV processor; Dolby Atmos, DTS:X, Dirac Live room correction; 7 HDMI 2.0b inputs with 4K/UHD, HDCP 2.2 and HDR10; Bluetooth apt-X; MM phono and PC-USB. External amplification required.',amount=37790000,unit='unit',packSize=1,cell=(28,625,142,703)))
                for page,model,amount,desc in [(7,'7.1.4 Amplification Package 1585',111060000,'RSP-1576MKII processor, RMB-1585 (5 channels), RB-1582MKII (2 channels), RMB-1504 (4 channels).'),(9,'7.1.4 Amplification Package 1555',72670000,'RSP-1576MKII processor, RMB-1555 (5 channels), RMB-1506 (6 channels).')]:
                    rows.append(dict(page=page,model=model,description=desc+' Electronics only; speakers and subwoofer are not included. Do not combine with the same individual components.',amount=amount,unit='set',packSize=1,cell=(20,170,580,360),package=True))
            if brand=='Focal':
                # The merged left-hand cell on page 27 is not a valid table row.
                rows.append(dict(page=27,model='DOME FLAX SUB-AIR',description='Dome Flax speaker and Sub Air subwoofer set. The supplied list does not state the number of satellites; confirm package contents before treating it as a complete cinema system.',amount=26000000,unit='set',packSize=1,cell=(3,190,114,500)))
            if brand=='Marantz':
                # Page 5 has no complete table borders.
                rows += [dict(page=5,model='SA 14S1SE',description='SA-14S1 Reference Super Audio CD player.',amount=37490000,unit='unit',packSize=1,cell=(120,89,280,145)),dict(page=5,model='TT5005',description='Automatic turntable; switchable built-in phono equalizer, 33 1/3 and 45 rpm; preinstalled MM cartridge.',amount=3990000,unit='unit',packSize=1,cell=(120,160,280,229))]
        audit.append(dict(brand=brand,file=filename,sha256=digest,rows=rows))
        groups={}
        for row in rows:
            model=row['model']
            if not model: raise ValueError(f'Empty {brand} model: {row}')
            if brand=='Rotel':
                model=re.sub(r' - (?:NEW|Stereo.*|Monoblock.*)$','',model).strip()
                if model.startswith('RSP'): model='RSP-1576MKII'
            if brand=='Marantz' and any(canonical(p['model'])==canonical(model) for p in products if p['brand']==brand): continue
            key=canonical(model)
            groups.setdefault(key,[]).append({**row,'model':model})
        for entries in groups.values():
            row=entries[0];model=row['model']; pid=ident(brand,model)
            if any(p['id']==pid for p in products): raise ValueError(f'Duplicate ID: {pid}')
            issues=[];amount=row['amount'];unit=row['unit'];pack=row['packSize']
            if len({(r['amount'],r['unit'],r['packSize']) for r in entries})!=1:
                issues.append('Price requires confirmation: the supplied list gives different prices for this same accessory code. Listed INR amounts: '+', '.join(str(x//100) for x in sorted({r['amount'] for r in entries}))+'.')
                amount=None
            if brand=='Sonus faber':
                desc=clean(doc[row['page']-1].get_text(clip=pymupdf.Rect(350 if row['page']>=64 else 660,100,(640 if row['half']==0 else 1280) if row['page']>=64 else 1250,535 if row['page']>=64 else 445)))
                if row['page']>=64 and row['half']==1: desc=clean(doc[row['page']-1].get_text(clip=pymupdf.Rect(990,100,1250,535)))
                if row['accessory']: desc=f"{model}. Optional accessory; supplied list item reference {row['code']}. Confirm compatibility with the selected speaker."
                for heading,label in [('SYSTEM','System'),('LOUDSPEAKERS','Drivers'),('CROSS-OVER','Crossover'),('FREQUENCY RESPONSE','Frequency response'),('SENSITIVITY','Sensitivity'),('NOMINAL IMPEDANCE','Nominal impedance'),('SUGGESTED AMPLIFIER','Suggested amplifier'),('POWER OUTPUT','Power output'),('DIMENSIONS','Dimensions'),('WEIGHT','Weight')]:
                    pattern=r'(?<!\w)'+r'\s*'.join(re.escape(ch) for ch in heading.replace(' ',''))+r'(?!\w)'
                    desc=re.sub(pattern,label+':',desc)
                if row['page'] in [65,66] and row['model'] in ['Arena 30','Arena 20']: issues.append('The supplied list repeats DIF393FIN / 8056684714612 for Arena 30 and Arena 20 at different prices. Confirm the order code; these are separate models.')
                if row['page'] in [28,29,34,35,36,42,43] and not row['accessory']: issues.append('Speaker stand is priced separately; confirm the selected finish and included accessories.')
                desc=desc[:2500]
            else: desc=row.get('description','')
            category,roles,specs=category_for(brand,model,desc)
            if brand=='Focal': specs.update(original['specs_for'](brand,model,desc))
            finishes=[]
            if brand=='Sonus faber' and not row['accessory']:
                for r in entries:
                    f=clean(re.sub(r'\b(?:120|220)\s*V\b|\b2023\b|REF&TRAD', '', r['finish']))
                    if f and len(f)<85 and f not in finishes and not any(x in f for x in ['WAY','IN-WALL','IN-CEIL','ARRAY','SUBWOOFER','CLOSED BOX']): finishes.append(f)
                finishes=[re.sub(r'^(.*) \1$',r'\1',f) for f in finishes]
                if row['page'] in [50,51]: finishes=['Wenge','Walnut','Red' if row['page']==50 else 'Piano Black']
                if row['page'] in [61,63]: finishes=['Walnut','Graphite']
                if row['page']>=64:
                    finishes=['Black','White Primer'] if model=='Arena S10' else ['Black'] if model.startswith('Arena') else ['Black','White'] if model=='Aster' else []
            if brand=='Rotel' and 'Black and Silver' in desc: finishes=['Black','Silver']
            image=None; image_kind='photo'
            page=doc[row['page']-1]
            if brand=='Sonus faber':
                if row['accessory']:
                    # Stands shown next to the speaker are not falsely presented
                    # as an independent exact product photograph.
                    image_kind='service'
                else:
                    half=row['half'] if row['page']>=64 else 0
                    candidates=[x['bbox'] for x in page.get_image_info(xrefs=True) if half*640+70 <= x['bbox'][0] < half*640+620 and 80 <= x['bbox'][1] < 250 and x['bbox'][2]-x['bbox'][0]>60 and x['bbox'][3]-x['bbox'][1]>60]
                    box=min(candidates,key=lambda b:b[0]) if candidates else None
                    if row['page']==6:
                        box=(268,158,401,406) if 'Subwoofer' in model else (101,129,232,412)
                    if box: image=pdf_image(doc,row['page'],box,pid)
            elif row.get('package'):
                boxes=[x['bbox'] for x in page.get_image_info(xrefs=True) if x['bbox'][1]>450 and x['bbox'][1]<650]
                if boxes:
                    image=pdf_image(doc,row['page'],(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes)),pid)
            else:
                box=photo_box(page,row['cell'])
                if box: image=pdf_image(doc,row['page'],box,pid)
            if not image:
                image=identity_card(pid,brand,model);image_kind='service'
            if image_kind=='service': issues.append('Product photo is not separately supplied; the image is a labelled catalogue reference card.')
            source_info=dict(file=filename,page=row['page'],effectiveDate=date,sha256=digest)
            if brand=='Sonus faber': source_info['references']=[dict(page=r['page'],code=r['code'],text=r['rowText']) for r in entries]
            products.append(dict(id=pid,brand=brand,model=model,category=category,roles=roles,series='Michi' if brand=='Rotel' and model in ['X5','X3','P5','S5','M8'] else model.split()[0],description=desc,image=image,imageKind=image_kind,imageSource=f'{filename} - page {row["page"]}' if image_kind=='photo' else f'Catalogue reference card based on {filename} - page {row["page"]}; no separate photo supplied',finishes=finishes,specs=specs,issues=issues,source=source_info,price=dict(amountPaise=amount,taxBasis='inclusive',gstRate=0,unit=unit,packSize=pack,revision=0)))
        manifests.append(dict(brand=brand,file=filename,sha256=digest,pages=len(doc),parsedProducts=len(rows),products=sum(p['source']['file']==filename for p in products),effectiveDate=date))
    sources=[s for s in sources if s['file'] not in filenames]+manifests
    (DATA/'products.json').write_text(json.dumps(products,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (DATA/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (DATA/'remaining-catalog-evidence.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    runpy.run_path(str(ROOT/'scripts/prepare-theater-images.py'))['prepare']()
    print(json.dumps(dict(total=len(products),sources=manifests),indent=2))


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,default=ROOT.parent/'home 3d')
    main(parser.parse_args().source)
