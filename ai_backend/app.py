from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import requests
import imagehash
import io, os
from pymongo import MongoClient
from datetime import datetime, timedelta
import numpy as np
from bson import ObjectId
import cv2
from deepface import DeepFace
import uuid
import warnings
from dotenv import load_dotenv
from functools import lru_cache
import threading
from concurrent.futures import ThreadPoolExecutor
import asyncio
import time

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
user_images_collection.create_index([("user_id", 1), ("created_at", -1)])

# Global models - load once
print("Loading models...")
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Pre-compute CLIP text embeddings for AI detection (one-time cost)
AI_PROMPTS = [
    "artificial intelligence generated image", "computer generated artwork",
    "digital art created by AI", "synthetic image", "AI rendered picture"
]
REAL_PROMPTS = [
    "real photograph", "natural photography", "authentic image",
    "camera captured photo", "genuine photograph"
]

print("Pre-computing CLIP text embeddings...")
all_prompts = AI_PROMPTS + REAL_PROMPTS
text_inputs = clip_processor(text=all_prompts, return_tensors="pt", padding=True)
with torch.no_grad():
    PRECOMPUTED_TEXT_EMBEDDINGS = clip_model.get_text_features(**text_inputs)
    PRECOMPUTED_TEXT_EMBEDDINGS = PRECOMPUTED_TEXT_EMBEDDINGS / PRECOMPUTED_TEXT_EMBEDDINGS.norm(p=2, dim=-1, keepdim=True)

print("Models loaded successfully!")

# Thread pool for concurrent processing
executor = ThreadPoolExecutor(max_workers=4)

# ==================== OPTIMIZED UTILITY FUNCTIONS ====================

def load_image_fast(source):
    """Optimized image loading with caching"""
    try:
        if hasattr(source, 'save'):  # FileStorage
            return Image.open(source).convert("RGB")
        elif isinstance(source, str):
            if source.startswith(("http://", "https://")):
                response = requests.get(source, timeout=10, stream=True)
                response.raise_for_status()
                return Image.open(io.BytesIO(response.content)).convert("RGB")
            else:
                return Image.open(source).convert("RGB")
        else:
            raise ValueError("Invalid image source")
    except Exception as e:
        print(f"Error loading image: {str(e)}")
        raise

@lru_cache(maxsize=128)
def get_clip_embedding_cached(image_hash):
    """Cached CLIP embedding computation"""
    # This is a placeholder - in practice, you'd need to implement proper caching
    pass

def get_clip_embedding_fast(pil_image):
    """Optimized CLIP embedding"""
    try:
        inputs = clip_processor(images=pil_image, return_tensors="pt")
        with torch.no_grad():
            embedding = clip_model.get_image_features(**inputs)
        return embedding / embedding.norm(p=2)
    except Exception as e:
        print(f"Error getting CLIP embedding: {str(e)}")
        raise

def get_image_features_batch(images):
    """Process multiple images in batch for efficiency"""
    try:
        inputs = clip_processor(images=images, return_tensors="pt")
        with torch.no_grad():
            embeddings = clip_model.get_image_features(**inputs)
        return embeddings / embeddings.norm(p=2, dim=-1, keepdim=True)
    except Exception as e:
        print(f"Error in batch processing: {str(e)}")
        raise

# ==================== OPTIMIZED AI DETECTION ====================

def analyze_statistical_properties_fast(img_array):
    """Optimized statistical analysis"""
    try:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY) if len(img_array.shape) == 3 else img_array
        
        # Vectorized operations
        mean_val = np.mean(gray)
        std_val = np.std(gray)
        
        if std_val == 0:
            return {"ai_probability": 0.5, "mean": float(mean_val), "std": 0.0}
        
        normalized = (gray - mean_val) / std_val
        skewness = np.mean(normalized ** 3)
        kurtosis = np.mean(normalized ** 4) - 3
        
        # Quick scoring
        ai_score = 0
        if std_val < 30: ai_score += 0.3
        if abs(skewness) > 2: ai_score += 0.3
        if abs(kurtosis) > 5: ai_score += 0.4
        
        return {
            "ai_probability": min(ai_score, 1.0),
            "mean": float(mean_val),
            "std": float(std_val),
            "skewness": float(skewness),
            "kurtosis": float(kurtosis)
        }
    except Exception as e:
        return {"ai_probability": 0.0, "error": str(e)}

