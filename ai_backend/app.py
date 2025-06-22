from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import requests
import imagehash
import io, os
from pymongo import MongoClient
from datetime import datetime
import numpy as np
from bson import ObjectId
import json
import cv2
from scipy import ndimage
from skimage import measure
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from deepface import DeepFace
import uuid
import warnings
from dotenv import load_dotenv
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# MongoDB setup
load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI environment variable not set")

client = MongoClient(MONGODB_URI)
db = client['bingo_app']
user_images_collection = db['user_images']

# Create index for faster queries
user_images_collection.create_index([("user_id", 1), ("created_at", -1)])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load CLIP model
print("Loading CLIP model...")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
print("CLIP model loaded successfully!")

# Load AI Detection Model (using EfficientNet as base)
print("Loading AI Detection model...")
try:
    ai_detection_model = Sequential([
        EfficientNetB0(weights='imagenet', include_top=False, input_shape=(224, 224, 3)),
        GlobalAveragePooling2D(),
        Dense(512, activation='relu'),
        Dropout(0.5),
        Dense(256, activation='relu'),
        Dropout(0.3),
        Dense(1, activation='sigmoid')  # Binary classification: AI-generated or not
    ])
    
    print("AI Detection model initialized successfully!")
except Exception as e:
    print(f"Warning: Could not load AI detection model: {e}")
    ai_detection_model = None

# ==================== UTILITY FUNCTIONS ====================

def save_temp_file(uploaded_file, prefix="img"):
    """Save a Werkzeug FileStorage to a unique temp path, return the path."""
    ext = os.path.splitext(uploaded_file.filename)[1] or ".jpg"
    temp_path = f"{prefix}_{uuid.uuid4().hex}{ext}"
    uploaded_file.save(temp_path)
    return temp_path

def load_image(source):
    """Load PIL image from URL, local path, or file upload"""
    try:
        if hasattr(source, 'save'):  # FileStorage object
            temp_path = save_temp_file(source)
            image = Image.open(temp_path).convert("RGB")
            os.remove(temp_path)
            return image
        elif isinstance(source, str):
            if source.startswith("http://") or source.startswith("https://"):
                response = requests.get(source, timeout=10)
                response.raise_for_status()
                image_data = response.content
                return Image.open(io.BytesIO(image_data)).convert("RGB")
            else:
                return Image.open(source).convert("RGB")
        else:
            raise ValueError("Invalid image source type")
    except Exception as e:
        print(f"Error loading image from {source}: {str(e)}")
        raise

def get_clip_embedding(pil_image):
    """Get CLIP embedding from PIL image"""
    try:
        inputs = processor(images=pil_image, return_tensors="pt")
        with torch.no_grad():
            embedding = model.get_image_features(**inputs)
        return embedding / embedding.norm(p=2)
    except Exception as e:
        print(f"Error getting CLIP embedding: {str(e)}")
        raise

def get_phash(pil_image):
    """Get perceptual hash"""
    try:
        return str(imagehash.phash(pil_image))
    except Exception as e:
        print(f"Error getting pHash: {str(e)}")
        raise

# ==================== AI DETECTION FUNCTIONS ====================

def detect_ai_generated_image(pil_image):
    """Detect if an image is AI-generated using multiple techniques"""
    results = {
        "is_ai_generated": False,
        "confidence": 0.0,
        "methods_used": [],
        "details": {}
    }
    
    try:
        img_array = np.array(pil_image)
        
        # Method 1: Statistical Analysis
        stats_result = analyze_statistical_properties(img_array)
        results["details"]["statistical_analysis"] = stats_result
        results["methods_used"].append("statistical_analysis")
        
        # Method 2: Frequency Domain Analysis
        freq_result = analyze_frequency_domain(img_array)
        results["details"]["frequency_analysis"] = freq_result
        results["methods_used"].append("frequency_analysis")
        
        # Method 3: Texture Analysis
        texture_result = analyze_texture_patterns(img_array)
        results["details"]["texture_analysis"] = texture_result
        results["methods_used"].append("texture_analysis")
        
        # Method 4: CLIP-based Detection
        clip_result = clip_based_ai_detection(pil_image)
        results["details"]["clip_analysis"] = clip_result
        results["methods_used"].append("clip_analysis")
        
        # Combine all methods for final decision
        combined_score = (
            stats_result["ai_probability"] * 0.2 +
            freq_result["ai_probability"] * 0.3 +
            texture_result["ai_probability"] * 0.3 +
            clip_result["ai_probability"] * 0.2
        )
        
        results["confidence"] = combined_score
        results["is_ai_generated"] = combined_score > 0.6
        
        print(f"AI Detection Results: {results['confidence']:.3f} confidence, AI Generated: {results['is_ai_generated']}")
        
    except Exception as e:
        print(f"Error in AI detection: {str(e)}")
        results["error"] = str(e)
    
    return results

