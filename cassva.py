import os
import sys
import logging
import traceback
import threading
import time
import itertools

# ==============================
# Helper to silence stderr (FD 2)
# ==============================
class SilenceStderr:
    def __init__(self):
        self.stderr_fd = sys.stderr.fileno()
        self.saved_stderr_fd = None

    def __enter__(self):
        # Flush stream to ensure orderly output
        sys.stderr.flush()
        # Save the original stderr FD
        self.saved_stderr_fd = os.dup(self.stderr_fd)
        # Open devnull
        with open(os.devnull, 'w') as devnull:
            # Replace stderr with devnull
            os.dup2(devnull.fileno(), self.stderr_fd)

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.saved_stderr_fd is not None:
            # Flush before restoring
            sys.stderr.flush()
            # Restore stderr
            os.dup2(self.saved_stderr_fd, self.stderr_fd)
            os.close(self.saved_stderr_fd)

# ==============================
# Loading Animation Helper
# ==============================
class LoadingSpinner:
    def __init__(self, message="AI is thinking"):
        self.message = message
        self.stop_event = threading.Event()
        self.thread = threading.Thread(target=self._animate)

    def _animate(self):
        for c in itertools.cycle(['|', '/', '-', '\\']):
            if self.stop_event.is_set():
                break
            sys.stdout.write(f'\r{self.message}... {c}')
            sys.stdout.flush()
            time.sleep(0.1)
        sys.stdout.write('\r' + ' ' * (len(self.message) + 10) + '\r')

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop_event.set()
        self.thread.join()

# ==============================
# Main execution with silence
# ==============================
if __name__ == "__main__":
    # Start silence using context manager manually to cover imports
    silencer = SilenceStderr()
    try:
        silencer.__enter__()
        
        # Set env vars
        os.environ["TF_USE_LEGACY_KERAS"] = "1"
        os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
        
        # Imports (now silenced)
        import tensorflow as tf
        import tensorflow_hub as hub
        import numpy as np
        from tensorflow.keras.preprocessing import image
        import matplotlib.pyplot as plt
        
        # Configure logging (extra safety)
        tf.get_logger().setLevel(logging.ERROR)
        try:
             import absl.logging
             absl.logging.set_verbosity(absl.logging.ERROR)
        except:
             pass

        # 1. Load trained model
        MODEL_PATH = "cs_best.h5"
        # We must register the custom object
        with LoadingSpinner("Initializing AI Model"):
            model = tf.keras.models.load_model(MODEL_PATH, custom_objects={'KerasLayer': hub.KerasLayer})
        
        # 2. Class names
        # Standard Kaggle/Common Dataset Mapping:
        # 0: Cassava Bacterial Blight (CBB)
        # 1: Cassava Brown Streak Disease (CBSD)
        # 2: Cassava Green Mottle (CGM)
        # 3: Cassava Mosaic Disease (CMD)
        # 4: Healthy
        class_names = [
            "Cassava_Bacterial_Blight",
            "Cassava_Brown_Streak_Disease",
            "Cassava_Green_Mottle",
            "Cassava_Mosaic_Disease",
            "Healthy"
        ]
        
        # 3. Load and preprocess image
        IMAGE_PATH = "bb.jpg"
        IMG_SIZE = 224
        
        if not os.path.exists(IMAGE_PATH):
            # We can print to stdout even if stderr is silenced
            print(f"Error: {IMAGE_PATH} not found.")
            sys.exit(1)
            
        img = image.load_img(IMAGE_PATH, target_size=(IMG_SIZE, IMG_SIZE))
        img_array = image.img_to_array(img)
        img_to_show = img_array.astype(np.uint8) # Capture for display
        img_array = img_array / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # 4. Predict
        with LoadingSpinner("AI is analyzing image"):
            predictions = model.predict(img_array, verbose=0)
        predicted_class = np.argmax(predictions)
        confidence = np.max(predictions)
        
        # 5. Output result
        print("-" * 30)
        print("PREDICTION RESULTS")
        print("-" * 30)
        print("Predicted Class:", class_names[predicted_class])
        print("Confidence:", round(confidence * 100, 2), "%")
        
        print("\nAll Probabilities:")
        for i, name in enumerate(class_names):
            print(f"{name}: {predictions[0][i]*100:.2f}%")
        print("-" * 30)

        # 6. Display Image and Results
        plt.figure(figsize=(12, 6))
        
        # Plot Image
        plt.subplot(1, 2, 1)
        plt.imshow(img_to_show)
        plt.title(f"Prediction: {class_names[predicted_class]}\nConfidence: {confidence*100:.2f}%")
        plt.axis('off')

        # Plot Probabilities
        plt.subplot(1, 2, 2)
        y_pos = np.arange(len(class_names))
        plt.barh(y_pos, predictions[0]*100, align='center', color='skyblue')
        plt.yticks(y_pos, class_names)
        plt.xlabel('Probability (%)')
        plt.title('All Class Probabilities')
        plt.gca().invert_yaxis() # Highest at top

        plt.tight_layout()
        print("\nDisplaying image window... (Close it to end the script)")
        plt.show()

    except Exception:
        # If error occurs, restore stderr to show it
        silencer.__exit__(None, None, None)
        traceback.print_exc()
        sys.exit(1)
    finally:
        # If we finished successfully or caught exception, try to exit cleanly
        # We don't necessarily strictly need to restore stderr if we are exiting, 
        # but it's good practice.
        # Note: If silencer was already exited in except block, this might double-restore, 
        # but we can check internal state or just let OS handle exit.
        try:
            silencer.__exit__(None, None, None)
        except OSError:
            pass # Already closed/restored
