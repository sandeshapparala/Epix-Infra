"""Prepare immutable, bounded JPEG assets for offline quotation PDFs.

Run after importing the PDFs or updating image-overrides.json. Manufacturer
photos are reviewed separately; this script never guesses a model's image.
"""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib
import io
import json

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/data/theater'
PUBLIC = ROOT / 'public'

def prepare():
    products = json.loads((DATA / 'products.json').read_text(encoding='utf-8'))
    overrides_path = DATA / 'image-overrides.json'
    overrides = json.loads(overrides_path.read_text(encoding='utf-8')) if overrides_path.exists() else {}
    out = PUBLIC / 'theater-catalog/quotation'
    out.mkdir(parents=True, exist_ok=True)
    for p in products:
        if p['id'] in overrides:
            p['image'] = overrides[p['id']]['image']
            p['imageSource'] = overrides[p['id']]['source']
        if not p.get('image'):
            raise ValueError(f"Photo missing for {p['id']}")
        source = PUBLIC / p['image'].lstrip('/')
        with Image.open(source) as im:
            im = ImageOps.exif_transpose(im).convert('RGBA')
            im.thumbnail((640, 480), Image.Resampling.LANCZOS)
            canvas = Image.new('RGB', im.size, 'white')
            canvas.paste(im, mask=im.getchannel('A'))
            buf = io.BytesIO()
            canvas.save(buf, 'JPEG', quality=88, optimize=True)
        content = buf.getvalue()
        digest = hashlib.sha256(content).hexdigest()
        target = out / f'{digest[:24]}.jpg'
        target.write_bytes(content)
        p['quoteImage'] = '/theater-catalog/quotation/' + target.name
    (DATA / 'products.json').write_text(json.dumps(products, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f'Prepared model images and quotation thumbnails for {len(products)} entries.')

if __name__ == '__main__':
    prepare()
