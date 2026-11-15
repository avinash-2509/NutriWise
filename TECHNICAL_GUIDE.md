# NutriWise Technical Guide

This guide is a map for a live technical review. The modules are intentionally small and use plain functions.

## 1. Change recommendation thresholds

Edit `backend/app/services/config.py`. All thresholds are application heuristics, not medical limits or a validated score. Each goal's decision logic is in `backend/app/services/recommendation_engine.py`.

After a change, run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q --basetemp .pytest-tmp
```

## 2. Add a dietary goal

1. Add the enum value to `DietaryGoal` in `backend/app/schemas/models.py`.
2. Add one explicit branch in `recommendation_engine.py`.
3. Map its comparison metric in `backend/app/services/comparison_engine.py`.
4. Add the user-facing label and description in `frontend/src/utils/nutrition.js` and `frontend/src/pages/GoalsPage.jsx`.
5. Add tests for present, missing, low, and high nutrient values.

## 3. Inspect CSV validation

`backend/app/repositories/csv_repository.py` owns the exact header, blank-value preservation, numeric validation, duplicate-ID detection, malformed-row reporting, and non-overwriting import behavior.

The loader returns both `products` and `issues`. It never rewrites or silently deletes a bad source row. An import is written only when the entire imported file validates and none of its IDs already exist.

## 4. Handle a bad data row

Open `/products` and read the reported row number and validation message. Correct the original `data.csv` value using the package label and field notes; do not replace an unknown value with zero. Reload the page. For a live demo, duplicate an ID or enter a negative nutrient in a separate test CSV, import it, and show that the API rejects the whole import.

## 5. Modify nutrient calculations

`backend/app/services/nutrition_calculator.py` scales selected quantities and creates per-100 values only when a valid mass or volume conversion exists. Keep grams and millilitres separate. Add or change tests in `backend/tests/test_services.py` before modifying the formulas.

## 6. Trace an OCR result

- File size/type and image preprocessing: `backend/app/services/ocr_service.py`
- Conservative regular expressions and kJ conversion: `backend/app/services/nutrition_parser.py`
- Editable confirmation form: `frontend/src/pages/ScannerPage.jsx`

OCR results are suggestions. The saved `confirmedNutrition` object—not raw OCR—is sent to recommendation and calculation endpoints.
