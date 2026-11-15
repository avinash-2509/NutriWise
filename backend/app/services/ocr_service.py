from __future__ import annotations

import io
import os

from PIL import Image, ImageEnhance, ImageFilter, ImageOps, UnidentifiedImageError

from app.services.nutrition_parser import parse_nutrition_text


class OCRUnavailable(RuntimeError):
    pass


def validate_image(content: bytes, filename: str, content_type: str | None) -> Image.Image:
    if len(content) > 10 * 1024 * 1024:
        raise ValueError("Image exceeds the 10 MB limit.")
    if content_type not in {"image/jpeg", "image/png"}:
        raise ValueError("Only JPG, JPEG, and PNG images are supported.")
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()
        image = Image.open(io.BytesIO(content))
        return ImageOps.exif_transpose(image).convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError(f"{filename} is not a valid supported image.") from exc


def preprocess(image: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(image)
    gray = ImageEnhance.Contrast(gray).enhance(1.8)
    return gray.filter(ImageFilter.MedianFilter(size=3))


def extract_text(image: Image.Image) -> str:
    try:
        import pytesseract
        command = os.getenv("TESSERACT_CMD")
        if command:
            pytesseract.pytesseract.tesseract_cmd = command
        return pytesseract.image_to_string(preprocess(image), config="--psm 6")
    except Exception as exc:
        raise OCRUnavailable("Tesseract OCR is unavailable. Manual entry remains available.") from exc


def process_image(content: bytes, filename: str, content_type: str | None, parse_values: bool = True) -> dict:
    image = validate_image(content, filename, content_type)
    text = extract_text(image)
    if not parse_values:
        return {"raw_text": text, "warnings": []}
    parsed = parse_nutrition_text(text)
    return {"raw_text": text, **parsed}
