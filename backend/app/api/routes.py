from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.repositories.csv_repository import get_product, import_csv, load_products
from app.schemas.models import AlternativesRequest, AnalysisRequest, ComparisonRequest, RecommendationRequest
from app.services.comparison_engine import compare_products, find_alternatives
from app.services.nutrition_calculator import scale_nutrition
from app.services.ocr_service import OCRUnavailable, process_image
from app.services.recommendation_engine import recommend


router = APIRouter(prefix="/api")


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "NutriWise API"}


@router.post("/ocr/extract")
async def extract_ocr(
    nutrition_label: UploadFile | None = File(default=None),
    ingredients_label: UploadFile | None = File(default=None),
) -> dict:
    if nutrition_label is None and ingredients_label is None:
        raise HTTPException(status_code=422, detail="Upload at least one label image.")
    result = {"nutrition": {"raw_text": "", "fields": {}, "warnings": []}, "ingredients": {"raw_text": "", "warnings": []}}
    for kind, upload in [("nutrition", nutrition_label), ("ingredients", ingredients_label)]:
        if upload is None:
            continue
        content = await upload.read(10 * 1024 * 1024 + 1)
        try:
            processed = process_image(content, upload.filename or "upload", upload.content_type, parse_values=kind == "nutrition")
            if kind == "ingredients":
                result[kind] = {"raw_text": processed["raw_text"], "warnings": processed["warnings"]}
            else:
                result[kind] = processed
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except OCRUnavailable as exc:
            result[kind]["warnings"].append(str(exc))
    return result


@router.post("/nutrition/analyze")
def analyze_nutrition(payload: AnalysisRequest) -> dict:
    return scale_nutrition(payload.nutrition, payload.quantity)


@router.post("/recommendations")
def recommendations(payload: RecommendationRequest) -> dict:
    return recommend(payload.nutrition, payload.quantity, payload.profile).model_dump(mode="json")


@router.get("/products")
def products() -> dict:
    loaded = load_products()
    return {
        "products": [product.model_dump(mode="json") for product in loaded.products],
        "issues": loaded.issues,
        "count": len(loaded.products),
    }


@router.get("/products/{product_id}")
def product(product_id: str) -> dict:
    found = get_product(product_id)
    if not found:
        raise HTTPException(status_code=404, detail="Product not found.")
    return found.model_dump(mode="json")


@router.post("/products/compare")
def compare(payload: ComparisonRequest) -> dict:
    a, b = get_product(payload.product_a_id), get_product(payload.product_b_id)
    if not a or not b:
        raise HTTPException(status_code=404, detail="One or both products were not found.")
    if a.product_id == b.product_id:
        raise HTTPException(status_code=422, detail="Choose two different products.")
    return compare_products(a, b, payload.goal)


@router.post("/products/alternatives")
def alternatives(payload: AlternativesRequest) -> dict:
    loaded = load_products()
    current = next((item for item in loaded.products if item.product_id == payload.product_id), None)
    if not current:
        raise HTTPException(status_code=404, detail="Product not found.")
    return {"alternatives": find_alternatives(current, loaded.products, payload.goal, payload.limit)}


@router.post("/products/import", status_code=status.HTTP_201_CREATED)
async def import_products(file: UploadFile = File(...)) -> dict:
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Import must be a CSV file.")
    content = await file.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="CSV exceeds the 5 MB import limit.")
    with tempfile.TemporaryDirectory(prefix="nutriwise-import-") as directory:
        path = Path(directory) / "import.csv"
        path.write_bytes(content)
        result = import_csv(path)
    if result.issues:
        raise HTTPException(status_code=422, detail={"message": "Import was not written because validation failed.", "issues": result.issues})
    return {"imported": len(result.products), "product_ids": [item.product_id for item in result.products]}