def analyze_frequency_domain_fast(img_array):
    """Optimized frequency analysis"""
    try:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY) if len(img_array.shape) == 3 else img_array
        
        # Resize for faster FFT
        if gray.shape[0] > 512 or gray.shape[1] > 512:
            gray = cv2.resize(gray, (512, 512))
        
        fft = np.fft.fft2(gray)
        magnitude = np.abs(np.fft.fftshift(fft))
        
        center_y, center_x = np.array(magnitude.shape) // 2
        high_freq_region = magnitude[center_y-20:center_y+20, center_x-20:center_x+20]
        
        high_freq_power = np.sum(high_freq_region)
        total_power = np.sum(magnitude)
        ratio = high_freq_power / total_power if total_power > 0 else 0
        
        ai_probability = 0.7 if ratio < 0.1 else (0.6 if ratio > 0.8 else 0.0)
        
        return {
            "ai_probability": ai_probability,
            "high_freq_ratio": float(ratio)
        }
    except Exception as e:
        return {"ai_probability": 0.0, "error": str(e)}

def clip_based_ai_detection_fast(pil_image):
    """Optimized CLIP-based AI detection using pre-computed embeddings"""
    try:
        # Get image embedding
        image_inputs = clip_processor(images=pil_image, return_tensors="pt")
        with torch.no_grad():
            image_features = clip_model.get_image_features(**image_inputs)
            image_features = image_features / image_features.norm(p=2)
        
        # Use pre-computed text embeddings
        similarities = torch.nn.functional.cosine_similarity(
            image_features.unsqueeze(1), PRECOMPUTED_TEXT_EMBEDDINGS.unsqueeze(0), dim=2
        ).squeeze()
        
        ai_scores = similarities[:len(AI_PROMPTS)]
        real_scores = similarities[len(AI_PROMPTS):]
        
        avg_ai_score = torch.mean(ai_scores).item()
        avg_real_score = torch.mean(real_scores).item()
        
        total_score = avg_ai_score + avg_real_score
        ai_probability = avg_ai_score / total_score if total_score > 0 else 0.5
        
        return {
            "ai_probability": float(ai_probability),
            "avg_ai_score": float(avg_ai_score),
            "avg_real_score": float(avg_real_score)
        }
    except Exception as e:
        return {"ai_probability": 0.0, "error": str(e)}

def detect_ai_generated_fast(pil_image):
    """Optimized AI detection with parallel processing"""
    try:
        img_array = np.array(pil_image)
        
        # Run analyses in parallel
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_stats = executor.submit(analyze_statistical_properties_fast, img_array)
            future_freq = executor.submit(analyze_frequency_domain_fast, img_array)
            future_clip = executor.submit(clip_based_ai_detection_fast, pil_image)
            
            stats_result = future_stats.result()
            freq_result = future_freq.result()
            clip_result = future_clip.result()
        
        # Weighted combination
        combined_score = (
            stats_result["ai_probability"] * 0.25 +
            freq_result["ai_probability"] * 0.35 +
            clip_result["ai_probability"] * 0.40
        )
        
        return {
            "is_ai_generated": combined_score > 0.6,
            "confidence": combined_score,
            "methods_used": ["statistical", "frequency", "clip"],
            "details": {
                "statistical": stats_result,
                "frequency": freq_result,
                "clip": clip_result
            }
        }
    except Exception as e:
        return {
            "is_ai_generated": False,
            "confidence": 0.0,
            "error": str(e)
        }

# ==================== OPTIMIZED DUPLICATE DETECTION ====================

