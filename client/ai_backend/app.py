from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import requests
import imagehash
import io, os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

previous_images = [
    os.path.join(BASE_DIR, "test", "ChatGPT-Image-Jun-3-2025-014543-PM.webp"),
    os.path.join(BASE_DIR, "test", "images.jpg"),
    os.path.join(BASE_DIR, "test", "plastic-pollution-044851731-16x9_0.webp"),
    os.path.join(BASE_DIR, "test", "abc.jpg"),
]

# Utility: Load PIL image from URL or local path
def load_image(source):
    if source.startswith("http://") or source.startswith("https://"):
        image_data = requests.get(source).content
        return Image.open(io.BytesIO(image_data)).convert("RGB")
    else:
        return Image.open(source).convert("RGB")

# Utility: Get CLIP embedding from PIL image
def get_clip_embedding(pil_image):
    inputs = processor(images=pil_image, return_tensors="pt")
    with torch.no_grad():
        embedding = model.get_image_features(**inputs)
    return embedding / embedding.norm(p=2)

#Normalization ensures that all embeddings lie on the unit hypersphere (length = 1).
#This is important because cosine similarity works best with unit vectors.

def is_duplicate_phash(img1, img2, threshold=5):
    hash1 = imagehash.phash(img1)
    hash2 = imagehash.phash(img2)
    diff = abs(hash1 - hash2)
    print(f"[pHash] Hamming Distance: {diff}")
    return diff <= threshold

@app.route("/check_duplicate", methods=["POST"])
def check_duplicate():
    data = request.json
    image_url = data.get("image_url")
    if not image_url:
        return jsonify({"error": "Missing image_url"}), 400

    try:
        current_img = load_image(image_url)
        current_emb = get_clip_embedding(current_img)

        for prev_path in previous_images:
            prev_img = load_image(prev_path)

            # pHash check
            if is_duplicate_phash(current_img, prev_img):
                return jsonify({"duplicate": True, "method": "phash", "similarity": 1.0})

            # CLIP check
            prev_emb = get_clip_embedding(prev_img)
            sim = torch.nn.functional.cosine_similarity(current_emb, prev_emb).item()
            print(f"[CLIP] Similarity with {prev_path}: {sim:.4f}")

            if sim > 0.93:
                return jsonify({"duplicate": True, "method": "clip", "similarity": sim})

        return jsonify({"duplicate": False, "similarity": sim})

    except Exception as e:
        print("[ERROR]", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
