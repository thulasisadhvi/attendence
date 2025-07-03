# app.py (Updated with MongoDB for Password Reset)
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
from pymongo import MongoClient # Import MongoClient for MongoDB

# Import functions from face_utils and pipeline
# Assuming these files (face_utils.py, utils/pipeline.py) are in the same directory structure
from face_utils import register_and_upload_embedding
from utils.pipeline import process_frame, reload_embeddings # Used in recognize and to refresh in-memory embeddings
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
load_dotenv() # Load environment variables from .env file

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

app = Flask(__name__)
# Enable CORS for all routes by default
CORS(app) # <<<--- This is correctly placed here! It applies to the 'app' instance.

# --- Face Recognition Configuration ---
DATASET_DIR = "dataset" # Directory where face images for each roll number are stored

# --- Email and User Management Configuration ---
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "poornimapraneetha42@gmail.com") # Get from env or fallback
APP_PASSWORD = os.getenv("APP_PASSWORD", "pesh fmzr jocf gmuk") # Get from env or fallback
# IMPORTANT: Never hardcode sensitive credentials like APP_PASSWORD in production code.
# Ensure these are only in your .env file locally and environment variables on Render.

# --- MongoDB Configuration ---
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@attendancedb.kvglgey.mongodb.net/AttendnaceDB?retryWrites=true&w=majority")
# IMPORTANT: Replace YOUR_USERNAME and YOUR_PASSWORD above with actual env variables
# If you hardcode it here (like you have 'sairajapanthula:1234'), that's a security risk
# and it will be visible in your deployed code if someone inspects the container.
# Always use os.getenv() for credentials.
# For example: MONGODB_URI = os.getenv("MONGODB_URI")
# Your current hardcoded password '1234' is visible and very insecure.

DB_NAME = os.getenv("MONGODB_DB_NAME", "AttendnaceDB") # Get DB name from env or fallback, more robust
# If you want to derive from URI, ensure it's robust:
# DB_NAME = MONGODB_URI.split('/')[-1].split('?')[0] # This derivation is fine

# Connect to MongoDB - This block is good to keep directly at module level
try:
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    students_collection = db.students # This maps to your Student.js model's collection
    print(f"✅ Connected to MongoDB: {MONGODB_URI.split('@')[0]}@... (Database: {DB_NAME}, Collection: students)")
    # Mask password for printing to logs
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    students_collection = None # Set to None if connection fails

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://attendence-mu.vercel.app") # Get rom env or fallback

RESET_TOKENS = {} # {token: email}

# ------------------ Utilities for Email/User Management ------------------
def send_email(to_email, reset_token):
    reset_url = f"{FRONTEND_URL}/reset-password?email={to_email}&token={reset_token}"
    # ... (email content and sending logic - this part looks fine) ...
    html_content = f"""
    <html>
      <body style="font-family: sans-serif;">
        <h2>Password Reset Request</h2>
        <p>You recently requested to reset your password.</p>
        <p>
          <a href="{reset_url}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </p>
        <p>If you didn’t request this, please ignore it.</p>
      </body>
    </html>
    """
    msg = MIMEMultipart("alternative")
    msg['Subject'] = "Reset Your Password"
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.send_message(msg)
        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        return False

# ------------------ Face Recognition Routes ---
@app.route("/register-face", methods=["POST"])
def register_face():
    roll_number = request.form.get("rollNumber", "").strip().lower()
    if not roll_number:
        return jsonify({"error": "Roll Number is required for face registration"}), 400

    images = request.files.getlist("images")
    if len(images) < 3:
        return jsonify({"error": "At least 3 images required for face registration"}), 400

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
        image_file.seek(0) # Reset file pointer for subsequent reads if any, or for register_and_upload_embedding

    # ✅ Upload embedding to MongoDB
    # Make sure register_and_upload_embedding takes the original FileStorage objects
    # and not just the raw image data if it needs the full file.
    # It might re-read the files from 'images' list.
    success = register_and_upload_embedding(roll_number, images)

    if not success:
        return jsonify({"error": "Failed to extract face embedding"}), 500

    print(f"✅ Face data for Roll Number {roll_number} uploaded to Cloudinary and MongoDB.")
    return jsonify({
        "message": f"Face data for Roll Number {roll_number} uploaded successfully.",
        "image_urls": uploaded_image_urls
    }), 200

