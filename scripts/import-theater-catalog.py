"""Repeatable import of the nine supplied price lists; no network requests.
Requires pdfplumber, pypdfium2 and Pillow. Source PDFs are never changed.
"""
import argparse, hashlib, json, re, sys
from pathlib import Path
import pdfplumber
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image, ImageChops

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/data/theater"
IMAGES = ROOT / "public/theater-catalog"
SOURCES = [
    ("Canton", "CANTON", "2025-10-01", "unknown"),
    ("JVC", "Dealer", "2026-04-01", "inclusive"),
    ("Denon", "Denon", "2025-02-01", "inclusive"),
    ("FAITH", "FAITH", "2025-05-01", "exclusive"),
    ("KEF", "KEF", "2024-10-01", "inclusive"),
    ("Klipsch", "KLIPSCH", "2024-12-01", "unknown"),
    ("SVS", "MRP_SVS", "2025-05-19", "inclusive"),
    ("Onkyo", "Onkyo", "2024-11-01", "unknown"),
    ("Polk", "POLK", "2026-02-01", "inclusive"),
]
# These model-column labels overlap vertical section labels in the source PDF.
# Transcribed against the printed table, in priced-row order; descriptions and
# prices still come from the individual table cells, not this correction list.
POLK = [
    ["ES60 (Pair)","ES55 (Pair)","ES50 (Pair)","ES35 (Unit)","ES30 (Unit)","ES20 (Pair)","ES15 (Pair)","ES10 (Pair)","ES90 (Pair)","Monitor XT70 (Pair)","Monitor XT60 (Pair)","Monitor XT20 (Pair)","Monitor XT15 (Pair)","Monitor XT35 (Unit)","Monitor XT30 (Unit)","Monitor XT90 (Pair)"],
    ["R700 (Pair)","R600 (Pair)","R500 (Pair)","R200 (Unit)","R100 (Pair)","R400C (Unit)","R350C (Unit)","R300C (Unit)","R900 (Pair)","T50 (Pair)","T15 (Pair)","T30 (Unit)","T-15 - 5.1 PACKAGE","E-10 - 5.1 PACKAGE","ES-On-Wall L-C-R Package"],
    ["PSW10","Monitor XT10","Monitor XT12","ES08 SUB","ES10 SUB","ES12 SUB","OWM 3 Surround (Pair)","Signa S3","Signa S4","MagniFi Mini AX","MagniFi MAX AX","React Bar","React Sub","MagniFi Surround SR2","Atrium8 (Unit)","Atrium5 (Pair)","Atrium 4 (Pair)","Sub100 (Unit)","Sat300 (Unit)"],
    ["VS 265-LS (Unit)","VS 255C-LS (Unit)","VS 265 RT (Unit)","VS 255c-RT (Unit)","VS 65-RT (Unit)","V85 (Unit)","V65 (Unit)","RC85i Rectangular (Pair)","RC65i Rectangular (Pair)","RC55i Rectangular (Pair)","VS80 F/X-LS (Pair)","VS80 F/X-RT (Pair)"],
    ["RC80i Round (Pair)","RC60i Round (Pair)","V80 in Ceiling (Unit)","V60 Slim Ceiling (Unit)","V60 In Ceiling (Unit)","V6S (Unit)","RC6S (Unit)"]
]

def clean(s):
    return re.sub(r"\s+", " ", re.sub(r"\(cid:\d+\)", " ", s or "")).strip()

def money(s):
    # Match the number, not punctuation in currency prefixes such as "Rs.".
    match = re.search(r"\d[\d,]*(?:\.\d{1,2})?", s or "")
    number = float(match.group(0).replace(",", "")) if match else 0
    return round(number * 100) if number > 0 else None

