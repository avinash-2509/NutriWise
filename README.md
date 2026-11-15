# NutriWise

**Know What's Inside. Eat According to Your Goals.**

NutriWise is a responsive React + FastAPI application that reads confirmed packaged-food nutrition values, scales them for a selected quantity, and produces an explainable recommendation for one dietary goal. Its product library and alternatives are backed only by the repository's personally collected `data.csv`.

## Assignment status

The technical application is implemented. The assignment submission is **not ready** because no genuine fieldwork facts, photographs, interview, product observations, personal reflection, AI exports, demo link, or public repository URL have been supplied.

| Required evidence | Current status |
|---|---|
| Real problem, place, and observation date | **EVIDENCE REQUIRED** |
| Identifiable target person and conversation | **PARTIAL** — Debasic and a developer-supplied transcript are documented; exact role and wording still require confirmation |
| Two timestamped fieldwork photographs | **EVIDENCE REQUIRED** |
| 20+ personally collected products | **EVIDENCE REQUIRED** (`data.csv` has headers only) |
| Independently written reflection | **EVIDENCE REQUIRED** (prompts only) |
| Genuine AI conversation exports | **EVIDENCE REQUIRED** |
| Three-minute demo and screenshots | **EVIDENCE REQUIRED** |
| Public GitHub repository URL | **EVIDENCE REQUIRED** |

No real person, location, date, quotation, product, photograph, or completion claim has been invented.

## Real problem and target person

- **Observed problem:** EVIDENCE REQUIRED
- **Target person:** Debasic — reported as a college student and regular consumer of packaged foods; confirm the exact role before submission.
- **Location:** EVIDENCE REQUIRED
- **Observation date:** EVIDENCE REQUIRED
- **How the conversation changed the build:** The supplied transcript prioritizes photo-based entry, simple goal-specific explanations, product comparison, and a clear distinction between per-serving and per-100-g values. Confirm the chronology before presenting this as an interview-driven change.

Complete [research.md](research.md) and [fieldwork.md](fieldwork.md) from your own notes before making the required research milestone commit.

## Implemented features

- Eight working React routes: landing, goals, scanner, analysis, recommendations, products, comparison, and about.
- A saved primary goal, optional secondary goals, dietary preference, and ingredient flags in `localStorage`.
- Two-image JPG/PNG upload with client and server validation and a 10 MB limit.
- Pillow preprocessing, Tesseract OCR, conservative nutrition parsing, kJ-to-kcal conversion labelling, and raw OCR text retention.
- Full manual-entry and correction form when OCR is missing, uncertain, or unavailable.
- Confirmed-value serving multiplier; missing nutrients remain missing rather than becoming zero.
- Seven deterministic goal branches with plain-language reasons, missing-data lists, and centralized heuristics.
- Ingredient/exclusion text matching with an explicit warning that OCR cannot establish allergen safety.
- Strict CSV parsing, negative-value checks, duplicate detection, row-level error reports, and non-overwriting import.
- Search, category/basis filtering, comparable-basis sorting, normalized product comparison, and real-data-only alternatives.
- FastAPI validation, restricted development CORS, safe upload limits, OpenAPI docs, and automated tests.

## Architecture

```text
frontend/src/
├── components/        navigation and reusable UI
├── context/           persisted profile and confirmed-analysis state
├── pages/             all eight routes
├── services/          Axios API client
└── utils/             goal, basis, and nutrient metadata

backend/app/
├── api/               FastAPI routes
├── repositories/      CSV loading and import
├── schemas/           strict Pydantic models
└── services/          OCR, parsing, calculations, rules, ingredients, comparisons
```

See [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md) for the exact files to change during a follow-up review.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/ocr/extract` | Validate images, OCR text, parse suggestions |
| POST | `/api/nutrition/analyze` | Scale confirmed values by quantity |
| POST | `/api/recommendations` | Apply the selected goal's rules |
| GET | `/api/products` | Return valid CSV rows and validation issues |
| GET | `/api/products/{id}` | Return one product |
| POST | `/api/products/compare` | Normalize and compare compatible products |
| POST | `/api/products/alternatives` | Find better matching real local records |
| POST | `/api/products/import` | Validate and append without overwriting IDs |

Interactive docs are available at `http://localhost:8000/docs` while the backend runs.

## Run locally on Windows PowerShell

### Backend

The commands below use `uv` because the development machine initially had no Python installation:

