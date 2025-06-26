# face_utils.py — unified with DeepFace + MTCNN
import os
import cv2
import pickle
import numpy as np
from mtcnn import MTCNN
from deepface import DeepFace

DATASET_DIR     = "dataset"
EMBEDDINGS_PATH = "embeddings.pkl"

detector = MTCNN()

def save_embeddings():
    """
    Scan dataset/<roll_number> folders,
    - detect faces with MTCNN
    - embed with DeepFace / Facenet (128-d)
    - average per person (identified by roll number)
    Write one dict  {roll_number: avg_vector}  to embeddings.pkl
    """
    if not os.path.exists(DATASET_DIR):
        print("❌ dataset/ folder not found.")
        return

    person_encodings: dict[str, np.ndarray] = {}

    # Iterate through roll numbers (folders) in the dataset directory
    for roll_number in os.listdir(DATASET_DIR):
        person_path = os.path.join(DATASET_DIR, roll_number)
        if not os.path.isdir(person_path):
            continue  # skip stray files

        embeddings: list[np.ndarray] = []

        for img_file in os.listdir(person_path):
            if not img_file.lower().endswith((".jpg", ".jpeg", ".png")):
                continue

            img_path = os.path.join(person_path, img_file)
            img      = cv2.imread(img_path)

            if img is None:
                print(f"⚠  Cannot read image {img_path}")
                continue

            faces = detector.detect_faces(img)
            if not faces:
                print(f"❌ No face detected in {img_path}")
                continue

            x, y, w, h = faces[0]["box"]
            x, y = max(0, x), max(0, y)
            face_crop = img[y:y + h, x:x + w]
            face_crop = cv2.resize(face_crop, (160, 160))
            face_rgb  = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)

            try:
                rep = DeepFace.represent(
                    img_path=face_rgb,
                    model_name="Facenet",
                    enforce_detection=False
                )
                embeddings.append(np.array(rep[0]["embedding"]))
            except Exception as e:
                print(f"⚠  DeepFace failed on {img_path}: {e}")

        # average and store using roll_number as the key
        if embeddings:
            person_encodings[roll_number] = np.mean(embeddings, axis=0)
            print(f"✅ {roll_number}: averaged {len(embeddings)} embeddings")
        else:
            print(f"⚠  {roll_number}: no valid face embeddings collected")

    # ---- write pickle only if we have data ----
    if person_encodings:
        with open(EMBEDDINGS_PATH, "wb") as f:
            pickle.dump(person_encodings, f)
        print(f"🚀 Saved averaged embeddings for {len(person_encodings)} people.")
    else:
        print("🛑 No embeddings written (empty database).")