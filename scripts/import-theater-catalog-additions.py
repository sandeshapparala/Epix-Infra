"""Import the six October 2026 additions without replacing existing catalog items.

Source PDFs remain outside Git. Run with --source pointing to home 3d/new.
Prices come only from the supplied price columns, never manufacturer web pages.
Reviewed image/spec supplements are tracked in catalog-additions-details.json.
"""
import argparse
import hashlib
import io
import json
import re
import runpy
from pathlib import Path

import pdfplumber
import pymupdf
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/data/theater'
PUBLIC = ROOT / 'public/theater-catalog'
FILES = [
    ('Marantz', 'Marantz Price List July 2026.pdf', '2026-07-01'),
    ('Marantz', 'Marantz Price List Oct 2026.pdf', '2026-10-01'),
    ('Sony', 'SONY PRICE LIST MRP APRIL 2026.pdf', '2026-04-01'),
    ('BenQ', '4 Pager AI Cinema (W2720i & W4100i) Full Page Low Res.pdf', 'Undated brochure'),
    ('BenQ', 'GP520 Leaflet Low Res.pdf', 'Undated brochure'),
    ('BenQ', 'TK705STi Leaflet Low Res.pdf', 'Undated brochure'),
]

def clean(value):
    return re.sub(r'\s+', ' ', value or '').strip()

def ident(brand, model):
    return re.sub('[^a-z0-9]+', '-', f'{brand}-{model}'.lower()).strip('-')

def save_image(im, product_id):
    im = im.convert('RGBA')
    canvas = Image.new('RGBA', im.size, 'white')
    canvas.alpha_composite(im)
    im = canvas.convert('RGB')
    mask = ImageChops.difference(im, Image.new('RGB', im.size, 'white')).convert('L').point(lambda p: 255 if p > 15 else 0)
    bbox = mask.getbbox()
    if bbox: im = im.crop((max(0,bbox[0]-4), max(0,bbox[1]-4), min(im.width,bbox[2]+4), min(im.height,bbox[3]+4)))
    im.thumbnail((640,480), Image.Resampling.LANCZOS)
    im.save(PUBLIC / f'{product_id}.webp', 'WEBP', quality=88)
    return f'/theater-catalog/{product_id}.webp'

def crop_page(pdf, page, box, product_id):
    pix = pdf[page-1].get_pixmap(matrix=pymupdf.Matrix(2,2), clip=pymupdf.Rect(box), alpha=False)
    return save_image(Image.frombytes('RGB',(pix.width,pix.height),pix.samples), product_id)

