import re


ALIASES = {
    "milk": {"milk", "whey", "casein", "caseinate", "lactose", "milk solids"},
    "peanuts": {"peanut", "peanuts", "groundnut", "groundnuts"},
    "tree nuts": {"almond", "cashew", "walnut", "pistachio", "hazelnut", "pecan", "brazil nut"},
    "soy": {"soy", "soya", "soybean", "soy lecithin"},
    "wheat/gluten": {"wheat", "gluten", "barley", "rye", "malt"},
    "eggs": {"egg", "eggs", "albumen"},
    "fish": {"fish", "anchovy", "salmon", "tuna", "cod"},
    "shellfish": {"shrimp", "prawn", "crab", "lobster", "shellfish"},
    "sesame": {"sesame", "tahini"},
}


def normalize_ingredients(text: str | None) -> list[str]:
    if not text:
        return []
    cleaned = re.sub(r"[().]", " ", text.lower())
    return [item.strip() for item in re.split(r"[,;:]", cleaned) if item.strip()]


def analyze_ingredients(
    ingredients: str | None,
    allergens_declared: str | None,
    exclusions: list[str],
) -> dict:
    combined = " ".join(filter(None, [ingredients, allergens_declared])).lower()
    if not combined:
        return {
            "warnings": [],
            "missing": True,
            "notice": "Ingredient information is missing or incomplete; allergen safety cannot be established.",
        }

    warnings = []
    for exclusion in exclusions:
        aliases = ALIASES.get(exclusion.lower(), {exclusion.lower()})
        matches = sorted(alias for alias in aliases if re.search(rf"\b{re.escape(alias)}\b", combined))
        if matches:
            warnings.append(f"Declared text may contain {exclusion} (matched: {', '.join(matches)}).")
    return {
        "warnings": warnings,
        "missing": False,
        "notice": "OCR and text matching cannot prove a product is allergen-safe; always verify the physical package.",
    }
