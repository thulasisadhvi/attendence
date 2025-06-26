# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import numpy as np

# Import functions from face_utils and pipeline
from face_utils import save_embeddings # Used in register_face to build embeddings.pkl
from utils.pipeline import process_frame, reload_embeddings # Used in recognize and to refresh in-memory embeddings

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

DATASET_DIR = "dataset" # Directory where face images for each roll number are stored

# --- Registration Route ---
@app.route("/register-face", methods=["POST"])
def register_face():
    """
    Registers face images for a given roll number.
    Expects 'rollNumber' in form data and a list of 'images' files.
    """
    roll_number = request.form.get("rollNumber", "").strip().lower()
    if not roll_number:
        return jsonify({"error": "Roll Number is required for face registration"}), 400

    images = request.files.getlist("images")
    if len(images) < 3:
        return jsonify({"error": "At least 3 images required for face registration"}), 400

    # Create a subfolder for the roll number if it doesn't exist
    person_dir = os.path.join(DATASET_DIR, roll_number)
    os.makedirs(person_dir, exist_ok=True)

    # Determine the starting index for new images to avoid overwriting existing ones
    existing_count = len(os.listdir(person_dir))
    image_idx = existing_count + 1

    for image_file in images:
        npimg = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({"error": f"Could not decode image {image_file.filename}"}), 400
        
        image_path = os.path.join(person_dir, f"img_{image_idx}.jpg")
        cv2.imwrite(image_path, img)
        image_idx += 1 # Increment for the next image

    # After new images are saved, rebuild the embeddings database and reload it into memory
    save_embeddings()   # Rebuilds and saves embeddings to embeddings.pkl
    reload_embeddings() # Reloads the updated embeddings.pkl into the in-memory KNOWN_EMBEDS

    print(f"Face data for Roll Number {roll_number} registered successfully with {len(images)} images.")
    return jsonify({"message": f"Face data for Roll Number {roll_number} registered successfully with {len(images)} images."}), 200

# --- Recognition Route ---
@app.post("/recognize")
def recognize():
    """
    Receives an image, processes it for face detection, anti-spoofing,
    and recognition, then returns the identified roll number.
    """
    file = request.files.get("image")
    if file is None:
        return jsonify({"status": "No image part"}), 400
    
    # process_frame handles the core logic (face detection, anti-spoofing, recognition)
    # It returns a dictionary with 'status' and optionally 'rollNumber'
    recognition_result = process_frame(file.read())
    
    return jsonify(recognition_result)

# --- Main execution block ---
if __name__ == "__main__":
    # Ensure the DATASET_DIR exists on server startup
    os.makedirs(DATASET_DIR, exist_ok=True)
    
    # Initialize/build embeddings on server startup.
    # This ensures embeddings.pkl exists and KNOWN_EMBEDS is populated correctly.
    print("Building/loading initial face embeddings...")
    save_embeddings()
    reload_embeddings()
    print("Initial embeddings loaded. Server ready.")

    # Run the Flask app on port 8000, accessible from any IP address
    app.run(debug=True, port=8000, host="0.0.0.0")