def main(source):
    PUBLIC.mkdir(exist_ok=True, parents=True)
    details = json.loads((DATA / 'catalog-additions-details.json').read_text(encoding='utf8'))
    additions = {}
    manifest = []
    for brand, filename, date in FILES:
        file = source / filename
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        doc = pymupdf.open(file)
        parsed_count = 0

        def add(model, description, amount, category, roles, page, series='', specs=None, image=None, issues=None):
            nonlocal parsed_count
            parsed_count += 1
            product_id = ident(brand, model)
            supplement = details.get(product_id, {})
            notes = list(issues or [])
            if amount is None: notes.append('Price requires confirmation; brochure contains no selling price.')
            notes.append('GST rate requires confirmation; not stated in the supplied document.')
            p = dict(id=product_id, brand=brand, model=model, category=category, roles=roles,
                series=series, description=description, image=image or supplement.get('image'), finishes=[],
                specs={**(specs or {}), **supplement.get('specs', {})}, issues=notes + supplement.get('issues', []),
                source=dict(file=filename,page=page,effectiveDate=date,sha256=digest),
                price=dict(amountPaise=amount,taxBasis='inclusive' if amount is not None else 'unknown',gstRate=None,unit='unit',packSize=1,revision=0))
            if supplement.get('imageSource'): p['imageSource'] = supplement['imageSource']
            elif image: p['imageSource'] = f'{filename} · page {page}'
            if supplement.get('imageKind'): p['imageKind'] = supplement['imageKind']
            previous = additions.get(product_id)
            if previous: p['previousSources'] = [previous['source']]
            additions[product_id] = p

        if brand == 'Marantz':
            with pdfplumber.open(file) as pdf:
                for page_no, page in enumerate(pdf.pages,1):
                    bounds=sorted(set(round(e['top'],2) for e in page.edges if e.get('orientation')=='h' and e['width']>450))
                    for word in page.extract_words():
                        digits = word['text'].replace(',','')
                        if word['x0'] < 480 or not digits.isdigit() or len(digits) < 5: continue
                        cy=(word['top']+word['bottom'])/2
                        top=max(y for y in bounds if y<cy)
                        bottom=min(y for y in bounds if y>cy)
                        model=clean(page.crop((55,top,140,bottom)).extract_text())
                        model=clean(re.sub(r'\(Discuss Dealer Price\)|\bNew\b','',model,flags=re.I))
                        model=re.sub(r'^Marantz\s+','',model,flags=re.I)
                        description=clean(page.crop((270,top,510,bottom)).extract_text())
                        candidates=[im for im in doc[page_no-1].get_image_info(xrefs=True) if im['xref'] and 140<(im['bbox'][0]+im['bbox'][2])/2<270 and top<(im['bbox'][1]+im['bbox'][3])/2<bottom]
                        contained=[im for im in candidates if im['bbox'][1]>=top and im['bbox'][3]<=bottom]
                        if 'July' in filename and not contained:
                            # July embeds several neighbouring products in one XObject.
                            # Crop the reviewed image column by row instead of reusing the composite.
                            image=crop_page(doc,page_no,(120,top,274,bottom),ident(brand,model))
                        else:
                            if not candidates: raise ValueError(f'No product image: {model}')
                            chosen=max(contained or candidates,key=lambda im:im['width']*im['height'])
                            pix=pymupdf.Pixmap(doc,chosen['xref'])
                            if pix.colorspace and pix.colorspace.n>3: pix=pymupdf.Pixmap(pymupdf.csRGB,pix)
                            image=save_image(Image.open(io.BytesIO(pix.tobytes('png'))),ident(brand,model))
                        key=model.upper().replace(' ','').replace('-','')
                        specs={}
                        if key in ['GRANDHORIZON','HORIZON']: category,roles,series='active-speaker',['extra'],'Horizon'
                        elif key=='HORIZONTRIPOD': category,roles,series='accessory',['extra'],'Horizon'
                        elif key in ['AV10','AV20','AV30']:
                            category,roles,series='av-processor',['receiver'],'AV Separates'
                            specs=dict(amplifiedChannels=0,processedChannels={'AV10':15,'AV20':13,'AV30':11}[key],atmos=True)
                        elif key.startswith(('AMP','MM')):
                            category,roles,series='power-amplifier',['amplifier'],'AV Separates'
                            specs=dict(externalAmpChannels={'MM7025':2,'MM7055':5,'MM8077':7,'AMP30':6,'AMP20':12,'AMP10':16}[key],powerAmpDirect=True)
                        elif key.startswith('CINEMA'):
                            category,roles,series='receiver',['receiver'],'Cinema Series 2' if 'SERIES2' in key else 'Cinema'
                            channel={'CINEMA30':(11,13),'CINEMA40':(9,11),'CINEMA50':(9,11),'CINEMA50SERIES2':(9,11),'CINEMA60':(7,7),'CINEMA60SERIES2':(7,7),'CINEMA70S':(7,7)}[key]
                            specs=dict(amplifiedChannels=channel[0],processedChannels=channel[1],atmos=True)
                        elif key=='STEREO70S':
                            category,roles,series='stereo-receiver',['extra'],'Stereo'
                            specs=dict(amplifiedChannels=2,processedChannels=2,atmos=False)
                        elif key in ['MODELM1','MODELM4']:
                            category,roles,series='streaming-amplifier',['extra'],'Streaming & Distribution'
                        elif key.startswith(('CD','SA')): category,roles,series='cd-player',['extra'],'CD / SACD'
                        elif key.startswith('LINK') or key.startswith('MCR'): category,roles,series='network-player',['extra'],'Network Audio'
                        else: category,roles,series='integrated-amplifier',['extra'],'Stereo Components'
                        add(model,description,int(digits)*100,category,roles,page_no,series,specs,image)
            expected=35 if 'July' in filename else 38
            if parsed_count!=expected: raise ValueError(f'{filename}: expected {expected}, got {parsed_count}')
        elif brand == 'Sony':
            with pdfplumber.open(file) as pdf:
                rows=pdf.pages[0].find_tables()[0].extract()[1:]
                for group,size,series,code,model,amount in rows:
                    model=clean(model); amount=int(re.sub(r'\D','',amount))*100
                    specs={}; notes=[]
                    if size:
                        category,roles='professional-display',['tv']; specs={'diagonalInches':int(size),'resolution':'3840 × 2160','nativeAspect':'16:9'}
                        desc=f'{size}-inch BRAVIA {series} professional 4K display. Sony product code {code}.'
                    elif series=='Accessories':
                        category,roles=('software-license' if model=='WQ-BS1' else 'accessory'),['extra']
                        desc=f'{group} accessory; Sony product code {code}.'
                        if model=='WQ-BS1': desc='BRAVIA Signage software licence for professional displays.'
                        if model.startswith('ZM'): notes.append('Accessory code only: the price list does not identify its product or service type. Confirm description, coverage and billing unit before ordering.')
                    else:
                        category,roles=('projector' if group=='Home PJ' else 'business-projector'),['projector']
                        desc=f'{group} {series} projector. Sony product code {code}.'
                        if group=='Business PJ': notes.append('Business / installation projector: confirm native aspect ratio, cinema suitability and chosen lens on site.')
                    add(model,desc,amount,category,roles,1,series,specs,issues=notes)
                    if model.startswith('ZM'):
                        additions[ident(brand,model)]['price'].update(unit='unknown',packSize=None)
            if parsed_count!=36: raise ValueError(f'Sony: expected 36, got {parsed_count}')
        else:
            # Visual transcription of the supplied BenQ specification panels.
            # These leaflets contain ambiguous dimension-axis labels. Keep the
            # projection specifications, without guessing cabinet axis order.
            brochure = {
                FILES[3][1]: [('W2720i',6,(275,34,551,139),2500,1,1.3,[.420,.143,.305]),('W4100i',6,(880,33,1168,136),3200,1.15,1.5,[.4205,.3121,.1353])],
                FILES[4][1]: [('GP520',2,(465,672,580,750),2600,1.2,1.2,[.2413,.225,.151])],
                FILES[5][1]: [('TK705i',1,(303,454,570,612),3000,1,1.3,[.2292,.2497,.1682]),('TK705STi',1,(303,454,570,612),3000,.8,.8,[.2292,.2497,.1682])],
            }[filename]
            for model,page,box,lumens,lo,hi,dims in brochure:
                image=details.get(ident(brand,model),{}).get('image') or crop_page(doc,page,box,ident(brand,model))
                notes=['Verify enclosure dimension axis order before installation; the brochure labels are ambiguous.']
                specs=dict(lumens=lumens,throwMin=lo,throwMax=hi,resolution='3840 × 2160',nativeAspect='16:9',lightSource='4LED')
                features={
                    'W2720i':'AI picture quality tuning; Android TV with pre-installed Netflix; 1.3× optical zoom; 98% Rec.709.',
                    'W4100i':'AI Cinema; HDR10+; FILMMAKER MODE; HLG; Android TV; 1.3× optical zoom.',
                    'GP520':'Google TV with official Netflix; MEMC; automatic focus, keystone, screen fit and obstacle avoidance; 12W × 2 speakers.',
                    'TK705i':'Google TV; HDR10+; auto focus, screen fit, obstacle avoidance and eye protection; 1.0–1.3:1 lens; 8W treVolo × 2.',
                    'TK705STi':'Google TV; HDR10+; auto focus, screen fit, obstacle avoidance and eye protection; short-throw 0.8:1 lens; 8W treVolo × 2.',
                }
                add(model,'4K UHD 4LED smart projector. '+features[model],None,'projector',['projector'],page,'Smart Home Cinema',specs,image,notes)
        manifest.append(dict(brand=brand,file=filename,sha256=digest,pages=len(doc),parsedProducts=parsed_count,products=0,effectiveDate=date))
    for item in manifest:
        item['products']=sum(p['source']['file']==item['file'] for p in additions.values())
    old=json.loads((DATA/'products.json').read_text(encoding='utf8'))
    products=[p for p in old if p['brand'] not in ['Marantz','Sony','BenQ']]+list(additions.values())
    sources=json.loads((DATA/'sources.json').read_text(encoding='utf8'))
    names={item['file'] for item in manifest}
    sources=[s for s in sources if s['file'] not in names]+manifest
    runpy.run_path(str(ROOT/'scripts/apply-theater-benq-updates.py'))['apply_updates'](products,sources)
    missing=[p['id'] for p in products if not p.get('image') or not (ROOT/'public'/p['image'].lstrip('/')).exists()]
    if missing: raise ValueError(f'Missing reviewed image assets: {missing}')
    (DATA/'products.json').write_text(json.dumps(products,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (DATA/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    runpy.run_path(str(ROOT/'scripts/prepare-theater-images.py'))['prepare']()
    print(json.dumps(dict(added=len(additions),total=len(products),sources=manifest),indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',type=Path,default=ROOT.parent/'home 3d/new')
    main(parser.parse_args().source)
