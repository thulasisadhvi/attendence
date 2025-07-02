# Use a stable Python version that works with TensorFlow and DeepFace
FROM python:3.10-slim # Good choice for a base image

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /app

# Install system dependencies (important for OpenCV, TensorFlow, etc.)
# Keep this as it is, it's good practice for deep learning libraries.
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt first to leverage Docker caching
# This allows Docker to cache the dependency installation layer.
COPY requirements.txt .

# Upgrade pip and install Python dependencies
RUN pip install --no-cache-dir --upgrade pip

# --- START OF CHANGES FOR DEEPFACE PRE-DOWNLOAD ---
# Install deepface specifically first. This makes the 'deepface' module available
# for the subsequent Python command that triggers model downloads.
RUN pip install --no-cache-dir deepface

# Pre-download DeepFace models during the Docker image build process.
# This prevents timeouts during application startup caused by large model downloads.
RUN python -c "import os; from deepface import DeepFace; print('Attempting DeepFace model downloads...'); models_to_download = ['Facenet', 'VGG-Face', 'OpenFace', 'DeepID', 'Dlib', 'ArcFace', 'Emotion', 'Age', 'Gender', 'Race']; for model_name in models_to_download: try: print(f'Downloading {model_name}...'); _ = DeepFace.build_model(model_name) except Exception as e: print(f'Failed to download {model_name}: {e}')"

# Install all other dependencies from requirements.txt.
# pip will intelligently skip or update 'deepface' if it's already handled.
RUN pip install --no-cache-dir -r requirements.txt
# --- END OF CHANGES FOR DEEPFACE PRE-DOWNLOAD ---

# Copy the rest of your application code into the container
# This should be done AFTER installing dependencies to optimize Docker caching
COPY . /app

# Expose port (Render defaults to 10000 for web services)
EXPOSE 10000

# Run the Flask app with gunicorn
# --- START OF CHANGES FOR GUNICORN TIMEOUT ---
# Add --timeout and --graceful-timeout to give Gunicorn more time to start workers.
# Also, explicitly bind to 0.0.0.0:10000 as required by Render.
CMD ["gunicorn", "app:app", "--timeout", "300", "--graceful-timeout", "300", "--bind", "0.0.0.0:10000"]
# --- END OF CHANGES FOR GUNICORN TIMEOUT ---