def classify(brand, model, description, kind=""):
    m, t = model.lower(), (kind + " " + model + " " + description).lower()
    t=re.sub(r"[\u2010-\u2015\u2212]","-",t)
    if brand == "JVC": return "projector", ["projector"]
    if "package" in m or "movie " in m or m.startswith(("hts-", "ht-s")) or "set" == kind.lower(): return "package", ["package"]
    if "upgrade" in m or m.startswith("avs-"): return "accessory", ["extra"]
    if brand == "Onkyo" or (brand == "Denon" and m.startswith(("avr-", "avc-", "dra-"))): return "receiver", ["receiver"]
    if any(x in t for x in ["soundbar", "sound bar", "surround bar"]) or m.startswith(("signa", "magnifi", "react bar")): return "soundbar", ["extra"]
    if description.strip().lower()=="grill" or any(x in m for x in ["grill", "stand", "bracket", "desk pad", "upgrade", "avs-3", "wa-2", "stake"]): return "accessory", ["extra"]
    if (brand == "Denon" and m.startswith(("pma-", "heos amp", "home amp", "heos drive"))) or m.startswith("kasa"): return "amplifier", ["amplifier"]
    if brand == "Denon": return "other", ["extra"]
    if brand=="KEF" and ("wireless" in m or m.startswith(("ls-60", "ls 50- pair w", "egg-duo", "c music"))): return "active-speaker", ["extra"]
    if brand == "SVS" or "subwoofer" in kind.lower() or re.search(r"sub[- ]?woofer",t) or re.search(r"\bsub\b|^pb\s|^sb\s|^psw|^kc\s|^kf92|^kube|^asf|^townus 12", m): return "subwoofer", ["subwoofer"]
    if "outdoor" in t or "all-weather" in t or "garden" in t or "burial" in t: return "outdoor", ["extra"]
    if "stereo speaker" in t:return "stereo-speaker",["extra"]
    if "invisible" in t or "invisibile" in t: return "in-wall", ["front", "center", "surround", "rear"]
    if re.search(r"in[- ]?ceil|inceil", t) or (brand == "FAITH" and m.startswith("fc-")): return "ceiling", ["height"]
    if re.search(r"in[- ]?wall|inwall", t): return "in-wall", ["front", "center", "surround", "rear"]
    if "atmos" in kind.lower() or "atmos" in m or m.startswith(("ar ","r 8a","q8","q50")) or (brand == "Polk" and ("900" in m or "90 (" in m)): return "height", ["height", "surround", "rear"]
    if "center" in t or "centre" in t or re.search(r"\b\d+c\b", m) or (brand=="Canton" and re.match(r"vento 50|townus 50|ergo 655|gle 50",m)): return "center", ["center"]
    if "floor" in t or "tower" in t: return "floorstanding", ["front"]
    if brand == "Canton" and re.match(r"alpha|reference [12357](?: |$)|vento (?:100|90|80)|townus (?:100|90)|ergo 690|gle (?:100|90|80|70)",m): return "floorstanding", ["front"]
    if brand=="KEF" and ("wireless" in m or m.startswith(("ls-60", "ls 50- pair w", "egg-duo", "c music"))): return "active-speaker", ["extra"]
    if "on-wall" in t or "onwall" in t or "on wall" in t: return "on-wall", ["front", "surround", "rear"]
    return "bookshelf", ["front", "surround", "rear"]

