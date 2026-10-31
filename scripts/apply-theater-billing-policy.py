"""Apply the customer's 2026-10-31 seed-catalog billing confirmation.

Only billing metadata changes; PDF amounts, source provenance and images remain
untouched. This never connects to Firestore or changes administrator overrides.
See docs/theater-catalog-imports.md for source and online research limitations.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src/data/theater/products.json"
RESOLVED_ISSUES = {
    "Selling unit requires confirmation",
    "Tax inclusion requires confirmation",
}


def apply_confirmed_billing(products):
    for product in products:
        if product["brand"] not in {"Canton", "FAITH"}:
            continue
        # A Movie set is ONE billable complete package, not six billable pieces.
        movie = product["brand"] == "Canton" and product["model"].startswith("Movie ")
        product["price"].update(
            unit="set" if movie else "unit",
            packSize=1,
            taxBasis="inclusive",
            # Final selling amounts include any tax; do not assert a zero tax rate.
            gstRate=None,
        )
        product["issues"] = [
            issue for issue in product["issues"] if issue not in RESOLVED_ISSUES
        ]
    return products


def main():
    products = json.loads(CATALOG.read_text(encoding="utf-8"))
    apply_confirmed_billing(products)
    CATALOG.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"reviewedProducts": sum(p["brand"] in {"Canton", "FAITH"} for p in products)}))


if __name__ == "__main__":
    main()