def analyze_statistical_properties(img_array):
    """Analyze statistical properties that might indicate AI generation"""
    try:
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        mean_val = np.mean(gray)
        std_val = np.std(gray)
        skewness = np.mean(((gray - mean_val) / std_val) ** 3)
        kurtosis = np.mean(((gray - mean_val) / std_val) ** 4) - 3
        
        ai_indicators = 0
        if std_val < 30:
            ai_indicators += 1
        if abs(skewness) > 2:
            ai_indicators += 1
        if abs(kurtosis) > 5:
            ai_indicators += 1
        
        ai_probability = min(ai_indicators / 3.0, 1.0)
        
        return {
            "ai_probability": ai_probability,
            "mean": float(mean_val),
            "std": float(std_val),
            "skewness": float(skewness),
            "kurtosis": float(kurtosis),
            "indicators_found": ai_indicators
        }
    except Exception as e:
        return {"ai_probability": 0.0, "error": str(e)}

def analyze_frequency_domain(img_array):
    """Analyze frequency domain characteristics"""
    try:
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        fft = np.fft.fft2(gray)
        fft_shift = np.fft.fftshift(fft)
        magnitude_spectrum = np.abs(fft_shift)
        
        center_y, center_x = np.array(magnitude_spectrum.shape) // 2
        high_freq_power = np.sum(magnitude_spectrum[center_y-20:center_y+20, center_x-20:center_x+20])
        total_power = np.sum(magnitude_spectrum)
        high_freq_ratio = high_freq_power / total_power if total_power > 0 else 0
        
        ai_probability = 0.0
        if high_freq_ratio < 0.1:
            ai_probability = 0.7
        elif high_freq_ratio > 0.8:
            ai_probability = 0.6
        
        return {
            "ai_probability": ai_probability,
            "high_freq_ratio": float(high_freq_ratio),
            "total_power": float(total_power)
        }
    except Exception as e:
        return {"ai_probability": 0.0, "error": str(e)}

def analyze_texture_patterns(img_array):
    """Analyze texture patterns that might indicate AI generation"""
    try:
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        def local_binary_pattern(image, radius=1, n_points=8):
            lbp = np.zeros_like(image)
            for i in range(radius, image.shape[0] - radius):
                for j in range(radius, image.shape[1] - radius):
                    center = image[i, j]
                    binary_string = ''
                    for k in range(n_points):
                        angle = 2 * np.pi * k / n_points
                        x = int(i + radius * np.cos(angle))
                        y = int(j + radius * np.sin(angle))
                        if x >= 0 and x < image.shape[0] and y >= 0 and y < image.shape[1]:
                            binary_string += '1' if image[x, y] >= center else '0'
                    lbp[i, j] = int(binary_string, 2) if binary_string else 0
            return lbp
        
        lbp = local_binary_pattern(gray)
        hist, _ = np.histogram(lbp.flatten(), bins=256, range=(0, 256))
        hist = hist / np.sum(hist)
        entropy = -np.sum(hist * np.log2(hist + 1e-10))
        
        ai_probability = 0.0
        if entropy < 6:
            ai_probability = 0.5
        elif entropy > 8:
            ai_probability = 0.4
        
        return {
            "ai_probability": ai_probability,
            "texture_entropy": float(entropy),
            "lbp_uniformity": float(np.std(hist))
        }
    except Exception as e:
        return {"ai_probability": 0.0, "error": str(e)}

