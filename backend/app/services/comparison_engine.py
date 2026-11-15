from app.schemas.models import DietaryGoal, Product
from app.services.nutrition_calculator import normalized_per_100


GOAL_METRIC = {
    DietaryGoal.reduce_added_sugar: ("added_sugar_g", "lower"),
    DietaryGoal.increase_protein: ("protein_g", "higher"),
    DietaryGoal.muscle_building: ("protein_g", "higher"),
    DietaryGoal.lower_sodium: ("sodium_mg", "lower"),
    DietaryGoal.weight_management: ("calories_kcal", "lower"),
    DietaryGoal.weight_gain: ("protein_g", "higher"),
    DietaryGoal.balanced_eating: ("fiber_g", "higher"),
}


def _compatible_unit(a: Product, b: Product) -> str | None:
    units = {a.serving_unit, b.serving_unit}
    if units <= {"g"}:
        return "per 100 g"
    if units <= {"ml"}:
        return "per 100 ml"
    if a.nutrition_basis == b.nutrition_basis and a.nutrition_basis.value != "per_serving":
        return a.nutrition_basis.value.replace("_", " ")
    return None


def compare_products(a: Product, b: Product, goal: DietaryGoal) -> dict:
    basis = _compatible_unit(a, b)
    normalized_a = normalized_per_100(a)
    normalized_b = normalized_per_100(b)
    if not basis or normalized_a is None or normalized_b is None:
        return {
            "comparable": False,
            "comparison_basis": None,
            "product_a": a.model_dump(mode="json"),
            "product_b": b.model_dump(mode="json"),
            "explanation": "A fair numerical comparison is unavailable because the declared bases or serving units are incompatible.",
            "missing_data": [],
        }

    field, direction = GOAL_METRIC[goal]
    va, vb = normalized_a.get(field), normalized_b.get(field)
    missing = [name for name, value in [(a.product_name or a.product_id, va), (b.product_name or b.product_id, vb)] if value is None]
    if missing:
        explanation = f"The goal-specific value ({field}) is missing for: {', '.join(missing)}."
        winner = None
    elif va == vb:
        winner = None
        explanation = f"Both products declare the same {field.replace('_', ' ')} on a {basis} basis."
    else:
        a_wins = va > vb if direction == "higher" else va < vb
        winner_product = a if a_wins else b
        winner = winner_product.product_id
        explanation = (
            f"For {goal.value.replace('_', ' ')}, {winner_product.product_name or winner_product.product_id} "
            f"has the more favorable {field.replace('_', ' ')} value on a {basis} basis. "
            "This does not make it universally healthier."
        )
    return {
        "comparable": True,
        "comparison_basis": basis,
        "normalized": {"product_a": normalized_a, "product_b": normalized_b},
        "product_a": a.model_dump(mode="json"),
        "product_b": b.model_dump(mode="json"),
        "winner_product_id": winner,
        "explanation": explanation,
        "missing_data": missing,
        "category_note": None if a.category == b.category else "Products are from different categories; interpret the comparison cautiously.",
    }


def find_alternatives(current: Product, products: list[Product], goal: DietaryGoal, limit: int) -> list[dict]:
    field, direction = GOAL_METRIC[goal]
    current_values = normalized_per_100(current)
    if current_values is None or current_values.get(field) is None:
        return []
    candidates = []
    for product in products:
        if product.product_id == current.product_id or product.serving_unit != current.serving_unit:
            continue
        values = normalized_per_100(product)
        if values is None or values.get(field) is None:
            continue
        better = values[field] > current_values[field] if direction == "higher" else values[field] < current_values[field]
        if better:
            candidates.append({"product": product.model_dump(mode="json"), "metric": field, "value_per_100": values[field]})
    return sorted(candidates, key=lambda item: item["value_per_100"], reverse=direction == "higher")[:limit]
