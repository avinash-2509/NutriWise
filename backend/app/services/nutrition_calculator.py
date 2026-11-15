from app.schemas.models import NutritionData


NUTRIENT_FIELDS = (
    "calories_kcal",
    "protein_g",
    "carbohydrates_g",
    "total_sugar_g",
    "added_sugar_g",
    "total_fat_g",
    "saturated_fat_g",
    "fiber_g",
    "sodium_mg",
)


def scale_nutrition(nutrition: NutritionData, quantity: float) -> dict:
    """Scale declared values without converting their declared measurement basis."""
    totals = {
        field: (getattr(nutrition, field) * quantity if getattr(nutrition, field) is not None else None)
        for field in NUTRIENT_FIELDS
    }
    return {
        "product_name": nutrition.product_name,
        "nutrition_basis": nutrition.nutrition_basis.value,
        "serving_size": nutrition.serving_size,
        "serving_unit": nutrition.serving_unit,
        "quantity": quantity,
        "totals": totals,
    }


def normalized_per_100(nutrition: NutritionData) -> dict | None:
    """Return comparable per-100 values only when mass/volume conversion is valid."""
    if nutrition.nutrition_basis.value in {"per_100g", "per_100ml"}:
        return {field: getattr(nutrition, field) for field in NUTRIENT_FIELDS}
    if not nutrition.serving_size or nutrition.serving_unit not in {"g", "ml"}:
        return None
    factor = 100 / nutrition.serving_size
    return {
        field: (getattr(nutrition, field) * factor if getattr(nutrition, field) is not None else None)
        for field in NUTRIENT_FIELDS
    }
