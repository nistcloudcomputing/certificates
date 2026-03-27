# Certificates Portal

A production-style certificate verification and delivery platform built with Next.js, PostgreSQL, and AWS S3.

Users can securely verify identity details and download certificates, while admins can upload files, manage recipients, and monitor platform usage.

## Key Features

- Secure certificate verification by email and/or name.
- Short-lived JWT preview tokens and short-lived S3 pre-signed URLs.
- Certificate preview page with support for PDF and image certificates.
- Download flow with protected private S3 objects (no public bucket exposure).
- Generic credential failure responses to reduce user-enumeration risk.
- Request throttling on verification endpoint (IP-based rate limiting).
- Admin login with signed HTTP-only session cookie.
- Admin user management: search, edit, delete, and bulk delete.
- Certificate upload management: list, upload, delete individual files, delete all.
- CSV user import with optional automatic S3 key mapping.
- CSV user deletion workflow for cleanup operations.
- Analytics dashboard with totals, recent activity, and 14-day trend charts.
- Download and attempt logging for auditability and reporting.

<<<<<<< HEAD
=======
## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL (`postgres` client)
- AWS S3 + AWS SDK v3
- JWT (`jose`)
- Recharts (analytics visualizations)

## Project Routes

- `/` Public certificate verification page
- `/preview` Certificate preview and download page
- `/admin/login` Admin authentication
- `/admin` Admin dashboard summary
- `/admin/users` User management
- `/admin/upload` Certificate upload and CSV operations
- `/admin/analytics` Analytics and recent activity

## Environment Variables

Create `.env.local` and configure:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AWS_REGION`
- `AWS_BUCKET_NAME`

Optional UI variables:

- `NEXT_PUBLIC_EVENT_NAME`
- `NEXT_PUBLIC_BG_IMAGE_URL`
- `NEXT_PUBLIC_CLUB_LOGO_URL`

Note: AWS credentials should be supplied through your runtime environment (for example local AWS credentials, IAM role, or deployment secrets).

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## CSV Support

CSV import accepts headers:
>>>>>>> 61337c6 (chnaged the background tinit)

- `email`
- `name`
- `fileKey` or `keyid`

Sample CSV files are included in `public/` for reference.
