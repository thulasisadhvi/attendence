# utils/pipeline.py
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_USE_MPS"] = "0"

import tensorflow as tf


from pathlib import Path
import pickle, csv
from datetime import datetime
import cv2, numpy as np
from numpy.linalg import norm
from deepface import DeepFace
from mtcnn import MTCNN
import sys

# --- CORRECTED PATH LOGIC ---
# HERE points to Project4.0/backend/utils/
HERE = Path(__file__).resolve().parent
# ROOT should point to Project4.0/backend/ (i.e., the parent of 'utils')
ROOT = HERE.parent

# Add the Silent-Face-Anti-Spoofing directory to Python's path
# This makes 'src' directly importable from within it.
sys.path.append(str(ROOT / "Silent-Face-Anti-Spoofing"))

# Now, 'src' module should be found
from src.anti_spoof_predict import AntiSpoofPredict
# --- END CORRECTED PATH LOGIC ---

detector    = MTCNN()
MODEL_PATH = (
    ROOT
    / "Silent-Face-Anti-Spoofing"
    / "resources"
    / "anti_spoof_models"
    / "4_0_0_80x80_MiniFASNetV1SE.pth"
)
PREDICTOR  = AntiSpoofPredict(device_id=0)

# ---------- Load Embeddings DB ----------
def _load_db() -> dict[str, np.ndarray]:
    """Loads face embeddings from embeddings.pkl."""
    pkl_path = ROOT / "embeddings.pkl" # Path to embeddings.pkl in the backend root
    if not pkl_path.exists() or os.path.getsize(pkl_path) == 0:
        print("ℹ No embeddings found (or file is empty), returning empty DB.")
        return {}
    with open(pkl_path, "rb") as f:
        raw = pickle.load(f)
    return {n: np.array(v) for n, v in raw.items()}

# In-memory dictionary to store known face embeddings
KNOWN_EMBEDS = _load_db()

def reload_embeddings() -> None:
    """
    Reloads embeddings into memory. Call this after new registrations
    to ensure immediate recognition of new individuals.
    """
    KNOWN_EMBEDS.clear()
    KNOWN_EMBEDS.update(_load_db())
    print("✅ Embeddings reloaded.")

# ---------- Spoof Helper ----------
def _is_spoof(img: np.ndarray) -> tuple[bool, float]:
    """
    Checks if a detected face is a spoof using the anti-spoofing model.
    Returns (is_spoof: bool, confidence: float).
    """
    try:
        # Resize image for the anti-spoofing model
        probs = PREDICTOR.predict(cv2.resize(img, (80, 80)), str(MODEL_PATH))[0]
        label, conf = int(np.argmax(probs)), float(probs[int(np.argmax(probs))])
        # Model returns 1 for real, others for spoof
        return label != 1, conf
    except Exception as e:
        print("🔥 Anti-spoof error:", e)
        return True, 0.0 # Default to spoof if an error occurs

# ---------- Recognition Helper ----------
def _who_is_it(face: np.ndarray, thr: float = 8.0) -> str | None:
    """
    Compares a detected face's embedding with known embeddings to identify the person.
    Returns the roll number if a match is found, otherwise None.
    """
    try:
        # Get embedding for the input face using DeepFace Facenet model
        emb = np.array(
            DeepFace.represent(
                cv2.cvtColor(face, cv2.COLOR_BGR2RGB),
                model_name="Facenet",
                enforce_detection=False, # Don't enforce detection as face is already cropped
            )[0]["embedding"]
        )
    except Exception as e:
        print("🔥 DeepFace embedding error:", e)
        return None

    best_distance = float("inf")
    identified_roll_number = None

    # Iterate through known embeddings (keys are roll numbers)
    for roll_number, db_emb in KNOWN_EMBEDS.items():
        d = norm(emb - db_emb) # Calculate Euclidean distance
        if d < thr and d < best_distance:
            best_distance = d
            identified_roll_number = roll_number
            
    return identified_roll_number

# ---------- Public API ----------
def process_frame(jpeg_bytes: bytes) -> dict:
    """
    Processes a single image frame (as JPEG bytes) for face recognition.
    Performs face detection, anti-spoofing, and identity recognition.
    If a person is identified and not a spoof, marks attendance in attendance.csv.
    """
    img = cv2.imdecode(np.frombuffer(jpeg_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return {"status": "Invalid image"}

    # 1. Face Detection
    faces = detector.detect_faces(img)
    if not faces:
        return {"status": "No face found"}

    # Assuming only one face for simplicity, or taking the first detected face
    x, y, w, h = faces[0]["box"]
    face_crop = img[max(0, y):y + h, max(0, x):x + w]

    # 2. Spoof Check
    spoof, _ = _is_spoof(face_crop)
    if spoof:
        return {"status": "Spoof attempt detected"}

    # 3. Identity Recognition
    # _who_is_it returns the roll_number
    roll_number = _who_is_it(cv2.resize(face_crop, (160, 160)))
    if not roll_number:
        return {"status": "Unknown face"}

    # 4. Record Attendance
    # Create attendance.csv if it doesn't exist
    attendance_file_path = ROOT / "attendance.csv"
    if not attendance_file_path.exists():
        with open(attendance_file_path, "w", newline="") as f:
            csv.writer(f).writerow(["Roll Number", "Timestamp"]) # Write header
            
    with open(attendance_file_path, "a", newline="") as f:
        csv.writer(f).writerow(
            [roll_number, datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
        )

    # Return success status with the identified roll number
    return {"status": "Attendance marked", "rollNumber": roll_number}