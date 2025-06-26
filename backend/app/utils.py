# utils.py
from mtcnn import MTCNN
import numpy as np
import pickle
from numpy.linalg import norm
from deepface import DeepFace
from datetime import datetime
import cv2
import csv

# Load MTCNN once
detector = MTCNN()

# Load saved embeddings
with open("embeddings.pkl", "rb") as f:
    known_faces = pickle.load(f)

# Convert to numpy
for name in known_faces:
    known_faces[name] = np.array(known_faces[name])

def recognize_face(image, threshold=8.0):
    try:
        faces = detector.detect_faces(image)
        if not faces:
            return "No face found"

        for face in faces:
            x1, y1, w, h = face['box']
            x1, y1 = abs(x1), abs(y1)
            x2, y2 = x1 + w, y1 + h
            face_crop = image[y1:y2, x1:x2]
            face_crop = cv2.resize(face_crop, (160, 160))

            try:
                result = DeepFace.represent(
                    face_crop,
                    model_name="Facenet",
                    enforce_detection=False
                )
                face_embedding = np.array(result[0]['embedding'])
            except:
                return "Embedding error"

            identity = "Unknown"
            min_dist = float("inf")

            for name, db_embed in known_faces.items():
                dist = norm(face_embedding - db_embed)
                if dist < threshold and dist < min_dist:
                    min_dist = dist
                    identity = name

            if identity != "Unknown":
                # Attendance Logging
                with open("attendance.csv", "a", newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([identity, datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
            return identity
    except Exception as e:
        return f"Error: {str(e)}"