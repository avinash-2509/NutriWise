import re


PATTERNS = {
    "protein_g": [r"\bprotein\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g\b"],
    "carbohydrates_g": [r"\b(?:total\s+)?carbohydrates?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g\b"],
    "added_sugar_g": [r"\badded\s+sugars?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g\b"],
    "total_sugar_g": [r"(?<!added )\b(?:total\s+)?sugars?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g\b"],
    "total_fat_g": [r"\btotal\s+fat\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g\b", r"\bfat\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g\b"],
    "saturated_fat_g": [r"\bsaturated\s+fat\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g\b"],
    "fiber_g": [r"\b(?:dietary\s+)?fi(?:ber|bre)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*g\b"],
    "sodium_mg": [r"\bsodium\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*mg\b"],
    "calories_kcal": [r"\b(?:energy|calories?)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*kcal\b"],
}


def parse_nutrition_text(text: str) -> dict:
    normalized = re.sub(r"\s+", " ", text.lower())
    fields: dict[str, dict] = {}
    warnings: list[str] = []
    for field, patterns in PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, normalized, flags=re.IGNORECASE)
            if match:
                fields[field] = {"value": float(match.group(1).replace(",", ".")), "source": "ocr", "confidence": "medium"}
                break

    if "calories_kcal" not in fields:
        kj = re.search(r"\b(?:energy)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*kj\b", normalized)
        if kj:
            kcal = float(kj.group(1).replace(",", ".")) / 4.184
            fields["calories_kcal"] = {"value": round(kcal, 2), "source": "calculated_from_ocr_kj", "confidence": "low"}
            warnings.append("Energy was converted from kJ to kcal using 1 kcal = 4.184 kJ; verify the package.")

    serving = re.search(r"\bserving\s+size\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*(g|ml)\b", normalized)
    if serving:
        fields["serving_size"] = {"value": float(serving.group(1).replace(",", ".")), "source": "ocr", "confidence": "medium"}
        fields["serving_unit"] = {"value": serving.group(2), "source": "ocr", "confidence": "medium"}

    recognized_nutrients = any(key in fields for key in PATTERNS)
    if re.search(r"per\s*100\s*g", normalized):
        basis = "per_100g"
    elif re.search(r"per\s*100\s*ml", normalized):
        basis = "per_100ml"
    else:
        basis = "per_serving"
        warnings.append("Nutrition basis was not confidently detected and defaults to per serving; verify it manually.")
    fields["nutrition_basis"] = {"value": basis, "source": "ocr_inference", "confidence": "low"}
    if not recognized_nutrients:
        warnings.append("No structured nutrition values were recognized. Use manual entry.")
    return {"fields": fields, "warnings": warnings}