def is_duplicate_fast(hash1, hash2, embedding1, embedding2, phash_threshold=5, clip_threshold=0.93):
    """Combined duplicate detection"""
    try:
        # Quick pHash check first
        if hash1 and hash2:
            h1 = imagehash.hex_to_hash(hash1)
            h2 = imagehash.hex_to_hash(hash2)
            if abs(h1 - h2) <= phash_threshold:
                return True, "phash", abs(h1 - h2)
        
        # CLIP similarity check
        if embedding1 is not None and embedding2 is not None:
            if isinstance(embedding1, list):
                embedding1 = torch.tensor(embedding1)
            if isinstance(embedding2, list):
                embedding2 = torch.tensor(embedding2)
            
            sim = torch.nn.functional.cosine_similarity(
                embedding1.unsqueeze(0), embedding2.unsqueeze(0)
            ).item()
            
            if sim > clip_threshold:
                return True, "clip", sim
        
        return False, None, 0.0
    except Exception as e:
        print(f"Duplicate detection error: {str(e)}")
        return False, None, 0.0

# ==================== OPTIMIZED DATABASE OPERATIONS ====================

def save_user_image_fast(user_id, image_url, mission_id, phash, clip_embedding, ai_result=None):
    """Optimized database save"""
    try:
        doc = {
            "user_id": user_id,
            "image_url": image_url,
            "mission_id": mission_id,
            "phash": phash,
            "clip_embedding": clip_embedding.squeeze().tolist() if hasattr(clip_embedding, 'squeeze') else clip_embedding,
            "ai_detection": ai_result,
            "created_at": datetime.utcnow(),
            "status": "active"
        }
        
        result = user_images_collection.insert_one(doc)
        return str(result.inserted_id)
    except Exception as e:
        print(f"Database save error: {str(e)}")
        raise

def get_user_images_fast(user_id, limit=100):
    """Optimized user image retrieval"""
    try:
        cursor = user_images_collection.find(
            {"user_id": user_id, "status": "active"},
            {"phash": 1, "clip_embedding": 1, "image_url": 1, "created_at": 1}
        ).sort("created_at", -1).limit(limit)
        return list(cursor)
    except Exception as e:
        print(f"Database query error: {str(e)}")
        return []

# ==================== OPTIMIZED FACE VERIFICATION ====================

def verify_faces_fast(img1_path, img2_path):
    """Optimized face verification"""
    try:
        result = DeepFace.verify(
            img1_path=img1_path,
            img2_path=img2_path,
            model_name="VGG-Face",
            detector_backend="opencv",  # Faster than mtcnn
            enforce_detection=False  # Don't fail if face not detected
        )
        return {
            "verified": result.get("verified", False),
            "distance": result.get("distance"),
            "threshold": result.get("threshold")
        }
    except Exception as e:
        return {"verified": False, "error": str(e)}

# ==================== MAIN API ENDPOINTS ====================

