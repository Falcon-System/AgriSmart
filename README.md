# AgriSmart Backend - Cassava Disease Identification API

This repository contains the backend AI service for the AgriSmart project. It uses a Deep Learning model to identify various cassava leaf diseases with high accuracy.

## Features
- **FastAPI Core**: High-performance asynchronous API.
- **Image Validation**: Automatically detects if an uploaded image is a plant/leaf using MobileNetV2 before processing.
- **Lazy Loading**: The heavy AI model is only loaded into memory when a valid request is received, saving server resources.
- **Disease Detection**: Identifies 5 classes:
  - Cassava Bacterial Blight (CBB)
  - Cassava Brown Streak Disease (CBSD)
  - Cassava Green Mottle (CGM)
  - Cassava Mosaic Disease (CMD)
  - Healthy
- **Cross-Origin Resource Sharing (CORS)**: Ready for web and mobile integration.

## Setup & Installation

### Prerequisites
- Python 3.10+
- TensorFlow 2.16+
- FastAPI & Uvicorn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/isacc-coder/AgriSmart.git
   cd AgriSmart
   ```
2. Install dependencies:
   ```bash
   pip install tensorflow tensorflow-hub fastapi uvicorn numpy pillow matplotlib python-multipart
   ```

## Running the API
Start the server using Uvicorn:
```bash
python main.py
```
The API will be available at `http://localhost:8000`.

## MongoDB Setup
This project can optionally log each prediction into a local MongoDB database.

1. Install MongoDB Community Server locally and start `mongod`.
2. The app will connect to `mongodb://localhost:27017` by default.
3. Optional environment overrides:
```bash
set MONGO_URI=mongodb://localhost:27017
set MONGO_DB=agrismart
set MONGO_COLLECTION=predictions
```
If MongoDB is not running, the API will keep working and simply skip the database write.

## API Endpoints
- `GET /`: Health check and status.
- `POST /predict`: Upload an image file for disease identification.

## Usage in Web/Mobile
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://YOUR_SERVER_IP:8000/predict', {
  method: 'POST',
  body: formData
});
const data = await response.json();
```
