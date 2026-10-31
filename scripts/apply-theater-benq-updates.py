"""Apply reviewed BenQ screenshot prices; preserve every other source record.

No prices come from the Internet. Published BenQ pages supply model photos and
projection specifications, while the two user-supplied screenshots supply MRP.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src/data/theater"


def apply_updates(products, sources):
    updates = json.loads((DATA / "benq-price-updates-2026-10.json").read_text(encoding="utf8"))
    details = json.loads((DATA / "catalog-additions-details.json").read_text(encoding="utf8"))
    by_id = {p["id"]: p for p in products}
    for entry in updates["items"]:
        p = by_id.get(entry["id"])
        if p is None:
            p = dict(id=entry["id"], brand="BenQ", model=entry["model"], category="projector", roles=["projector"], series="4K Laser Home Cinema", finishes=[], issues=[], specs={})
            short = "short-throw smart" if entry["model"].endswith("STi") else "home cinema"
            p["description"] = f"4K UHD laser {short} projector. 3200 ANSI lumens; 95% Rec.709; HDR10 / HLG; 4.2 ms input lag at 1080p 240 Hz."
            products.append(p)
            by_id[p["id"]] = p
        p["specs"].update(entry["specs"])
        p["specs"]["warranty"] = "3 years on the projector (on-site), per supplied price list"
        photo = details[p["id"]]
        p["image"], p["imageSource"] = photo["image"], photo["imageSource"]
        p["issues"] = [issue for issue in p["issues"] if "price requires confirmation" not in issue.lower() and "gst rate requires confirmation" not in issue.lower()]
        source = updates["sources"][entry["source"]]
        p["source"] = {key: source[key] for key in ["file", "page", "effectiveDate", "sha256", "validUntil"]}
        p["price"] = dict(amountPaise=round(entry["amountInr"] * 100), taxBasis="inclusive", gstRate=0, unit="unit", packSize=1, revision=0)
    names = {s["file"] for s in updates["sources"]}
    sources[:] = [s for s in sources if s["file"] not in names] + updates["sources"]
    for source in sources:
        source["products"] = sum(p["source"]["file"] == source["file"] for p in products)
    return products, sources


if __name__ == "__main__":
    products = json.loads((DATA / "products.json").read_text(encoding="utf8"))
    sources = json.loads((DATA / "sources.json").read_text(encoding="utf8"))
    apply_updates(products, sources)
    (DATA / "products.json").write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    (DATA / "sources.json").write_text(json.dumps(sources, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print("Applied four supplied BenQ prices and two new laser-projector models.")