@app.post("/recognize")
def recognize():
    """
    Receives an image, processes it for face detection, anti-spoofing,
    and recognition, then returns the identified roll number.
    """
    file = request.files.get("image")
    if file is None:
        return jsonify({"status": "No image part"}), 400
    
    recognition_result = process_frame(file.read())
    
    return jsonify(recognition_result)

# --- Add a simple root route for health checks / initial browser access ---
@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Attendance Backend API!", "status": "running"}), 200


# ------------------ API Endpoints for Email/User Password Reset (MongoDB Integrated) ------------------

# 🔑 Forgot Password Endpoint (Handles OPTIONS too)
@app.route("/api/forgotPassword", methods=["POST", "OPTIONS"])
def forgot_password():
    if request.method == "OPTIONS":
        return '', 204

    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email is required."}), 400

    if students_collection is None:
        print("MongoDB connection not established. Cannot process forgot password.")
        return jsonify({"message": "Server database error. Please try again later."}), 500

    user_data = students_collection.find_one({"email": email.lower(), "role": "student"})

    if not user_data:
        print(f"Attempted password reset for unregistered or non-student email: {email}")
        return jsonify({"message": "If this email is registered, a password reset link will be sent."}), 200

    reset_token = str(uuid.uuid4())
    RESET_TOKENS[reset_token] = email
    print(f"🔐 Generated reset token: {reset_token} for {email}")

    if send_email(email, reset_token):
        return jsonify({"message": "Password reset link sent to your email."}), 200
    else:
        return jsonify({"message": "Failed to send email. Please try again later."}), 500

# 🔐 Reset Password
@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    email = data.get("email")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")
    token = data.get("token")

    if not all([email, new_password, confirm_password, token]):
        return jsonify({"message": "All fields are required."}), 400

    if RESET_TOKENS.get(token) != email:
        return jsonify({"message": "Invalid or expired token."}), 403

    if new_password != confirm_password:
        return jsonify({"message": "Passwords do not match."}), 400

    if students_collection is None:
        print("MongoDB connection not established. Cannot process password reset.")
        return jsonify({"message": "Server database error. Please try again later."}), 500

    user_filter = {"email": email.lower(), "role": "student"}
    user_data = students_collection.find_one(user_filter)

    if not user_data:
        return jsonify({"message": "User not found or not a student."}), 404

    # --- IMPORTANT: HASH THE PASSWORD HERE ---
    # Current implementation updates plaintext password, which is a severe security risk.
    # You MUST implement password hashing (e.g., using Flask-Bcrypt or bcrypt library)
    # and ensure it's compatible with your Node.js backend's hashing.
    update_result = students_collection.update_one(
        user_filter,
        {"$set": {"password": new_password}} # <<<--- HASH THIS PASSWORD!
    )

    if update_result.modified_count == 0:
        print(f"⚠️ Password for {email} not modified. Maybe new password is same as old, or no matching student found.")
        return jsonify({"message": "Password reset processed (no changes made if new password was identical or user not found)."}), 200

    if token in RESET_TOKENS:
        del RESET_TOKENS[token]
    print(f"✅ Password reset successful for {email} in MongoDB.")

    return jsonify({"message": "Password has been reset successfully."}), 200

# --- Startup Logic (Moved outside __main__ for Gunicorn) ---
# This code will now always run when Gunicorn loads the 'app' module.
try:
    os.makedirs(DATASET_DIR, exist_ok=True)
    print("Building/loading initial face embeddings...")
    reload_embeddings() # This is critical for DeepFace and your app's core functionality
    print("Initial embeddings loaded. Server ready.")
except Exception as e:
    print(f"❌ Error during server startup (embeddings/dataset): {e}")
    # Consider what to do if this fails; app might not function correctly.

# --- Local Development ONLY Block ---
# This block will ONLY run if you execute 'python app.py' directly.
# Gunicorn will NOT execute this when deployed on Render.
if __name__ == "__main__":
    print("Running Flask development server (only for local testing).")
    # Make sure you are using port 10000 locally if that's what your frontend expects
    # for local dev, or adjust your frontend's local config.
    app.run(debug=True, port=8000, host="0.0.0.0")
