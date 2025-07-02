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
from face_utils import save_embeddings # Used in register_face to build embeddings.pkl
from utils.pipeline import process_frame, reload_embeddings # Used in recognize and to refresh in-memory embeddings

app = Flask(__name__)
CORS(app) # Enable CORS for all routes by default, including for specific origins where needed

# --- Face Recognition Configuration ---
DATASET_DIR = "dataset" # Directory where face images for each roll number are stored

# --- Email and User Management Configuration ---
SENDER_EMAIL = "poornimapraneetha42@gmail.com" # <--- IMPORTANT: Replace with your actual sender email
APP_PASSWORD = "pesh fmzr jocf gmuk"    # <--- IMPORTANT: Replace with your actual app password

# --- MongoDB Configuration ---
# Get MongoDB URI from environment variable (ensure it's set in your .env or environment)
# Example: MONGODB_URI=mongodb://localhost:27017/myStudentsDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/myStudentsDB")
DB_NAME = MONGODB_URI.split('/')[-1].split('?')[0] # Extract database name from URI
# Connect to MongoDB
try:
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    students_collection = db.students # This maps to your Student.js model's collection
    print(f"✅ Connected to MongoDB: {MONGODB_URI} (Database: {DB_NAME}, Collection: students)")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    # In a real app, you might want to exit or handle this more gracefully
    students_collection = None # Set to None if connection fails

# --- Original users.json file path - NO LONGER USED FOR AUTH, kept for other potential uses if needed ---
# USERS_DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'users.json')

FRONTEND_URL = "http://localhost:5173" # Update if your frontend is on a different URL/port

# ------------------ Utilities for Email/User Management ------------------
# load_users and save_users are NO LONGER USED FOR AUTHENTICATION
# They are commented out as they interacted with users.json
# def load_users():
#     if os.path.exists(USERS_DB_FILE):
#         with open(USERS_DB_FILE, 'r') as f:
#             try:
#                 return json.load(f)
#             except json.JSONDecodeError:
#                 print(f"Warning: {USERS_DB_FILE} is empty or malformed. Starting with empty user database.")
#                 return {}
#     print(f"Warning: {USERS_DB_FILE} does not exist. Starting with empty user database.")
#     return {}

# def save_users(users):
#     with open(USERS_DB_FILE, 'w') as f:
#         json.dump(users, f, indent=4)

# USERS_DB = load_users() # Initial load of users. This will be re-loaded within reset_password for freshness.
RESET_TOKENS = {} # {token: email}

# ------------------ Email Sender ------------------
def send_email(to_email, reset_token):
    reset_url = f"{FRONTEND_URL}/reset-password?email={to_email}&token={reset_token}"

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
    save_embeddings()    # Rebuilds and saves embeddings to embeddings.pkl
    reload_embeddings() # Reloads the updated embeddings.pkl into the in-memory KNOWN_EMBEDS

    print(f"Face data for Roll Number {roll_number} registered successfully with {len(images)} images.")
    return jsonify({"message": f"Face data for Roll Number {roll_number} registered successfully with {len(images)} images."}), 200

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

# ------------------ API Endpoints for Email/User Password Reset (MongoDB Integrated) ------------------

# 🔑 Forgot Password Endpoint (Handles OPTIONS too)
@app.route("/api/forgotPassword", methods=["POST", "OPTIONS"])
def forgot_password():
    if request.method == "OPTIONS":
        # This is for CORS preflight requests
        return '', 204

    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email is required."}), 400

    if students_collection is None:
        print("MongoDB connection not established. Cannot process forgot password.")
        return jsonify({"message": "Server database error. Please try again later."}), 500

    # Find the user by email in MongoDB's 'students' collection
    # Note: Ensure emails are stored consistently (e.g., lowercase) in your DB
    user_data = students_collection.find_one({"email": email.lower(), "role": "student"})

    # For security, always return a success message even if the email isn't registered,
    # to prevent enumeration of registered emails.
    if not user_data:
        print(f"Attempted password reset for unregistered or non-student email: {email}")
        return jsonify({"message": "If this email is registered, a password reset link will be sent."}), 200

    reset_token = str(uuid.uuid4())
    RESET_TOKENS[reset_token] = email # Store token mapped to email
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

    # Find the user in MongoDB
    user_filter = {"email": email.lower(), "role": "student"}
    user_data = students_collection.find_one(user_filter)

    if not user_data:
        return jsonify({"message": "User not found or not a student."}), 404

    # --- IMPORTANT: HASH THE PASSWORD HERE ---
    # Your Node.js backend *must* also hash passwords.
    # Ensure this Flask app uses the *same hashing algorithm* (e.g., bcrypt)
    # and the *same salting strategy* as your Node.js backend.
    # For demonstration, showing plaintext update. Replace with proper hashing!
    
    # Update the password in MongoDB
    update_result = students_collection.update_one(
        user_filter,
        {"$set": {"password": new_password}}
    )

    if update_result.modified_count == 0:
        print(f"⚠️ Password for {email} not modified. Maybe new password is same as old, or no matching student found.")
        # Return a success message even if not modified, to avoid giving away information
        return jsonify({"message": "Password reset processed (no changes made if new password was identical or user not found)."}), 200

    # Invalidate the token after use
    if token in RESET_TOKENS:
        del RESET_TOKENS[token]
    print(f"✅ Password reset successful for {email} in MongoDB.")

    return jsonify({"message": "Password has been reset successfully."}), 200

# ------------------ Main execution block ---
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