def clip_based_ai_detection(pil_image):
    """Use CLIP to detect AI-generated characteristics"""
    try:
        ai_prompts = [
            "artificial intelligence generated image",
            "computer generated artwork",
            "digital art created by AI",
            "synthetic image",
            "AI rendered picture"
        ]
        
        real_prompts = [
            "real photograph",
            "natural photography",
            "authentic image",
            "camera captured photo",
            "genuine photograph"
        ]
        
        image_inputs = processor(images=pil_image, return_tensors="pt")
        with torch.no_grad():
            image_features = model.get_image_features(**image_inputs)
            image_features = image_features / image_features.norm(p=2)
        
        all_prompts = ai_prompts + real_prompts
        text_inputs = processor(text=all_prompts, return_tensors="pt", padding=True)
        with torch.no_grad():
            text_features = model.get_text_features(**text_inputs)
            text_features = text_features / text_features.norm(p=2, dim=-1, keepdim=True)
        
        similarities = torch.nn.functional.cosine_similarity(
            image_features.unsqueeze(1), text_features.unsqueeze(0), dim=2
        ).squeeze()
        
        ai_scores = similarities[:len(ai_prompts)]
        real_scores = similarities[len(ai_prompts):]
        
        avg_ai_score = torch.mean(ai_scores).item()
        avg_real_score = torch.mean(real_scores).item()
        
        if avg_ai_score + avg_real_score > 0:
            ai_probability = avg_ai_score / (avg_ai_score + avg_real_score)
        else:
            ai_probability = 0.5
        
        return {
            "ai_probability": float(ai_probability),
            "avg_ai_score": float(avg_ai_score),
            "avg_real_score": float(avg_real_score),
            "max_ai_similarity": float(torch.max(ai_scores)),
            "max_real_similarity": float(torch.max(real_scores))
        }
    except Exception as e:
        return {"ai_probability": 0.0, "error": str(e)}

# ==================== DUPLICATE DETECTION FUNCTIONS ====================

def is_duplicate_phash(hash1, hash2, threshold=5):
    """Check if two images are duplicates using pHash"""
    try:
        h1 = imagehash.hex_to_hash(hash1)
        h2 = imagehash.hex_to_hash(hash2)
        diff = abs(h1 - h2)
        print(f"[pHash] Hamming Distance: {diff}")
        return diff <= threshold
    except Exception as e:
        print(f"Error comparing pHash: {str(e)}")
        return False

def is_duplicate_clip(embedding1, embedding2, threshold=0.93):
    """Check CLIP similarity"""
    try:
        if isinstance(embedding1, list):
            embedding1 = torch.tensor(embedding1)
        if isinstance(embedding2, list):
            embedding2 = torch.tensor(embedding2)
        
        sim = torch.nn.functional.cosine_similarity(embedding1.unsqueeze(0), embedding2.unsqueeze(0)).item()
        print(f"[CLIP] Similarity: {sim:.4f}")
        return sim > threshold, sim
    except Exception as e:
        print(f"Error comparing CLIP embeddings: {str(e)}")
        return False, 0.0

# ==================== DATABASE FUNCTIONS ====================