@app.route("/comprehensive_check", methods=["POST"])
def comprehensive_check():
    """Optimized comprehensive verification"""
    start_time = time.time()
    
    try:
        # Parse input
        if request.content_type and 'application/json' in request.content_type:
            data = request.json
            image_url = data.get("image_url")
            profile_image_url = data.get("profile_image_url")
            user_id = data.get("user_id")
            mission_id = data.get("mission_id", "unknown")
            
            if not image_url or not user_id:
                return jsonify({"error": "Missing image_url or user_id"}), 400
            
            current_img = load_image_fast(image_url)
            profile_img = load_image_fast(profile_image_url) if profile_image_url else None
        else:
            image_file = request.files.get("image")
            profile_file = request.files.get("profile_image")
            user_id = request.form.get("user_id")
            mission_id = request.form.get("mission_id", "unknown")
            
            if not image_file or not user_id:
                return jsonify({"error": "Missing image file or user_id"}), 400
            
            current_img = load_image_fast(image_file)
            profile_img = load_image_fast(profile_file) if profile_file else None

        print(f"Processing for user: {user_id}")

        # Parallel processing of image features
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_ai = executor.submit(detect_ai_generated_fast, current_img)
            future_phash = executor.submit(lambda: str(imagehash.phash(current_img)))
            future_clip = executor.submit(get_clip_embedding_fast, current_img)
            
            ai_result = future_ai.result()
            current_phash = future_phash.result()
            current_embedding = future_clip.result()

        # Early AI rejection
        if ai_result["is_ai_generated"] and ai_result["confidence"] > 0.7:
            return jsonify({
                "status": "rejected",
                "reason": "ai_generated",
                "ai_generated": True,
                "ai_confidence": ai_result["confidence"],
                "processing_time": time.time() - start_time
            })

        # Optimized duplicate check
        previous_images = get_user_images_fast(user_id)
        
        for prev_img in previous_images:
            is_dup, method, score = is_duplicate_fast(
                current_phash, prev_img.get("phash"),
                current_embedding, prev_img.get("clip_embedding")
            )
            
            if is_dup:
                return jsonify({
                    "status": "rejected",
                    "reason": "duplicate",
                    "duplicate": True,
                    "method": method,
                    "score": score,
                    "matched_image": prev_img.get("image_url"),
                    "processing_time": time.time() - start_time
                })

        # Face verification (if needed)
        face_result = None
        if profile_img:
            temp_files = []
            try:
                temp1 = f"temp_current_{uuid.uuid4().hex}.jpg"
                temp2 = f"temp_profile_{uuid.uuid4().hex}.jpg"
                temp_files = [temp1, temp2]
                
                current_img.save(temp1)
                profile_img.save(temp2)
                
                face_result = verify_faces_fast(temp1, temp2)
                
                if not face_result.get("verified", False):
                    return jsonify({
                        "status": "rejected",
                        "reason": "face_mismatch",
                        "face_verified": False,
                        "processing_time": time.time() - start_time
                    })
                        
            finally:
                for temp_file in temp_files:
                    if os.path.exists(temp_file):
                        try:
                            os.remove(temp_file)
                        except:
                            pass

        # Save approved image
        try:
            image_url_to_save = image_url if 'image_url' in locals() else f"uploaded_{uuid.uuid4().hex}"
            saved_id = save_user_image_fast(user_id, image_url_to_save, mission_id, current_phash, current_embedding, ai_result)
            
            return jsonify({
                "status": "approved",
                "message": "All checks passed",
                "saved_id": saved_id,
                "ai_generated": ai_result["is_ai_generated"],
                "ai_confidence": ai_result["confidence"],
                "duplicate": False,
                "face_verified": face_result.get("verified") if face_result else None,
                "processing_time": time.time() - start_time
            })
            
        except Exception as save_error:
            return jsonify({
                "status": "approved",
                "message": "Checks passed but save failed",
                "error": str(save_error),
                "processing_time": time.time() - start_time
            })

    except Exception as e:
        print(f"Comprehensive check error: {str(e)}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "processing_time": time.time() - start_time
        }), 500

@app.route("/batch_check", methods=["POST"])
def batch_check_optimized():
    """Optimized batch processing"""
    try:
        data = request.json
        images = data.get("images", [])
        user_id = data.get("user_id")
        
        if not user_id or not images:
            return jsonify({"error": "Missing user_id or images"}), 400
        
        # Load all images first
        loaded_images = []
        for idx, img_data in enumerate(images):
            try:
                img = load_image_fast(img_data.get("image_url"))
                loaded_images.append((idx, img, img_data))
            except Exception as e:
                loaded_images.append((idx, None, img_data, str(e)))
        
        # Batch process image features
        valid_images = [(idx, img, data) for idx, img, data in loaded_images if img is not None]
        
        if valid_images:
            # Batch CLIP processing
            batch_images = [img for _, img, _ in valid_images]
            batch_embeddings = get_image_features_batch(batch_images)
            
            # Process each image
            results = []
            previous_images = get_user_images_fast(user_id)
            
            for i, (idx, img, img_data) in enumerate(valid_images):
                try:
                    # AI detection
                    ai_result = detect_ai_generated_fast(img)
                    if ai_result["is_ai_generated"] and ai_result["confidence"] > 0.7:
                        results.append({
                            "index": idx,
                            "status": "rejected",
                            "reason": "ai_generated"
                        })
                        continue
                    
                    # Duplicate check
                    current_phash = str(imagehash.phash(img))
                    current_embedding = batch_embeddings[i]
                    
                    is_duplicate = False
                    for prev_img in previous_images:
                        is_dup, _, _ = is_duplicate_fast(
                            current_phash, prev_img.get("phash"),
                            current_embedding, prev_img.get("clip_embedding")
                        )
                        if is_dup:
                            is_duplicate = True
                            break
                    
                    if is_duplicate:
                        results.append({
                            "index": idx,
                            "status": "rejected",
                            "reason": "duplicate"
                        })
                        continue
                    
                    # Save approved image
                    saved_id = save_user_image_fast(
                        user_id, img_data.get("image_url"),
                        img_data.get("mission_id", f"batch_{idx}"),
                        current_phash, current_embedding, ai_result
                    )
                    
                    results.append({
                        "index": idx,
                        "status": "approved",
                        "saved_id": saved_id
                    })
                    
                except Exception as e:
                    results.append({
                        "index": idx,
                        "status": "error",
                        "error": str(e)
                    })
        
        # Handle failed image loads
        for idx, img, data, error in [item for item in loaded_images if len(item) == 4]:
            results.append({
                "index": idx,
                "status": "error",
                "error": error
            })
        
        # Summary
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

