import csv
from pathlib import Path

from app.repositories.csv_repository import CSV_COLUMNS, load_products


def write_csv(path: Path, rows: list[dict], columns=CSV_COLUMNS):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


def row(**changes):
    base = {column: "" for column in CSV_COLUMNS}
    base.update({
        "product_id": "p1", "product_name": "Test food", "serving_size": "30", "serving_unit": "g",
        "nutrition_basis": "per_serving", "calories_kcal": "120", "protein_g": "8.5",
    })
    base.update(changes)
    return base


def test_valid_csv_preserves_decimal_and_missing(tmp_path):
    path = tmp_path / "data.csv"
    write_csv(path, [row()])
    result = load_products(path)
    assert not result.issues
    assert result.products[0].protein_g == 8.5
    assert result.products[0].added_sugar_g is None


def test_empty_csv(tmp_path):
    path = tmp_path / "data.csv"
    write_csv(path, [])
    result = load_products(path)
    assert result.products == []
    assert result.issues == []


def test_missing_columns_are_reported(tmp_path):
    path = tmp_path / "data.csv"
    write_csv(path, [], columns=["product_id"])
    assert load_products(path).issues[0]["code"] == "missing_columns"


def test_invalid_negative_and_duplicate_rows_are_reported(tmp_path):
    path = tmp_path / "data.csv"
    write_csv(path, [row(protein_g="-1"), row(), row()])
    result = load_products(path)
    assert len(result.products) == 1
    assert {issue["code"] for issue in result.issues} == {"invalid_row", "duplicate_id"}