def specs_for(brand, model, desc):
    s = {}; t = desc.lower()
    if 'package' in model.lower() or model.lower().startswith('movie ') or 'theatre pack' in model.lower() or model.lower().startswith('hts-'):
        s['packageContents']={'front':2,'center':1} if 'l-c-r' in model.lower() else {'front':2,'center':1,'surround':2,'subwoofer':1}
        if brand=='Onkyo':s['packageContents']['receiver']=1;s['packageReceiverChannels']=7 if '5915' in model else 5
        if '5915' in model:s['packageContents']['height']=2
    if brand == "JVC":
        lm = re.search(r"([\d, ]+)\s*ansi", t)
        if lm: s["lumens"] = int(re.sub(r"\D", "", lm.group(1)))
        # Manufacturer lens specifications checked 2026-10-20; keep their source
        # separate from the supplied Indian price list. Ratios use image width.
        jvc={
            "LX-NZ30B":(1.36,2.18,"https://www.jvc.com/in/projectors/dlp/lx-nz30w/"),
            "DLA-NZ500BE":(1.34,2.14,"https://eu.jvc.com/projectors/d-ila-projector/DLA-NZ500BE/"),
            "DLA-NZ700BE":(1.34,2.14,"https://eu.jvc.com/projectors/d-ila-projector/DLA-NZ700BE/"),
            "DLA-NZ800BE":(1.43,2.92,"https://www.jvc.com/in/projectors/d-ila/dla-nz800/"),
            "DLA-NZ9BE":(1.35,2.75,"https://www.jvc.com/in/projectors/d-ila/dla-nz9/"),
            "DLA-NZ900BE":(1.35,2.75,"https://www.jvc.com/nz/projectors/dila/dla-nz900/")}
        if model in jvc:
            lo,hi,url=jvc[model];s.update(throwMin=lo,throwMax=hi,sourceUrl=url)
    if brand in ["Denon", "Onkyo"]:
        channels = re.search(r"(\d{1,2})\.(\d)\s*(?:ch|receiver)", t)
        if channels: s.update(amplifiedChannels=int(channels[1]), processedChannels=int(channels[1]))
        ch = re.search(r"(\d{1,2})\s*(?:/\s*(\d{1,2}))?\s*ch", t)
        if ch and not channels:
            s["amplifiedChannels"] = int(ch[1]); s["processedChannels"] = int(ch[2] or ch[1])
        if brand == "Onkyo":
            a = re.search(r"ftc\s*x\s*(\d+)\s*ch", t)
            if a: s["amplifiedChannels"] = int(a[1])
            if model=="TX08470":s.update(amplifiedChannels=2,processedChannels=2)
        override = {"AVC-X3800H":(9,11),"AVC-X4800H":(9,11),"AVC-X6800H":(11,13),"AVC-X8500HA":(13,13),"AVC-A110 (limited)":(13,13),"AVC-A1H":(15,15),"AVC-A10H":(13,13),"TX-RZ-50":(9,11),"TX-RZ-70":(11,11)}
        if model in override: s.update(zip(["amplifiedChannels","processedChannels"], override[model]))
        s["atmos"] = "dolby atmos" in t and not (s.get("amplifiedChannels",0) < 7)
    ohm = re.search(r"(?:nominal impedance|impedance|impedence)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:ohm|Ω)", t)
    if ohm: s["impedanceOhms"] = float(ohm[1])
    # Only use triples whose axis order and measurement unit are explicit.
    dim=re.search(r"(?:overall speaker |overall |speaker |product )?dimensions\s*[:：]?\s*\(\s*([whd])\s*[x×]\s*([whd])\s*[x×]\s*([whd])\s*\)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*([\"″]?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[\"″]?\s*[x×]\s*(\d+(?:\.\d+)?)\s*([\"″]|mm|cm|in)?",t,re.I)
    if dim:
        unit=dim[5] or dim[8];factor={'mm':.001,'cm':.01,'in':.0254,'"':.0254,'″':.0254}.get(unit)
        if factor and len(set(dim.group(1,2,3)))==3:
            axes=dict(zip(dim.group(1,2,3),[float(dim[n])*factor for n in [4,6,7]]))
            s['dimensions']=[round(axes[k],5) for k in ['w','h','d']]
    depth=re.search(r"mounting depth\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(mm|cm|[\"″])",t)
    if depth:s['mountingDepth']=round(float(depth[1])*{'mm':.001,'cm':.01,'"':.0254,'″':.0254}[depth[2]],5)
    return s

def series_for(brand, model):
    m=model.upper()
    if brand=="Polk":
        if m.startswith("ES"):return "Signature Elite"
        if m.startswith("MONITOR XT"):return "Monitor XT"
        if re.match(r"R\d",m):return "Reserve"
        if m.startswith("RC"):return "RCi"
        if m.startswith("VS"):return "Vanishing"
        if re.match(r"T\d",m):return "T Fusion"
    if brand=="KEF":
        if m.startswith("Q"):return "Q Meta" if "META" in m else "Q"
        if m.startswith("R ") or re.match(r"R\d",m):return "R Meta" if "META" in m else "R"
        if m.startswith("CI"):return "Custom Install"
    return model.split()[0].split('-')[0]

