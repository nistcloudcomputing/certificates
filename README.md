# Certificate Verification & Download System

This project is a Next.js (App Router) + TypeScript + Tailwind web app that verifies users by **email + name** and returns a short-lived, private S3 pre-signed URL for certificate download.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- AWS S3 (private bucket)
- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)

## Setup

1. Install dependencies:

	```bash
	npm install
	```

2. Create env file:

	```bash
	cp .env.example .env.local
	```

3. Set environment variables in `.env.local`:

	- `AWS_ACCESS_KEY_ID`
	- `AWS_SECRET_ACCESS_KEY`
	- `AWS_REGION`
	- `AWS_BUCKET_NAME`

4. Start development server:

	```bash
	npm run dev
	```

5. Open `http://localhost:3000`.

## Data Source

Users are currently loaded from `data/users.json`.

Example record:

```json
{
  "email": "abc@gmail.com",
  "name": "Satyam Singh",
  "fileKey": "certificates/uuid-1234.pdf"
}
```

## API Behavior (`POST /api/verify`)

- Normalizes email and name (`trim + lowercase`)
- Finds user by email
- Validates name (case-insensitive)
- On success, returns a pre-signed S3 URL valid for 60 seconds
- On mismatch, returns a generic error message
- Applies basic in-memory IP rate limiting

## Security Notes

- S3 bucket should remain private (no public file access)
- Certificate files are accessed only via pre-signed URLs
- API does not reveal whether email exists when credentials are invalid

# certificates
# certificates
