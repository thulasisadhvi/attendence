# ---------- ENVIRONMENT SETUP: Place this at the very top ----------
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"         # Suppress TF logs
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"         # Disable CUDA GPU
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"         # Avoid ONEDNN errors
os.environ["TF_USE_MPS"] = "0"                    # Avoid Apple MPS errors

# ---------- Do NOT import tensorflow, deepface or any dependent packages yet ----------

# ---------- PATH SETUP ----------
from pathlib import Path
import pickle, csv
from datetime import datetime
import cv2, numpy as np
from numpy.linalg import norm
import sys
from dotenv import load_dotenv

# TensorFlow must be imported ONLY after environment vars are set
import tensorflow as tf
  # ✅ Do this before importing DeepFace

# ✅ Now import DeepFace (uses TensorFlow internally)
from deepface import DeepFace
from mtcnn import MTCNN

# Load environment variables
load_dotenv()

# ----- Setup for anti-spoofing model path -----
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.append(str(ROOT / "Silent-Face-Anti-Spoofing"))

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
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def _load_db() -> dict[str, np.ndarray]:
    """Loads face embeddings from MongoDB."""
    try:
        MONGODB_URI = os.getenv("MONGODB_URI")
        DB_NAME = MONGODB_URI.split('/')[-1].split('?')[0]
        client = MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        collection = db.face_embeddings

        known = {}
        for doc in collection.find():
            roll = doc.get("rollNumber")
            emb  = doc.get("embedding")
            if roll and emb:
                known[roll] = np.array(emb)
        print(f"✅ Loaded {len(known)} embeddings from MongoDB.")
        return known
    except Exception as e:
        print(f"❌ Failed to load embeddings from MongoDB: {e}")
        return {}
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
