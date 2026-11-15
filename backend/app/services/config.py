"""Transparent application heuristics, not medical thresholds.

These values are deliberately centralized so they can be changed and explained
during a technical review. They provide consumer-facing context; they are not a
validated health score or individual prescription.
"""

THRESHOLDS = {
    "added_sugar_g": {"low": 5.0, "high": 10.0},
    "protein_g": {"meaningful": 10.0, "high": 20.0},
    "sodium_mg": {"low": 140.0, "high": 400.0},
    "fiber_g": {"meaningful": 3.0, "high": 5.0},
    "saturated_fat_g": {"attention": 5.0},
    "calories_kcal": {"light": 150.0, "energy_dense": 350.0},
}
