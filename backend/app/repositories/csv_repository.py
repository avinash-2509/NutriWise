from __future__ import annotations

import csv
import os
from dataclasses import dataclass
from pathlib import Path

from pydantic import ValidationError

from app.schemas.models import Product


CSV_COLUMNS = [
    "product_id", "product_name", "brand", "category", "serving_size", "serving_unit",
    "nutrition_basis", "calories_kcal", "protein_g", "carbohydrates_g", "total_sugar_g",
    "added_sugar_g", "total_fat_g", "saturated_fat_g", "fiber_g", "sodium_mg", "ingredients",
    "allergens_declared", "collected_at", "collection_location", "source_notes",
]
NUMERIC_COLUMNS = {
    "serving_size", "calories_kcal", "protein_g", "carbohydrates_g", "total_sugar_g",
    "added_sugar_g", "total_fat_g", "saturated_fat_g", "fiber_g", "sodium_mg",
}


@dataclass
class LoadResult:
    products: list[Product]
    issues: list[dict]


def data_path() -> Path:
    configured = os.getenv("NUTRIWISE_DATA_PATH")
    if configured:
        path = Path(configured)
        return path if path.is_absolute() else (Path(__file__).resolve().parents[3] / path).resolve()
    return Path(__file__).resolve().parents[3] / "data.csv"


def _blank_to_none(row: dict[str, str]) -> dict:
    result = {}
    for key, value in row.items():
        if value is None or not str(value).strip():
            result[key] = None
        elif key in NUMERIC_COLUMNS:
            result[key] = str(value).strip()
        else:
            result[key] = str(value).strip()
    return result


def load_products(path: Path | None = None) -> LoadResult:
    path = path or data_path()
    if not path.exists():
        return LoadResult([], [{"row": 0, "code": "file_missing", "message": f"CSV not found: {path}"}])

    products: list[Product] = []
    issues: list[dict] = []
    seen: set[str] = set()
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = reader.fieldnames or []
        missing_columns = [column for column in CSV_COLUMNS if column not in headers]
        if missing_columns:
            issues.append({"row": 1, "code": "missing_columns", "message": f"Missing columns: {', '.join(missing_columns)}"})
            return LoadResult([], issues)

        for row_number, raw in enumerate(reader, start=2):
            extra = raw.get(None)
            if extra:
                issues.append({"row": row_number, "code": "extra_columns", "message": "Row has more cells than the header."})
                continue
            try:
                product = Product.model_validate(_blank_to_none(raw))
                if product.product_id in seen:
                    issues.append({"row": row_number, "code": "duplicate_id", "message": f"Duplicate product_id: {product.product_id}"})
                    continue
                seen.add(product.product_id)
                products.append(product)
            except ValidationError as exc:
                message = "; ".join(
                    f"{'.'.join(str(part) for part in item['loc'])}: {item['msg']}" for item in exc.errors()
                )
                issues.append({"row": row_number, "code": "invalid_row", "message": message})
    return LoadResult(products, issues)


def get_product(product_id: str, path: Path | None = None) -> Product | None:
    return next((product for product in load_products(path).products if product.product_id == product_id), None)


def import_csv(upload_path: Path, destination: Path | None = None) -> LoadResult:
    """Validate an import, then append only non-duplicate rows to the canonical CSV."""
    destination = destination or data_path()
    incoming = load_products(upload_path)
    if incoming.issues:
        return incoming
    existing = load_products(destination)
    if existing.issues:
        return LoadResult([], [{"row": 0, "code": "destination_invalid", "message": "The existing data.csv has validation issues; fix it before importing."}, *existing.issues])
    existing_ids = {product.product_id for product in existing.products}
    duplicates = sorted(existing_ids.intersection(product.product_id for product in incoming.products))
    if duplicates:
        return LoadResult([], [{"row": 0, "code": "existing_id", "message": f"Import would overwrite existing IDs: {', '.join(duplicates)}"}])

    destination.parent.mkdir(parents=True, exist_ok=True)
    write_header = not destination.exists() or destination.stat().st_size == 0
    with destination.open("a", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        if write_header:
            writer.writeheader()
        for product in incoming.products:
            row = product.model_dump(mode="json")
            writer.writerow({column: "" if row.get(column) is None else row.get(column) for column in CSV_COLUMNS})
    return LoadResult(incoming.products, [])