def save_user_image(user_id, image_url, mission_id, phash, clip_embedding, ai_detection_result=None):
    """Save image data to MongoDB"""
    try:
        image_doc = {
            "user_id": user_id,
            "image_url": image_url,
            "mission_id": mission_id,
            "phash": phash,
            "clip_embedding": clip_embedding.squeeze().tolist(),
            "ai_detection": ai_detection_result,
            "created_at": datetime.utcnow(),
            "status": "active"
        }
        
        result = user_images_collection.insert_one(image_doc)
        print(f"Saved image for user {user_id} with ID: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        print(f"Error saving image to database: {str(e)}")
        raise

def get_user_previous_images(user_id, exclude_id=None):
    """Get all previous images for a user"""
    try:
        query = {"user_id": user_id, "status": "active"}
        if exclude_id:
            query["_id"] = {"$ne": ObjectId(exclude_id)}
        
        cursor = user_images_collection.find(query).sort("created_at", -1)
        return list(cursor)
    except Exception as e:
        print(f"Error fetching user images: {str(e)}")
        return []

# ==================== API ENDPOINTS ====================

@app.route("/comprehensive_check", methods=["POST"])
def comprehensive_check():
    """
    Comprehensive endpoint that performs all three checks:
    1. AI generation detection
    2. Duplicate detection
    3. Face verification (optional)
    
    Accepts either:
    - JSON with image_url and optional profile_image_url
    - Form-data with image file and optional profile_image file
    """
    try:
        # Handle different input types
        if request.content_type and 'application/json' in request.content_type:
            data = request.json
            image_url = data.get("image_url")
            profile_image_url = data.get("profile_image_url")
            user_id = data.get("user_id")
            mission_id = data.get("mission_id", "unknown")
            
            if not image_url or not user_id:
                return jsonify({"error": "Missing image_url or user_id"}), 400
            
            current_img = load_image(image_url)
            profile_img = load_image(profile_image_url) if profile_image_url else None
            
        else:
            # Handle form-data
            image_file = request.files.get("image")
            profile_file = request.files.get("profile_image")
            user_id = request.form.get("user_id")
            mission_id = request.form.get("mission_id", "unknown")
            
            if not image_file or not user_id:
                return jsonify({"error": "Missing image file or user_id"}), 400
            
            current_img = load_image(image_file)
            profile_img = load_image(profile_file) if profile_file else None

        print(f"Starting comprehensive check for user: {user_id}")

        # Step 1: AI Detection
        print("Step 1: Checking for AI generation...")
        ai_detection_result = detect_ai_generated_image(current_img)
        
        if ai_detection_result["is_ai_generated"] and ai_detection_result["confidence"] > 0.7:
            return jsonify({
                "status": "rejected",
                "reason": "ai_generated",
                "ai_generated": True,
                "ai_confidence": ai_detection_result["confidence"],
                "ai_details": ai_detection_result["details"],
                "message": "Image appears to be AI-generated and cannot be accepted as proof"
            })

        # Step 2: Duplicate Detection
        print("Step 2: Checking for duplicates...")
        current_phash = get_phash(current_img)
        current_embedding = get_clip_embedding(current_img)
        
        previous_images = get_user_previous_images(user_id)
        print(f"Found {len(previous_images)} previous images for user {user_id}")

        for prev_img_doc in previous_images:
            prev_phash = prev_img_doc.get("phash")
            prev_embedding = prev_img_doc.get("clip_embedding")
            prev_url = prev_img_doc.get("image_url")
            
            if not prev_phash or not prev_embedding:
                continue

            # Check pHash first
            if is_duplicate_phash(current_phash, prev_phash):
                return jsonify({
                    "status": "rejected",
                    "reason": "duplicate",
                    "duplicate": True,
                    "method": "phash",
                    "matched_image": prev_url,
                    "matched_date": prev_img_doc.get("created_at").isoformat() if prev_img_doc.get("created_at") else None,
                    "ai_generated": ai_detection_result["is_ai_generated"],
                    "ai_confidence": ai_detection_result["confidence"]
                })

            # Check CLIP similarity
            is_dup, similarity = is_duplicate_clip(current_embedding, prev_embedding)
            if is_dup:
                return jsonify({
                    "status": "rejected",
                    "reason": "duplicate",
                    "duplicate": True,
                    "method": "clip",
                    "similarity": similarity,
                    "matched_image": prev_url,
                    "matched_date": prev_img_doc.get("created_at").isoformat() if prev_img_doc.get("created_at") else None,
                    "ai_generated": ai_detection_result["is_ai_generated"],
                    "ai_confidence": ai_detection_result["confidence"]
                })

        # Step 3: Face Verification (if profile image provided)
        face_verification_result = None
        if profile_img:
            print("Step 3: Performing face verification...")
            try:
                # Save temporary files for DeepFace
                temp1 = f"temp_current_{uuid.uuid4().hex}.jpg"
                temp2 = f"temp_profile_{uuid.uuid4().hex}.jpg"
                
                current_img.save(temp1)
                profile_img.save(temp2)
                
                try:
                    face_result = DeepFace.verify(
                        img1_path=temp1,
                        img2_path=temp2,
                        model_name="VGG-Face",
                        detector_backend="mtcnn"
                    )
                    
                    face_verification_result = {
                        "verified": face_result.get("verified", False),
                        "distance": face_result.get("distance"),
                        "threshold": face_result.get("threshold")
                    }
                    
                    # If face verification fails, reject
                    if not face_verification_result["verified"]:
                        return jsonify({
                            "status": "rejected",
                            "reason": "face_mismatch",
                            "face_verified": False,
                            "face_verification": face_verification_result,
                            "ai_generated": ai_detection_result["is_ai_generated"],
                            "ai_confidence": ai_detection_result["confidence"],
                            "message": "Face does not match profile image"
                        })
                        
                finally:
                    # Clean up temp files
                    for temp_file in [temp1, temp2]:
                        if os.path.exists(temp_file):
                            try:
                                os.remove(temp_file)
                            except:
                                pass
                                
            except Exception as face_error:
                print(f"Face verification error: {str(face_error)}")
                face_verification_result = {"error": str(face_error)}

        # All checks passed - save the image
        try:
            image_url_to_save = image_url if 'image_url' in locals() else f"uploaded_file_{uuid.uuid4().hex}"
            saved_id = save_user_image(user_id, image_url_to_save, mission_id, current_phash, current_embedding, ai_detection_result)
            
            return jsonify({
                "status": "approved",
                "message": "All checks passed - image is valid",
                "saved_id": saved_id,
                "ai_generated": ai_detection_result["is_ai_generated"],
                "ai_confidence": ai_detection_result["confidence"],
                "ai_details": ai_detection_result["details"],
                "duplicate": False,
                "face_verified": face_verification_result["verified"] if face_verification_result else None,
                "face_verification": face_verification_result
            })
            
        except Exception as save_error:
            return jsonify({
                "status": "approved",
                "message": "All checks passed but couldn't save to database",
                "ai_generated": ai_detection_result["is_ai_generated"],
                "ai_confidence": ai_detection_result["confidence"],
                "duplicate": False,
                "face_verified": face_verification_result["verified"] if face_verification_result else None,
                "error": str(save_error)
            })

    except Exception as e:
        print(f"Error in comprehensive check: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route("/check_duplicate", methods=["POST"])
def check_duplicate():
    """Legacy endpoint for duplicate detection only"""
    try:
        data = request.json
        image_url = data.get("image_url")
        user_id = data.get("user_id")
        mission_id = data.get("mission_id", "unknown")
        
        if not image_url or not user_id:
            return jsonify({"error": "Missing image_url or user_id"}), 400

        current_img = load_image(image_url)
        current_phash = get_phash(current_img)
        current_embedding = get_clip_embedding(current_img)
        ai_detection_result = detect_ai_generated_image(current_img)
        
        if ai_detection_result["is_ai_generated"] and ai_detection_result["confidence"] > 0.7:
            return jsonify({
                "duplicate": False,
                "ai_generated": True,
                "ai_confidence": ai_detection_result["confidence"],
                "message": "Image appears to be AI-generated",
                "rejected": True
            })

        previous_images = get_user_previous_images(user_id)
        
        for prev_img_doc in previous_images:
            prev_phash = prev_img_doc.get("phash")
            prev_embedding = prev_img_doc.get("clip_embedding")
            prev_url = prev_img_doc.get("image_url")
            
            if not prev_phash or not prev_embedding:
                continue

            if is_duplicate_phash(current_phash, prev_phash):
                return jsonify({
                    "duplicate": True,
                    "method": "phash",
                    "matched_image": prev_url,
                    "ai_generated": ai_detection_result["is_ai_generated"]
                })

            is_dup, similarity = is_duplicate_clip(current_embedding, prev_embedding)
            if is_dup:
                return jsonify({
                    "duplicate": True,
                    "method": "clip",
                    "similarity": similarity,
                    "matched_image": prev_url,
                    "ai_generated": ai_detection_result["is_ai_generated"]
                })

        saved_id = save_user_image(user_id, image_url, mission_id, current_phash, current_embedding, ai_detection_result)
        
        return jsonify({
            "duplicate": False,
            "saved_id": saved_id,
            "ai_generated": ai_detection_result["is_ai_generated"],
            "ai_confidence": ai_detection_result["confidence"],
            "message": "Image is unique and has been saved"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/verify", methods=["POST"])
def verify_faces():
    """Face verification endpoint"""
    file1 = request.files.get("image1")
    file2 = request.files.get("image2")

    if not file1 or not file2:
        return jsonify({
            "error": "Please upload two files under form-data keys 'image1' and 'image2'."
        }), 400

    temp1 = None
    temp2 = None
    try:
        temp1 = save_temp_file(file1, prefix="img1")
        temp2 = save_temp_file(file2, prefix="img2")
        
        result = DeepFace.verify(
            img1_path=temp1,
            img2_path=temp2,
            model_name="VGG-Face",
            detector_backend="mtcnn"
        )
        
        return jsonify({
            "verified": result.get("verified", False),
            "distance": result.get("distance"),
            "threshold": result.get("threshold"),
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Face verification error: {e}"}), 500
    finally:
        for temp_file in [temp1, temp2]:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass

@app.route("/analyze_ai_only", methods=["POST"])
def analyze_ai_only():
    """AI detection only endpoint"""
    try:
        data = request.json
        image_url = data.get("image_url")
        
        if not image_url:
            return jsonify({"error": "Missing image_url"}), 400
        
        current_img = load_image(image_url)
        ai_detection_result = detect_ai_generated_image(current_img)
        
        return jsonify({
            "ai_generated": ai_detection_result["is_ai_generated"],
            "confidence": ai_detection_result["confidence"],
            "methods_used": ai_detection_result["methods_used"],
            "details": ai_detection_result["details"]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/user_images/<user_id>", methods=["GET"])
def get_user_images(user_id):
    """Get all images for a specific user"""
    try:
        images = get_user_previous_images(user_id)
        
        formatted_images = []
        for img in images:
            formatted_images.append({
                "id": str(img["_id"]),
                "image_url": img["image_url"],
                "mission_id": img.get("mission_id"),
                "created_at": img["created_at"].isoformat(),
                "status": img.get("status", "active"),
                "ai_detection": img.get("ai_detection", {})
            })
        
        return jsonify({
            "user_id": user_id,
            "total_images": len(formatted_images),
            "images": formatted_images
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/delete_image/<image_id>", methods=["DELETE"])
def delete_user_image(image_id):
    """Soft delete an image"""
    try:
        result = user_images_collection.update_one(
            {"_id": ObjectId(image_id)},
            {"$set": {"status": "deleted", "deleted_at": datetime.utcnow()}}
        )
        
        if result.matched_count > 0:
            return jsonify({"message": "Image deleted successfully"})
        else:
            return jsonify({"error": "Image not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    try:
        db.command('ping')
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "clip_model": "loaded",
            "ai_detection": "enabled",
            "face_verification": "enabled",
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500

# ==================== BATCH PROCESSING ENDPOINTS ====================

@app.route("/batch_check", methods=["POST"])
def batch_check():
    """
    Process multiple images in a single request for efficiency
    Expects JSON with array of image objects
    """
    try:
        data = request.json
        images = data.get("images", [])
        user_id = data.get("user_id")
        
        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400
        
        if not images or len(images) == 0:
            return jsonify({"error": "No images provided"}), 400
        
        results = []
        
        for idx, img_data in enumerate(images):
            image_url = img_data.get("image_url")
            mission_id = img_data.get("mission_id", f"batch_{idx}")
            
            if not image_url:
                results.append({
                    "index": idx,
                    "status": "error",
                    "error": "Missing image_url"
                })
                continue
            
            try:
                current_img = load_image(image_url)
                
                # Quick AI check first
                ai_result = detect_ai_generated_image(current_img)
                if ai_result["is_ai_generated"] and ai_result["confidence"] > 0.7:
                    results.append({
                        "index": idx,
                        "image_url": image_url,
                        "status": "rejected",
                        "reason": "ai_generated",
                        "ai_confidence": ai_result["confidence"]
                    })
                    continue
                
                # Duplicate check
                current_phash = get_phash(current_img)
                current_embedding = get_clip_embedding(current_img)
                
                is_duplicate = False
                previous_images = get_user_previous_images(user_id)
                
                for prev_img_doc in previous_images:
                    if is_duplicate_phash(current_phash, prev_img_doc.get("phash", "")):
                        is_duplicate = True
                        break
                    
                    is_dup, _ = is_duplicate_clip(current_embedding, prev_img_doc.get("clip_embedding", []))
                    if is_dup:
                        is_duplicate = True
                        break
                
                if is_duplicate:
                    results.append({
                        "index": idx,
                        "image_url": image_url,
                        "status": "rejected",
                        "reason": "duplicate"
                    })
                    continue
                
                # Save if passed all checks
                saved_id = save_user_image(user_id, image_url, mission_id, current_phash, current_embedding, ai_result)
                results.append({
                    "index": idx,
                    "image_url": image_url,
                    "status": "approved",
                    "saved_id": saved_id,
                    "ai_confidence": ai_result["confidence"]
                })
                
            except Exception as img_error:
                results.append({
                    "index": idx,
                    "image_url": image_url,
                    "status": "error",
                    "error": str(img_error)
                })
        
        # Summary statistics
        approved = len([r for r in results if r["status"] == "approved"])
        rejected = len([r for r in results if r["status"] == "rejected"])
        errors = len([r for r in results if r["status"] == "error"])
        
        return jsonify({
            "summary": {
                "total": len(results),
                "approved": approved,
                "rejected": rejected,
                "errors": errors
            },
            "results": results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== UTILITY ENDPOINTS ====================

@app.route("/stats/<user_id>", methods=["GET"])
def get_user_stats(user_id):
    """Get statistics for a user's images"""
    try:
        pipeline = [
            {"$match": {"user_id": user_id, "status": "active"}},
            {"$group": {
                "_id": None,
                "total_images": {"$sum": 1},
                "ai_generated_count": {
                    "$sum": {
                        "$cond": [{"$eq": ["$ai_detection.is_ai_generated", True]}, 1, 0]
                    }
                },
                "avg_ai_confidence": {"$avg": "$ai_detection.confidence"},
                "missions": {"$addToSet": "$mission_id"}
            }}
        ]
        
        result = list(user_images_collection.aggregate(pipeline))
        
        if result:
            stats = result[0]
            stats.pop("_id", None)
            stats["unique_missions"] = len(stats.get("missions", []))
        else:
            stats = {
                "total_images": 0,
                "ai_generated_count": 0,
                "avg_ai_confidence": 0,
                "unique_missions": 0,
                "missions": []
            }
        
        return jsonify({
            "user_id": user_id,
            "stats": stats
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/cleanup", methods=["POST"])
def cleanup_old_images():
    """Clean up old images (admin endpoint)"""
    try:
        data = request.json
        days_old = data.get("days_old", 30)
        dry_run = data.get("dry_run", True)
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        query = {
            "created_at": {"$lt": cutoff_date},
            "status": "active"
        }
        
        if dry_run:
            count = user_images_collection.count_documents(query)
            return jsonify({
                "message": f"Dry run: Would delete {count} images older than {days_old} days",
                "cutoff_date": cutoff_date.isoformat()
            })
        else:
            result = user_images_collection.update_many(
                query,
                {
                    "$set": {
                        "status": "archived",
                        "archived_at": datetime.utcnow()
                    }
                }
            )
            
            return jsonify({
                "message": f"Archived {result.modified_count} images",
                "cutoff_date": cutoff_date.isoformat()
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("="*50)
    print("Starting Integrated Image Verification Service")
    print("="*50)
    print(f"Database: {db.name}")
    print(f"Collection: {user_images_collection.name}")
    print("Features enabled:")
    print("  ✓ CLIP-based duplicate detection")
    print("  ✓ AI generation detection")
    print("  ✓ Face verification (DeepFace)")
    print("  ✓ Batch processing")
    print("  ✓ User statistics")
    print("="*50)
    print("Available endpoints:")
    print("  POST /comprehensive_check - Complete verification pipeline")
    print("  POST /check_duplicate - Legacy duplicate detection")
    print("  POST /verify - Face verification only")
    print("  POST /analyze_ai_only - AI detection only")
    print("  POST /batch_check - Process multiple images")
    print("  GET  /user_images/<user_id> - Get user's images")
    print("  GET  /stats/<user_id> - Get user statistics")
    print("  GET  /health - Health check")
    print("="*50)
    
    app.run(debug=True, port=5000, host='0.0.0.0')