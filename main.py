import os

# ==============================
# 0. Environment Configuration
# ==============================
os.environ["TF_USE_LEGACY_KERAS"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import tensorflow as tf
import tensorflow_hub as hub
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from pymongo import MongoClient
from datetime import datetime

MODEL_PATH = "cassava.h5"
cassava_model = None
validator_model = None

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "agrismart")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "predictions")

def get_validator():
    global validator_model
    if validator_model is None:
        print("API: Initializing Validator Model (MobileNetV2)...", flush=True)
        validator_model = MobileNetV2(weights='imagenet')
    return validator_model

def get_cassava_model():
    global cassava_model
    if cassava_model is None:
        print("API: Initializing Main Cassava AI Model (Lazy Loading)...", flush=True)
        if os.path.exists(MODEL_PATH):
            cassava_model = tf.keras.models.load_model(MODEL_PATH, custom_objects={'KerasLayer': hub.KerasLayer})
        else:
            print(f"Warning: Model file {MODEL_PATH} not found — using mock model for testing.", flush=True)
            class DummyModel:
                def predict(self, x, verbose=0):
                    # Return a mock prediction vector where 'Healthy' has the highest probability
                    return np.array([[0.05, 0.05, 0.05, 0.05, 0.8]])
            cassava_model = DummyModel()
    return cassava_model

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io

# ==============================
# 2. FastAPI Initialization
# ==============================
app = FastAPI(
    title="Cassava Disease Detection API",
    description="API with Image Validation and Lazy Loading.",
    version="1.1.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# MongoDB helper functions
# ==============================
def save_prediction_to_mongodb(payload):
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        db = client[MONGO_DB]
        collection = db[MONGO_COLLECTION]
        document = {
            "created_at": datetime.utcnow(),
            "predicted_class": payload.get("predicted_class"),
            "confidence": payload.get("confidence"),
            "probabilities": payload.get("probabilities", {}),
            "source": payload.get("source", "api"),
            "file_name": payload.get("file_name"),
        }
        collection.insert_one(document)
        return True
    except Exception as exc:
        print(f"MongoDB logging failed: {exc}", flush=True)
        return False

# ==============================
# Helper functions
# ==============================
def is_plant_image(img_pil):
    # Resize for MobileNetV2
    img = img_pil.resize((224, 224))
    x = np.array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    
    val_model = get_validator()
    preds = val_model.predict(x, verbose=0)
    results = decode_predictions(preds, top=5)[0]
    
    plant_keywords = [
        'leaf', 'plant', 'tree', 'flower', 'fruit', 'vegetable', 'herb', 'greenery', 
        'apple', 'banana', 'orange', 'lemon', 'berry', 'corn', 'maize', 'sugar', 
        'grass', 'cactus', 'fern', 'moss', 'palm', 'oak', 'bamboo', 'shrub', 'bush',
        'buckeye', 'fig', 'acorn', 'rapeseed', 'pot', 'stalk', 'root', 'vine', 'pod',
        'ear', 'tobacco', 'cotton', 'hay', 'crop', 'nature'
    ]
    return any(any(kw in res[1].lower() for kw in plant_keywords) for res in results), [res[1] for res in results]

# ==============================
# 4. Class Names
# ==============================
class_names = [
    "Cassava_Bacterial_Blight",
    "Cassava_Brown_Streak_Disease",
    "Cassava_Green_Mottle",
    "Cassava_Mosaic_Disease",
    "Healthy"
]

# ==============================
# 5. Prediction Endpoint
# ==============================
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # 1. Read image
        contents = await file.read()
        image_pil = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # 2. VALIDATE FIRST (Don't load AI model if not a plant)
        is_valid, top_guesses = is_plant_image(image_pil)
        
        if not is_valid:
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "Image rejection: This does not look like a cassava leaf or plant.",
                    "detected": top_guesses
                }
            )
        
        # 3. GET/LOAD Main Model (Lazy Loading)
        model = get_cassava_model()
        
        # 4. Preprocess for Cassava model
        img = image_pil.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # 5. Predict
        predictions = model.predict(img_array, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0]))

        result = {
            "predicted_class": class_names[predicted_class_idx],
            "confidence": round(confidence * 100, 2),
            "probabilities": {class_names[i]: float(predictions[0][i]) for i in range(len(class_names))},
            "source": "api",
            "file_name": file.filename,
        }

        save_prediction_to_mongodb(result)
        return result
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "API is online. Validator active. Main model will lazy-load on first valid request."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
