import requests
import json

# Configuration
API_URL = "http://localhost:8000/predict"
IMAGE_PATH = "t.jpg" 

def test_prediction():
    try:
        print(f"Sending {IMAGE_PATH} to AI API...")
        
        with open(IMAGE_PATH, 'rb') as f:
            files = {'file': (IMAGE_PATH, f, 'image/jpeg')}
            response = requests.post(API_URL, files=files)
            
        if response.status_code == 200:
            result = response.json()
            print("\n" + "="*40)
            print("API SUCCESSFUL PREDICTION")
            print("="*40)
            print(f"Predicted Class: {result['predicted_class']}")
            print(f"Confidence:      {result['confidence']}%")
            print("\nAll Probabilities:")
            for cls, prob in result['probabilities'].items():
                print(f"  {cls:28}: {prob*100:.2f}%")
            print("="*40)
        else:
            print(f"Error: API returned status {response.status_code}")
            print(f"Detail: {response.text}")
            
    except Exception as e:
        print(f"Error connecting to API: {e}")
        print("Make sure the API is running (run: python main.py)")

if __name__ == "__main__":
    test_prediction()
