from flask import Flask, jsonify, request

from storage import MinioClient
from templates import facebook, instagram, linkedin, whatsapp

app = Flask(__name__)

_RENDERERS = {
    "linkedin": linkedin.render,
    "instagram": instagram.render,
    "facebook": facebook.render,
    "whatsapp": whatsapp.render,
}

_REQUIRED_FIELDS = ("text", "author", "title", "platform")


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/generate")
def generate():
    body = request.get_json(silent=True) or {}

    for field in _REQUIRED_FIELDS:
        if not body.get(field):
            return jsonify({"error": f"missing required field: {field}"}), 400

    platform = body["platform"].lower()
    renderer = _RENDERERS.get(platform)
    if renderer is None:
        return jsonify({"error": "unsupported platform"}), 400

    fragment = {
        "text": body["text"],
        "author": body["author"],
        "title": body["title"],
    }

    try:
        png_bytes = renderer(fragment)
        client = MinioClient()
        url = client.upload(png_bytes)
    except Exception:
        return jsonify({"error": "image generation failed"}), 500

    return jsonify({"url": url}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