def extract(source):
    products, manifest = [], []
    for brand, prefix, date, tax in SOURCES:
        file = next(source.glob(prefix + "*.pdf"))
        raw_hash = hashlib.sha256(file.read_bytes()).hexdigest()
        count = 0
        with pdfplumber.open(file) as pdf:
            renderer = pdfium.PdfDocument(str(file))
            image_reader = PdfReader(file)
            for page_no, page in enumerate(pdf.pages):
                rendered = None
                def add(model, desc, amount, unit="unknown", finish="", bbox=None, kind="", gst=None, issues=None, image_box=None):
                    nonlocal count, rendered
                    model, desc = clean(model), clean(desc)
                    if not model: raise ValueError("Empty product model")
                    if not finish and brand in ['Canton','KEF']:
                        colors=re.search(r"Black\s*/\s*White|Black/Wenge Brown|Walnut|Cherry|Frosted Blue|Forsted Blue|Black",model,re.I)
                        if colors:finish=colors.group(0)
                    if finish.strip().upper()=='N/A':finish=''
                    count += 1
                    ident = re.sub(r"[^a-z0-9]+", "-", brand.lower()+"-"+model.lower()).strip("-")
                    if any(p["id"] == ident for p in products): ident += f"-p{page_no+1}-{count}"
                    category, roles = classify(brand, model, desc, kind)
                    notes = list(issues or [])
                    if amount is None: notes.append("Price requires confirmation")
                    if tax == "unknown": notes.append("Tax inclusion requires confirmation")
                    if unit == "unknown": notes.append("Selling unit requires confirmation")
                    image = None
                    if bbox:
                        # Select the largest image contained in this product's image column.
                        candidates = [im for im in page.images if im["width"]>7 and im["height"]>7 and bbox[0]-2 <= (im["x0"]+im["x1"])/2 <= bbox[2]+2 and bbox[1] <= (im["top"]+im["bottom"])/2 <= bbox[3]]
                        if candidates:
                            im = max(candidates,key=lambda im:im["width"]*im["height"])
                            box = (max(0,im["x0"]-2),max(0,im["top"]-2),min(page.width,im["x1"]+2),min(page.height,im["bottom"]+2))
                            try:
                                # Extract the image XObject with its alpha mask;
                                # cropping a rendered page can capture overlaid
                                # model text and table borders around the photo.
                                original=image_reader.pages[page_no].images['/'+im['name']].image.convert("RGBA")
                                crop=Image.new("RGBA",original.size,"white");crop.alpha_composite(original);crop=crop.convert("RGB")
                                diff=ImageChops.difference(crop,Image.new("RGB",crop.size,"white")).convert("L").point(lambda p:255 if p>14 else 0)
                                trim=diff.getbbox()
                                if trim:crop=crop.crop((max(0,trim[0]-3),max(0,trim[1]-3),min(crop.width,trim[2]+3),min(crop.height,trim[3]+3)))
                            except Exception:
                                if rendered is None: rendered = renderer[page_no].render(scale=2).to_pil().convert("RGB")
                                crop = rendered.crop(tuple(round(x*2) for x in box))
                            crop.thumbnail((520,420))
                            crop.save(IMAGES/(ident+".webp"),"WEBP",quality=86)
                            image = "/theater-catalog/"+ident+".webp"
                    pack_size=2 if unit=='pair' or brand=='SVS' and model.startswith('3000 In-Wall Dual') else 1 if unit in ['unit','set'] else None
                    products.append(dict(id=ident, brand=brand, model=model, category=category, roles=roles, series=series_for(brand,model), description=desc, image=image, finishes=[clean(x) for x in re.split(r"/|\n",finish) if clean(x)], specs=specs_for(brand,model,desc), issues=notes, source=dict(file=file.name,page=page_no+1,effectiveDate=date,sha256=raw_hash), price=dict(amountPaise=amount,taxBasis=tax,gstRate=gst,unit=unit,packSize=pack_size,revision=0)))
                if brand == "JVC":
                    text = page.extract_text()
                    for match in re.finditer(r"JVC\.\s+([A-Z0-9-]+)\.\s+MRP\s*\.\s*Rs\.\s*([\d,.]+)\s*(.*?)(?=JVC\.|Terms & Conditions)",text,re.S):
                        add(match[1],match[3],money(match[2]),"unit",gst=18)
                    continue
                polk_idx = 0
                for table in page.find_tables():
                    for ri,(cells,row) in enumerate(zip(table.extract(),table.rows)):
                        cells = [c or "" for c in cells]
                        if brand == "Canton" and len(cells)==5 and cells[0].isdigit():
                            desc=cells[2]; model=desc.split('\n')[0]
                            add(model,desc,money(cells[4]),bbox=row.cells[1],gst=18)
                        elif brand == "Denon" and len(cells)==3 and ("₹" in cells[2] or "TBA" in cells[2]):
                            box=row.cells[0]; model=" ".join(l for l in cells[0].splitlines() if l.strip())
                            add(model,cells[1],money(cells[2]),"unit",bbox=box)
                        elif brand == "FAITH" and len(cells)==5 and cells[2] and re.match(r"^[\d,]+\.\d{2}$",cells[4]):
                            desc=cells[1]
                            if cells[2]=="FS-9218" and ri: desc=(table.extract()[ri-1][1] or "")+" "+desc
                            add(cells[2],desc,money(cells[4]),bbox=row.cells[3])
                        elif brand == "KEF" and len(cells)==6 and "₹" in cells[3]:
                            model=clean(cells[0]); desc=clean(cells[2]);
                            if desc=="GRILL":model+=" GRILL"
                            unit="pair" if "pair" in model.lower() else "unit" if "unit" in model.lower() or "subwoofer" in desc.lower() or "amplif" in desc.lower() else "unknown"
                            add(model,desc,money(cells[3]),unit,bbox=row.cells[1],gst=18)
                        elif brand == "Klipsch" and len(cells)==8 and re.match(r"^[\d,]+$",cells[7]):
                            unit={"each":"unit","pair":"pair","set":"set"}.get(cells[6].lower(),"unknown")
                            add(cells[1],cells[3],money(cells[7]),unit,cells[4],row.cells[0],cells[2])
                        elif brand == "SVS" and len(cells)==5 and "Rs." in cells[4]:
                            model=cells[0]; unit="unit"
                            if "System" in model: model="3000 In-Wall "+model;unit="set"
                            add(model,"Subwoofer; "+("ported" if model.startswith("PB") else "sealed" if model.startswith("SB") else ""),money(cells[4]),unit,cells[1],gst=18)
                        elif brand == "Onkyo" and len(cells)==7 and re.match(r"^[\d,]+$",cells[6]):
                            add(cells[1],cells[3],money(cells[6]),"set" if cells[5].lower()=="set" else "unit",cells[4],row.cells[2])
                        elif brand == "Polk":
                            pi=next((i for i,c in enumerate(cells) if c.startswith("₹")),None)
                            if pi is None:continue
                            model=POLK[page_no][polk_idx];polk_idx+=1
                            unit="pair" if "(Pair)" in model else "set" if "package" in model.lower() else "unit"
                            issues=[]
                            if model=="R200 (Unit)":unit="unknown";issues=["Source model says Unit; description says Pair"]
                            add(model,cells[pi-2],money(cells[pi]),unit,cells[pi-1],row.cells[pi-3],gst=18,issues=issues)
                if brand == "Polk" and polk_idx != len(POLK[page_no]): raise ValueError(f"Polk page {page_no+1}: expected {len(POLK[page_no])}, got {polk_idx}")
            renderer.close()
        manifest.append(dict(brand=brand,file=file.name,sha256=raw_hash,pages=len(pdf.pages),products=count))
    return products, manifest

if __name__ == "__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--source",default=str(ROOT.parent/"home 3d"));args=parser.parse_args()
    OUT.mkdir(parents=True,exist_ok=True);IMAGES.mkdir(parents=True,exist_ok=True)
    products,manifest=extract(Path(args.source))
    (OUT/"products.json").write_text(json.dumps(products,ensure_ascii=False,indent=2),encoding="utf-8")
    (OUT/"sources.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
    # Reviewed manufacturer images supplement price lists without product photos.
    # Rebuild the immutable JPEGs consumed by the quotation renderer as well.
    import runpy
    runpy.run_path(str(ROOT/"scripts/prepare-theater-images.py"))["prepare"]()
    print(json.dumps(dict(products=len(products),images=sum(bool(p['image']) for p in products),sources=manifest),indent=2))