```powershell
cd C:\Users\avina\Desktop\FireAI\NutriWise\backend
uv venv --python 3.12 .venv
uv pip install --python .venv\Scripts\python.exe -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

In a second PowerShell window:

```powershell
cd C:\Users\avina\Desktop\FireAI\NutriWise\frontend
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`.

## Install Tesseract OCR

`pytesseract` is only a Python wrapper; the Tesseract executable must also be installed. Tesseract's documentation says current Windows installers are provided by UB Mannheim and the install directory may need to be added to `PATH` ([Tesseract installation documentation](https://tesseract-ocr.github.io/tessdoc/Installation.html)).

1. Install a current Tesseract 5 Windows build from the UB Mannheim installer linked by the official Tesseract documentation.
2. During installation, include English trained data and note the executable path, commonly `C:\Program Files\Tesseract-OCR\tesseract.exe`.
3. Either add `C:\Program Files\Tesseract-OCR` to your user `PATH`, or create `backend/.env` with:

   ```dotenv
   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
   ```

4. Restart PowerShell and verify:

   ```powershell
   tesseract --version
   ```

The current development machine did not have the executable installed, so real-image OCR was not executed here. The endpoint returns a clear warning and the manual-entry workflow remains usable.

## Add 20 collected food products

Open `data.csv` in a spreadsheet editor that preserves UTF-8 CSV and the exact header. Add one row per physical product:

```csv
product_id,product_name,brand,category,serving_size,serving_unit,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_sugar_g,added_sugar_g,total_fat_g,saturated_fat_g,fiber_g,sodium_mg,ingredients,allergens_declared,collected_at,collection_location,source_notes
```

Rules:

- Use a stable unique `product_id`, such as `shop-date-01`.
- Allowed `serving_unit` values are `g`, `ml`, `piece`, and `serving`.
- Allowed `nutrition_basis` values are `per_serving`, `per_100g`, and `per_100ml`.
- Copy decimals and units exactly as printed; use numeric cells without unit suffixes in nutrient columns.
- Leave missing declarations blank. Do not enter `0` unless the package actually declares zero.
- Record the genuine timestamp, location, and a short source note that lets you identify the packet/photo.
- Keep test fixture data inside `backend/tests/`; never copy it into the fieldwork CSV.

Use the Product Library's **Import CSV** button for a new batch. The entire import is rejected if a row is malformed or an ID would overwrite an existing record.

### Optional web-reference demo dataset

Twenty developer-supplied web-reference products are available separately at `reference-data/demo_products.csv`. They are not loaded by default and do not replace the empty fieldwork `data.csv`. To demonstrate the library and comparisons with those rows, set `NUTRIWISE_DATA_PATH=reference-data/demo_products.csv` before starting the backend. See `reference-data/README.md` for the exact command.

## Attach photographs

1. Copy originals without recompressing them into `evidence/location/`, `evidence/interviews/`, or `evidence/nutrition-labels/`.
2. Keep original metadata and timestamps. Use descriptive filenames without changing the source file contents.
3. Add relative Markdown links to `fieldwork.md`; describe only what is actually visible.
4. If an image contains private information, create a separately redacted publication copy under `evidence/screenshots/` and retain the untouched original outside the public repository if necessary.
5. Never infer an interview, place, or unreadable label number from an image alone.

## Complete the fieldwork record

Replace every `EVIDENCE REQUIRED` marker in `research.md` and `fieldwork.md` from the actual visit. Include start/end time proving at least 20 minutes, the person's real name and role, three accurate statements, one genuinely surprising observation, collection methodology, photo links, product count, and the exact design change caused by the conversation. Write `reflection.md` independently.

## Tests and verification

Executed on 15 November 2026:

```text
Backend: .\.venv\Scripts\python.exe -m pytest -q --basetemp .pytest-tmp
Result:  15 passed, 1 third-party deprecation warning

Frontend: npm.cmd run build
Result:   production build succeeded (Vite 8.3.8, 2538 modules transformed)
```

The build reported a non-failing large JavaScript chunk warning. A browser UI surface was not available, so screenshot-level visual QA was not executed. Live API health and recommendation checks should be repeated after any environment change.

## Actual input and output

- **Input:** a user-confirmed label object and saved goal, or genuine records from `data.csv`.
- **Output:** scaled nutrient totals, a categorical assessment (`good_match`, `mixed_fit`, `less_suitable`, or `insufficient_information`), reasons tied to confirmed values, ingredient matches, missing data, and applied rule names.
- **Current dataset output:** the product library correctly displays its empty state because no genuine rows exist.

## Screenshots and demo

- **Application screenshots:** EVIDENCE REQUIRED — add genuine captures to `evidence/screenshots/`.
- **Three-minute demo:** EVIDENCE REQUIRED — add the real video URL here.
- Recording plan: [DEMO_CHECKLIST.md](DEMO_CHECKLIST.md).

## What the tool gets wrong / known limitations

- OCR may transpose decimals, miss rows, confuse `g` and `mg`, or choose the wrong value when the panel has multiple columns.
- Product names are not reliably extracted; manual confirmation is expected.
- Orientation correction uses image metadata, not arbitrary text-angle detection.
- Ingredient matching is simple normalized text matching and cannot interpret trace statements, manufacturing cross-contact, or every synonym.
- Heuristics provide general context, not medical advice, diagnosis, prescriptions, or proof of safety.
- Per-serving comparisons require a declared gram or millilitre serving; pieces and incompatible mass/volume bases are refused.
- The frontend bundle is currently one relatively large chunk; route-level code splitting is a future performance improvement.
- Browser-based visual QA and real-image OCR were not available during this implementation pass.

## Future improvements

- Add a review queue that pairs each CSV row with its original label photograph.
- Add confidence boxes using Tesseract word-level data rather than field-level conservative labels.
- Add category-aware alternatives after enough genuine same-category records are collected.
- Add route-level code splitting and automated frontend interaction/accessibility tests.
- Revise thresholds only after documenting authoritative guidance and the target person's actual needs.

## Git and submission note

This folder was created in an empty, non-Git workspace. No commits were made. Do not manufacture commit timing. Initialize and make the required first research/person commit only after the real facts exist, then use meaningful milestones over the actual development period. Export genuine AI chats to `ai-chats/` and follow your institution's disclosure rules.
