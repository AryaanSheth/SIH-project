# Rizz-istential Crisis

Ambient listening chaos app for SIH.

## Quick Start

1. Copy env file:

```bash
cp .env.example .env
```

2. Fill Firebase + Gemini vars in `.env`.
3. Install dependencies and run:

```bash
npm install
npm run dev
```

Main app: `http://localhost:5173/`
Live feed: `http://localhost:5173/feed`

## GCS Transcript Export

The frontend posts a session payload to `VITE_GCS_EXPORT_ENDPOINT` when STOP is clicked.
Set `VITE_GCS_EXPORT_TOKEN` and configure the Cloud Function token to match.

## Firebase Rules (hackathon-only)

```json
{
  "rules": {
    "detections": { ".read": true, ".write": true },
    "sessions": { ".read": true, ".write": true }
  }
}
```
