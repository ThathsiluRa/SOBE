# BANKI Face Matching Service

A Python microservice that compares faces from ID documents with selfies taken at the kiosk.

## Setup

```bash
# Install dependencies (requires cmake and dlib)
pip install -r requirements.txt

# On Ubuntu/Debian, you may need:
sudo apt-get install cmake libboost-python-dev

# Start the service
python main.py
```

The service runs on `http://localhost:8000`.

## API

### POST /match

Compare a face in an ID photo with a selfie.

**Request:**
```json
{
  "id_image": "<base64 encoded image>",
  "selfie": "<base64 encoded image>"
}
```

**Response:**
```json
{
  "match": true,
  "score": 0.87,
  "message": "Face comparison completed successfully"
}
```

## Demo Mode

If the face service is not running, the Next.js API route `/api/face-match` will automatically return a simulated result for demo purposes. This allows you to test the full kiosk flow without the Python service.
