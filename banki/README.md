# BANKI — AI-Powered Banking Kiosk Demo

A fully functional local demo of an AI-powered bank account opening kiosk.

## Features

- **Voice conversation** powered by Gemini 2.0 Flash AI
- **ID document scanning** with OCR via Gemini Vision
- **Face matching** — compares selfie with ID photo
- **Liveness detection** — blink and head turn verification
- **Product recommendations** based on customer profile
- **Multi-language support** — English, Sinhala, Tamil
- **Admin panel** with application review queue
- **Flow editor** (n8n-style visual builder)
- **PDF reports** for KYC documentation

## Quick Start

### 1. Install dependencies

```bash
cd banki
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

Get your free Gemini API key from Google AI Studio.

### 3. Set up database

```bash
npx prisma db push
npm run db:seed
```

### 4. (Optional) Start the Python face service

```bash
cd face-service
pip install -r requirements.txt
python main.py
```

If the face service is not running, the kiosk will use a simulated face match result for demo purposes.

### 5. Start the app

```bash
npm run dev
```

### 6. Open in browser

- **Customer Kiosk:** http://localhost:3000/kiosk
- **Admin Panel:** http://localhost:3000/admin
- **Landing Page:** http://localhost:3000

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Database | SQLite via Prisma |
| Voice AI | Gemini 2.0 Flash (text + vision) |
| Face Matching | Python + face_recognition |
| Flow Editor | React Flow |
| Camera | react-webcam |

## Project Structure

```
banki/
├── src/
│   ├── app/
│   │   ├── kiosk/          # Customer-facing kiosk
│   │   ├── admin/          # Admin panel
│   │   └── api/            # API routes
│   ├── components/
│   │   ├── kiosk/          # Kiosk UI components
│   │   ├── admin/          # Admin UI components
│   │   └── shared/         # Reusable components
│   ├── lib/                # Utilities (Gemini, DB, PDF, NIC parser)
│   ├── stores/             # Zustand state stores
│   └── types/              # TypeScript types
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Demo data
└── face-service/           # Python face matching microservice
    ├── main.py
    └── requirements.txt
```

## Admin Panel

The admin panel at `/admin` includes:

- **Dashboard** — Application statistics overview
- **Applications** — Review, approve, or reject KYC applications
- **Products** — Add/edit banking products shown in the kiosk
- **Flow Editor** — Visual drag-and-drop flow builder
- **Settings** — Configure Gemini API key, bank name, thresholds

## Kiosk Flow

1. **Greeting** — Banki greets the customer
2. **Personal Info** — Natural conversation to collect details
3. **ID Scan** — Camera captures NIC/passport, Gemini extracts data
4. **Selfie** — Customer takes a selfie for face matching
5. **Liveness** — Blink and head turn detection
6. **Products** — AI-powered product recommendations
7. **Review** — Customer reviews and edits application
8. **Complete** — Application submitted, customer ID generated
