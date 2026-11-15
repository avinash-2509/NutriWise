from __future__ import annotations

from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator


NonEmpty = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=300)]


class NutritionBasis(str, Enum):
    per_serving = "per_serving"
    per_100g = "per_100g"
    per_100ml = "per_100ml"
    unspecified = "unspecified"


class DietaryGoal(str, Enum):
    reduce_added_sugar = "reduce_added_sugar"
    increase_protein = "increase_protein"
    weight_management = "weight_management"
    weight_gain = "weight_gain"
    muscle_building = "muscle_building"
    lower_sodium = "lower_sodium"
    balanced_eating = "balanced_eating"


class NutritionData(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    product_name: str | None = Field(default=None, max_length=300)
    serving_size: float | None = Field(default=None, gt=0, le=100000)
    serving_unit: Literal["g", "ml", "piece", "serving"] | None = None
    nutrition_basis: NutritionBasis = NutritionBasis.per_serving
    calories_kcal: float | None = Field(default=None, ge=0, le=100000)
    protein_g: float | None = Field(default=None, ge=0, le=100000)
    carbohydrates_g: float | None = Field(default=None, ge=0, le=100000)
    total_sugar_g: float | None = Field(default=None, ge=0, le=100000)
    added_sugar_g: float | None = Field(default=None, ge=0, le=100000)
    total_fat_g: float | None = Field(default=None, ge=0, le=100000)
    saturated_fat_g: float | None = Field(default=None, ge=0, le=100000)
    fiber_g: float | None = Field(default=None, ge=0, le=100000)
    sodium_mg: float | None = Field(default=None, ge=0, le=1000000)
    ingredients: str | None = Field(default=None, max_length=10000)
    allergens_declared: str | None = Field(default=None, max_length=3000)

    @model_validator(mode="after")
    def serving_pair_is_complete(self):
        if (self.serving_size is None) != (self.serving_unit is None):
            raise ValueError("serving_size and serving_unit must be supplied together")
        return self


class Product(NutritionData):
    product_id: NonEmpty
    product_name: NonEmpty
    brand: str | None = Field(default=None, max_length=300)
    category: str | None = Field(default=None, max_length=300)
    collected_at: str | None = Field(default=None, max_length=100)
    collection_location: str | None = Field(default=None, max_length=500)
    source_notes: str | None = Field(default=None, max_length=2000)


class GoalProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")
    primary_goal: DietaryGoal
    secondary_goals: list[DietaryGoal] = Field(default_factory=list, max_length=6)
    dietary_preference: Literal["none", "vegetarian", "vegan", "high_protein"] = "none"
    ingredients_to_avoid: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("ingredients_to_avoid")
    @classmethod
    def clean_exclusions(cls, values: list[str]) -> list[str]:
        cleaned = []
        for value in values:
            value = value.strip().lower()
            if value and value not in cleaned:
                cleaned.append(value[:100])
        return cleaned


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nutrition: NutritionData
    quantity: float = Field(default=1, gt=0, le=100)


class RecommendationRequest(AnalysisRequest):
    profile: GoalProfile


class ComparisonRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_a_id: NonEmpty
    product_b_id: NonEmpty
    goal: DietaryGoal


class AlternativesRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: NonEmpty
    goal: DietaryGoal
    limit: int = Field(default=3, ge=1, le=10)


Assessment = Literal["good_match", "mixed_fit", "less_suitable", "insufficient_information"]


class RecommendationResult(BaseModel):
    goal: DietaryGoal
    assessment: Assessment
    summary: str
    positive_factors: list[str] = Field(default_factory=list)
    attention_factors: list[str] = Field(default_factory=list)
    ingredient_warnings: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    missing_data: list[str] = Field(default_factory=list)
    rules_applied: list[str] = Field(default_factory=list)
