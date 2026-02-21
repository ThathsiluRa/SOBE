"""
BANKI Face Matching Microservice

A simple FastAPI service that compares two face images:
1. The ID document photo
2. The selfie taken at the kiosk

Uses the face_recognition library for comparison.

Run with:
    pip install -r requirements.txt
    python main.py
"""

import base64
import io
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BANKI Face Matching Service", version="1.0.0")

# Allow all origins for local demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FaceMatchRequest(BaseModel):
    id_image: str  # Base64 encoded image of the ID document
    selfie: str    # Base64 encoded selfie image


class FaceMatchResponse(BaseModel):
    match: bool
    score: float
    message: str
    error: Optional[str] = None


def decode_image(base64_str: str):
    """Decode a base64 image string to numpy array."""
    try:
        import numpy as np
        from PIL import Image

        # Remove data URL prefix if present
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]

        image_data = base64.b64decode(base64_str)
        image = Image.open(io.BytesIO(image_data))
        return np.array(image.convert("RGB"))
    except Exception as e:
        raise ValueError(f"Failed to decode image: {e}")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "BANKI Face Matching"}


@app.post("/match", response_model=FaceMatchResponse)
async def match_faces(request: FaceMatchRequest):
    """
    Compare the face in an ID document photo with a selfie.
    Returns a similarity score and match result.
    """
    try:
        import face_recognition

        logger.info("Processing face match request...")

        # Decode both images
        try:
            id_image_array = decode_image(request.id_image)
            selfie_array = decode_image(request.selfie)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Find face encodings in both images
        id_face_encodings = face_recognition.face_encodings(id_image_array)
        selfie_face_encodings = face_recognition.face_encodings(selfie_array)

        if not id_face_encodings:
            return FaceMatchResponse(
                match=False,
                score=0.0,
                message="No face detected in ID document image",
                error="no_face_in_id",
            )

        if not selfie_face_encodings:
            return FaceMatchResponse(
                match=False,
                score=0.0,
                message="No face detected in selfie",
                error="no_face_in_selfie",
            )

        # Compare faces
        id_encoding = id_face_encodings[0]
        selfie_encoding = selfie_face_encodings[0]

        # Calculate distance (lower = more similar)
        import numpy as np
        distance = face_recognition.face_distance([id_encoding], selfie_encoding)[0]

        # Convert distance to similarity score (0.0 to 1.0)
        # distance of 0.0 = identical, 0.6+ = likely different person
        similarity_score = float(max(0.0, 1.0 - distance))

        # Threshold: 0.6 distance = ~0.4 similarity, but face_recognition recommends 0.6 threshold
        # We use a more conservative similarity score threshold
        match_threshold = 0.45  # corresponds to ~0.55 distance
        is_match = distance <= 0.6 and similarity_score >= match_threshold

        logger.info(f"Face match result: distance={distance:.3f}, score={similarity_score:.3f}, match={is_match}")

        return FaceMatchResponse(
            match=is_match,
            score=round(similarity_score, 4),
            message="Face comparison completed successfully",
        )

    except ImportError:
        logger.error("face_recognition library not installed")
        raise HTTPException(
            status_code=503,
            detail="face_recognition library not installed. Run: pip install face-recognition",
        )
    except Exception as e:
        logger.error(f"Face matching error: {e}")
        raise HTTPException(status_code=500, detail=f"Face matching failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting BANKI Face Matching Service on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
