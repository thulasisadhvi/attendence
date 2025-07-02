import os
import cv2
import numpy as np
from mtcnn import MTCNN
from deepface import DeepFace
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB setup
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = MONGODB_URI.split('/')[-1].split('?')[0]
client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
collection = db.face_embeddings

# Face detector
detector = MTCNN()

def register_and_upload_embedding(roll_number: str, image_files: list) -> bool:
    """
    Detects face in given images, generates embeddings, averages them,
    and stores in MongoDB (upsert mode).
    """
    embeddings = []

    for image_file in image_files:
        try:
            # Read and decode image
            npimg = np.frombuffer(image_file.read(), np.uint8)
            img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

            if img is None:
                print("⚠️ Could not decode image.")
                continue

            faces = detector.detect_faces(img)
            if not faces:
                print("❌ No face detected in image.")
                continue

            x, y, w, h = faces[0]['box']
            x, y = max(0, x), max(0, y)
            face_crop = img[y:y+h, x:x+w]
            face_crop = cv2.resize(face_crop, (160, 160))
            face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)

            # Get FaceNet embedding using DeepFace
            rep = DeepFace.represent(
                img_path=face_rgb,
                model_name="Facenet",
                enforce_detection=False
            )

            embeddings.append(np.array(rep[0]["embedding"]))

        except Exception as e:
            print(f"⚠️ Error during embedding: {e}")
            continue

    if not embeddings:
        print(f"🛑 No valid embeddings generated for {roll_number}")
        return False

    avg_embedding = np.mean(embeddings, axis=0)

    # Upload to MongoDB
    try:
        collection.update_one(
            {"rollNumber": roll_number},
            {"$set": {"embedding": avg_embedding.tolist()}},
            upsert=True
        )
        print(f"✅ MongoDB embedding saved for {roll_number}")
        return True

    except Exception as e:
        print(f"❌ Failed to save embedding to MongoDB: {e}")
        return False
