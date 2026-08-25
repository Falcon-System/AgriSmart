from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
from transformers import pipeline
import io
import os

MODEL_ID = os.environ.get(
    "CASSAVA_MODEL_ID",
    "nexusbert/resnet50-cassava-finetuned",
)

LABEL_TO_KEY = {
    "cassava bacterial blight (cbb)": "cassava_bacterial_blight",
    "cbb": "cassava_bacterial_blight",
    "cassava brown streak disease (cbsd)": "cassava_brown_streak_disease",
    "cbsd": "cassava_brown_streak_disease",
    "cassava green mottle (cgm)": "cassava_green_mottle",
    "cgm": "cassava_green_mottle",
    "cassava mosaic disease (cmd)": "cassava_mosaic_disease",
    "cmd": "cassava_mosaic_disease",
    "healthy": "cassava_healthy",
    "cassava healthy": "cassava_healthy",
    "healthy cassava leaf": "cassava_healthy",
}

app = FastAPI(title="AgriSmart Cassava Predictor")
classifier = None


def load_classifier():
    global classifier
    if classifier is None:
        classifier = pipeline(
            "image-classification",
            model=MODEL_ID,
            device=-1,
        )
    return classifier


@app.on_event("startup")
def startup():
    load_classifier()


@app.get("/health")
def health():
    return {
        "ok": True,
        "model": MODEL_ID,
        "ready": classifier is not None,
    }


def to_disease_key(label: str) -> str:
    compact = " ".join(label.lower().replace("_", " ").split())
    if compact in LABEL_TO_KEY:
        return LABEL_TO_KEY[compact]
    for name, key in LABEL_TO_KEY.items():
        if name in compact or compact in name:
            return key
    return compact.replace(" ", "_")


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    raw = await file.read()
    if not raw or len(raw) < 512:
        raise HTTPException(status_code=400, detail="Invalid image. Please capture a clear photo of a cassava leaf.")

    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Invalid image. Please capture a clear photo of a cassava leaf.")

    results = load_classifier()(image, top_k=5)
    if not results:
        raise HTTPException(status_code=500, detail="Model returned no prediction")

    top = results[0]
    predicted_class = to_disease_key(top["label"])
    probabilities = {
        to_disease_key(item["label"]): round(float(item["score"]), 4)
        for item in results
    }

    return JSONResponse(
        {
            "predicted_class": predicted_class,
            "disease": predicted_class,
            "label": top["label"],
            "confidence": float(top["score"]),
            "probabilities": probabilities,
            "model": MODEL_ID,
        }
    )