# ==================== SIMPLIFIED UTILITY ENDPOINTS ====================
def to_native(obj):
    """Recursively convert numpy types to native Python types."""
    if isinstance(obj, dict):
        return {k: to_native(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_native(v) for v in obj]
    elif isinstance(obj, (np.generic, np.bool_)):
        return obj.item()
    else:
        return obj

@app.route("/verify", methods=["POST"])
def verify_faces():
    """Optimized face verification endpoint"""
    file1 = request.files.get("image1")
    file2 = request.files.get("image2")

    if not file1 or not file2:
        return jsonify({"error": "Missing image files"}), 400

    temp_files = []
    try:
        temp1 = f"temp1_{uuid.uuid4().hex}.jpg"
        temp2 = f"temp2_{uuid.uuid4().hex}.jpg"
        temp_files = [temp1, temp2]
        
        file1.save(temp1)
        file2.save(temp2)
        
        result = verify_faces_fast(temp1, temp2)
        result_native = to_native(result)  # <-- Convert all numpy types
        return jsonify(result_native)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        for temp_file in temp_files:
            if os.path.exists(temp_file):
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
        
        current_img = load_image_fast(image_url)
        ai_result = detect_ai_generated_fast(current_img)
        
        return jsonify(ai_result)
        
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
            "models": "loaded",
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

# ==================== LEGACY ENDPOINTS (simplified) ====================

@app.route("/check_duplicate", methods=["POST"])
def check_duplicate():
    """Legacy duplicate check endpoint"""
    try:
        data = request.json
        image_url = data.get("image_url")
        user_id = data.get("user_id")
        
        if not image_url or not user_id:
            return jsonify({"error": "Missing image_url or user_id"}), 400

        current_img = load_image_fast(image_url)
        
        # Quick checks
        ai_result = detect_ai_generated_fast(current_img)
        if ai_result["is_ai_generated"] and ai_result["confidence"] > 0.7:
            return jsonify({
                "duplicate": False,
                "ai_generated": True,
                "rejected": True
            })

        current_phash = str(imagehash.phash(current_img))
        current_embedding = get_clip_embedding_fast(current_img)
        
        # Check duplicates
        previous_images = get_user_images_fast(user_id)
        for prev_img in previous_images:
            is_dup, method, score = is_duplicate_fast(
                current_phash, prev_img.get("phash"),
                current_embedding, prev_img.get("clip_embedding")
            )
            if is_dup:
                return jsonify({
                    "duplicate": True,
                    "method": method,
                    "score": score
                })

        # Save and return
        saved_id = save_user_image_fast(user_id, image_url, "legacy", current_phash, current_embedding, ai_result)
        return jsonify({
            "duplicate": False,
            "saved_id": saved_id,
            "ai_generated": ai_result["is_ai_generated"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("="*50)
    print("OPTIMIZED Image Verification Service")
    print("="*50)
    print("✓ Parallel processing enabled")
    print("✓ Pre-computed CLIP text embeddings")
    print("✓ Optimized AI detection pipeline")
    print("✓ Fast duplicate detection")
    print("✓ Batch processing support")
    print("✓ Efficient database operations")
    print("="*50)
    
    app.run(debug=False, port=5000, host='0.0.0.0', threaded=True)