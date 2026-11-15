from app.schemas.models import DietaryGoal, GoalProfile, NutritionData, Product
from app.services.comparison_engine import compare_products, find_alternatives
from app.services.ingredient_analyzer import analyze_ingredients
from app.services.nutrition_calculator import normalized_per_100, scale_nutrition
from app.services.nutrition_parser import parse_nutrition_text
from app.services.recommendation_engine import recommend


def nutrition(**values):
    data = dict(product_name="Snack", serving_size=40, serving_unit="g", nutrition_basis="per_serving")
    data.update(values)
    return NutritionData(**data)


def test_quantity_and_per_100_calculations():
    item = nutrition(calories_kcal=100, protein_g=4)
    assert scale_nutrition(item, 2)["totals"]["calories_kcal"] == 200
    assert normalized_per_100(item)["protein_g"] == 10


def test_ocr_parser_variations_and_kj_conversion():
    parsed = parse_nutrition_text("Energy 1800 kJ Protein: 8.5 g Added Sugars 4 g Sodium 320mg per 100 g")
    assert parsed["fields"]["protein_g"]["value"] == 8.5
    assert parsed["fields"]["added_sugar_g"]["value"] == 4
    assert "total_sugar_g" not in parsed["fields"]
    assert parsed["fields"]["calories_kcal"]["source"] == "calculated_from_ocr_kj"
    assert parsed["fields"]["nutrition_basis"]["value"] == "per_100g"


def test_added_sugar_missing_is_not_inferred():
    result = recommend(nutrition(total_sugar_g=12), 1, GoalProfile(primary_goal="reduce_added_sugar"))
    assert result.assessment == "insufficient_information"
    assert "added sugar" in result.missing_data


def test_protein_and_sodium_goal_recommendations():
    item = nutrition(protein_g=21, sodium_mg=500)
    protein = recommend(item, 1, GoalProfile(primary_goal="increase_protein"))
    sodium = recommend(item, 1, GoalProfile(primary_goal="lower_sodium"))
    assert protein.assessment == "good_match"
    assert sodium.assessment == "less_suitable"


def test_ingredient_matching_and_missing_notice():
    matched = analyze_ingredients("Oats, whey protein, soy lecithin", "contains milk", ["milk", "soy"])
    assert len(matched["warnings"]) == 2
    assert analyze_ingredients(None, None, ["milk"])["missing"] is True


def product(product_id, protein, category="snack"):
    return Product(
        product_id=product_id, product_name=product_id, category=category, serving_size=50,
        serving_unit="g", nutrition_basis="per_serving", protein_g=protein,
    )


def test_product_comparison_and_alternatives():
    a, b = product("a", 5), product("b", 10)
    result = compare_products(a, b, DietaryGoal.increase_protein)
    assert result["winner_product_id"] == "b"
    assert find_alternatives(a, [a, b], DietaryGoal.increase_protein, 3)[0]["product"]["product_id"] == "b"


def test_incompatible_units_refuse_comparison():
    a = product("a", 5)
    b = Product(product_id="b", product_name="Drink", serving_size=200, serving_unit="ml", nutrition_basis="per_serving", protein_g=5)
    assert compare_products(a, b, DietaryGoal.increase_protein)["comparable"] is False
