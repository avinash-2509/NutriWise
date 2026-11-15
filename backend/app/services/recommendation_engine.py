from app.schemas.models import DietaryGoal, GoalProfile, NutritionData, RecommendationResult
from app.services.config import THRESHOLDS
from app.services.ingredient_analyzer import analyze_ingredients
from app.services.nutrition_calculator import scale_nutrition


LABELS = {
    "calories_kcal": "calories",
    "protein_g": "protein",
    "total_sugar_g": "total sugar",
    "added_sugar_g": "added sugar",
    "saturated_fat_g": "saturated fat",
    "fiber_g": "fiber",
    "sodium_mg": "sodium",
}


def _missing(values: dict, fields: list[str]) -> list[str]:
    return [LABELS[field] for field in fields if values.get(field) is None]


def recommend(nutrition: NutritionData, quantity: float, profile: GoalProfile) -> RecommendationResult:
    goal = profile.primary_goal
    values = scale_nutrition(nutrition, quantity)["totals"]
    positive: list[str] = []
    attention: list[str] = []
    actions: list[str] = []
    rules: list[str] = []
    required: list[str] = []

    if goal == DietaryGoal.reduce_added_sugar:
        required = ["added_sugar_g"]
        sugar = values["added_sugar_g"]
        if sugar is not None:
            rules.append("added_sugar_per_selected_quantity")
            if sugar <= THRESHOLDS["added_sugar_g"]["low"]:
                positive.append(f"The selected quantity contains {sugar:g} g added sugar, within the app's lower range.")
            elif sugar >= THRESHOLDS["added_sugar_g"]["high"]:
                attention.append(f"The selected quantity contains {sugar:g} g added sugar, in the app's high-attention range.")
                actions.append("Compare it with collected products that declare less added sugar on the same basis.")
            else:
                attention.append(f"The selected quantity contains {sugar:g} g added sugar; portion size still matters.")
        else:
            actions.append("Added sugar is not declared, so it cannot be inferred reliably from total sugar alone.")

    elif goal in {DietaryGoal.increase_protein, DietaryGoal.muscle_building}:
        required = ["protein_g"]
        protein = values["protein_g"]
        if protein is not None:
            rules.append("protein_per_selected_quantity")
            if protein >= THRESHOLDS["protein_g"]["high"]:
                positive.append(f"The selected quantity provides {protein:g} g protein, a high contribution by this app's heuristic.")
            elif protein >= THRESHOLDS["protein_g"]["meaningful"]:
                positive.append(f"The selected quantity provides {protein:g} g protein, a meaningful contribution by this app's heuristic.")
            else:
                attention.append(f"The selected quantity provides {protein:g} g protein, below this app's meaningful-protein threshold.")
                actions.append("Compare with a collected option that provides more protein on a compatible basis.")
        if goal == DietaryGoal.muscle_building:
            actions.append("A single food does not build muscle; overall training and dietary pattern matter.")

    elif goal in {DietaryGoal.weight_management, DietaryGoal.weight_gain}:
        required = ["calories_kcal", "protein_g", "fiber_g"]
        calories = values["calories_kcal"]
        protein = values["protein_g"]
        fiber = values["fiber_g"]
        rules.append("energy_protein_fiber_context")
        if protein is not None and protein >= THRESHOLDS["protein_g"]["meaningful"]:
            positive.append(f"The selected quantity provides {protein:g} g protein.")
        if fiber is not None and fiber >= THRESHOLDS["fiber_g"]["meaningful"]:
            positive.append(f"The selected quantity provides {fiber:g} g fiber.")
        if calories is not None:
            descriptor = "energy-dense" if calories >= THRESHOLDS["calories_kcal"]["energy_dense"] else "moderate in energy"
            attention.append(f"The selected quantity provides {calories:g} kcal and is {descriptor} by the app's portion heuristic.")
        if goal == DietaryGoal.weight_gain:
            actions.append("Consider energy together with protein, portion practicality, and the rest of the diet—not calories alone.")
        else:
            actions.append("Judge the portion in the context of the full eating pattern; no single food causes weight change by itself.")

    elif goal == DietaryGoal.lower_sodium:
        required = ["sodium_mg"]
        sodium = values["sodium_mg"]
        if sodium is not None:
            rules.append("sodium_per_selected_quantity")
            if sodium <= THRESHOLDS["sodium_mg"]["low"]:
                positive.append(f"The selected quantity contains {sodium:g} mg sodium, within the app's lower range.")
            elif sodium >= THRESHOLDS["sodium_mg"]["high"]:
                attention.append(f"The selected quantity contains {sodium:g} mg sodium, in the app's high-attention range.")
                actions.append("Compare lower-sodium collected alternatives on the same basis.")
            else:
                attention.append(f"The selected quantity contains {sodium:g} mg sodium; account for the rest of the meal.")

    else:
        required = ["protein_g", "fiber_g", "added_sugar_g", "saturated_fat_g", "sodium_mg"]
        rules.append("balanced_multi_nutrient_context")
        if values["protein_g"] is not None and values["protein_g"] >= THRESHOLDS["protein_g"]["meaningful"]:
            positive.append(f"Protein is {values['protein_g']:g} g for the selected quantity.")
        if values["fiber_g"] is not None and values["fiber_g"] >= THRESHOLDS["fiber_g"]["meaningful"]:
            positive.append(f"Fiber is {values['fiber_g']:g} g for the selected quantity.")
        for field, threshold, unit in [
            ("added_sugar_g", THRESHOLDS["added_sugar_g"]["high"], "g added sugar"),
            ("saturated_fat_g", THRESHOLDS["saturated_fat_g"]["attention"], "g saturated fat"),
            ("sodium_mg", THRESHOLDS["sodium_mg"]["high"], "mg sodium"),
        ]:
            if values[field] is not None and values[field] >= threshold:
                attention.append(f"The selected quantity contains {values[field]:g} {unit}, which merits attention in a balanced pattern.")
        actions.append("Use the full nutrient pattern and portion size rather than one number in isolation.")

    missing = _missing(values, required)
    ingredient_result = analyze_ingredients(nutrition.ingredients, nutrition.allergens_declared, profile.ingredients_to_avoid)
    ingredient_warnings = ingredient_result["warnings"]
    if ingredient_result["missing"] and profile.ingredients_to_avoid:
        missing.append("complete ingredient and allergen declaration")
    if profile.ingredients_to_avoid:
        actions.append(ingredient_result["notice"])

    if not positive and not attention:
        assessment = "insufficient_information"
        summary = "There is not enough confirmed label information to assess this goal reliably."
    elif attention and not positive:
        assessment = "less_suitable" if len(attention) > 0 and not missing else "mixed_fit"
        summary = "The confirmed values raise points to consider for your selected goal."
    elif positive and (attention or missing):
        assessment = "mixed_fit"
        summary = "The product has helpful features, but concerns or missing values limit the result for your selected goal."
    else:
        assessment = "good_match"
        summary = "The confirmed values align reasonably well with your selected goal using the app's documented heuristics."

    return RecommendationResult(
        goal=goal,
        assessment=assessment,
        summary=summary,
        positive_factors=positive,
        attention_factors=attention,
        ingredient_warnings=ingredient_warnings,
        recommendations=actions,
        missing_data=list(dict.fromkeys(missing)),
        rules_applied=rules,
    )
