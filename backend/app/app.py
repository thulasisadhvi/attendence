from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import numpy as np
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import uuid
from pymongo import MongoClient
from face_utils import register_and_upload_embedding
from utils.pipeline import process_frame, reload_embeddings
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
load_dotenv()

# Cloudinary Config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

app = Flask(__name__)

# ✅ Best CORS setup
CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": ["https://attendence-mu.vercel.app"]
    }
})

# Paths
DATASET_DIR = "dataset"
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
APP_PASSWORD = os.getenv("APP_PASSWORD")
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "AttendnaceDB")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://attendence-mu.vercel.app")

# MongoDB Connection
try:
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    students_collection = db.students
    print(f"✅ Connected to MongoDB")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    students_collection = None

RESET_TOKENS = {}

# ---------------------- Routes ----------------------

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the Attendance Backend API!", "status": "running"}), 200

@app.route("/register-face", methods=["POST", "OPTIONS"])
def register_face():
    if request.method == "OPTIONS":
        return '', 204

    roll_number = request.form.get("rollNumber", "").strip().lower()
    if not roll_number:
        return jsonify({"error": "Roll Number is required"}), 400

    images = request.files.getlist("images")
    if len(images) < 3:
        return jsonify({"error": "At least 3 images required"}), 400

    uploaded_image_urls = []

    for idx, image_file in enumerate(images):
        npimg = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": f"Could not decode image {image_file.filename}"}), 400

        temp_path = f"/tmp/{roll_number}_img_{idx}.jpg"
        cv2.imwrite(temp_path, img)

        result = cloudinary.uploader.upload(temp_path, folder=f"face_attendance/{roll_number}")
        uploaded_image_urls.append(result["secure_url"])
        image_file.seek(0)

    success = register_and_upload_embedding(roll_number, images)
    if not success:
        return jsonify({"error": "Failed to extract face embedding"}), 500

    return jsonify({
        "message": f"Face data for {roll_number} uploaded.",
        "image_urls": uploaded_image_urls
    }), 200

@app.post("/recognize")
def recognize():
    file = request.files.get("image")
    if not file:
        return jsonify({"status": "No image uploaded"}), 400
    result = process_frame(file.read())
    return jsonify(result)

@app.route("/api/forgotPassword", methods=["POST", "OPTIONS"])
def forgot_password():
    if request.method == "OPTIONS":
        return '', 204

    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email is required"}), 400

    if students_collection is None:
        return jsonify({"message": "Server DB error"}), 500

    user_data = students_collection.find_one({"email": email.lower(), "role": "student"})
    if not user_data:
        return jsonify({"message": "If registered, a link will be sent."}), 200

    reset_token = str(uuid.uuid4())
    RESET_TOKENS[reset_token] = email

    reset_url = f"{FRONTEND_URL}/reset-password?email={email}&token={reset_token}"
    html_content = f"""
    <html>
      <body>
        <h2>Password Reset</h2>
        <p><a href="{reset_url}">Reset Password</a></p>
      </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg['Subject'] = "Reset Your Password"
    msg['From'] = SENDER_EMAIL
    msg['To'] = email
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.send_message(msg)
        return jsonify({"message": "Reset link sent."}), 200
    except Exception as e:
        print(f"❌ Email failed: {e}")
        return jsonify({"message": "Failed to send email."}), 500

@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    email = data.get("email")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")
    token = data.get("token")

    if not all([email, new_password, confirm_password, token]):
        return jsonify({"message": "All fields required."}), 400

    if new_password != confirm_password:
        return jsonify({"message": "Passwords do not match."}), 400

    if RESET_TOKENS.get(token) != email:
        return jsonify({"message": "Invalid or expired token."}), 403

    user_filter = {"email": email.lower(), "role": "student"}
    user_data = students_collection.find_one(user_filter)
    if not user_data:
        return jsonify({"message": "User not found."}), 404

    # TODO: HASH PASSWORD before storing
    students_collection.update_one(
        user_filter,
        {"$set": {"password": new_password}}
    )

    RESET_TOKENS.pop(token, None)
    return jsonify({"message": "Password reset successful."}), 200

# On startup
try:
    os.makedirs(DATASET_DIR, exist_ok=True)
    print("Loading embeddings...")
    reload_embeddings()
    print("Server ready.")
except Exception as e:
    print(f"Startup error: {e}")

if __name__ == "__main__":
    app.run(debug=True, port=8000, host="0.0.0.0")
