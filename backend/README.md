# Nimbus Lending — Backend

Node.js + Express API for the loan management app, backed by Aiven MySQL.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the env file and fill in your Aiven credentials:
   ```
   cp .env.example .env
   ```
   Get `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` from your Aiven MySQL
   service overview page. Also copy the CA certificate shown there into `DB_SSL_CA`
   (keep it as one line with `\n` for line breaks), or download it and point
   `DB_SSL_CA_PATH` at the file.

3. Apply the schema:
   ```
   mysql --host=$DB_HOST --port=$DB_PORT --user=$DB_USER -p --ssl-mode=REQUIRED $DB_NAME < schema.sql
   ```

4. Seed demo data (6 sample applicants with documents & eligibility):
   ```
   npm run seed
   ```
   This creates a login: `admin@nimbuslending.com` / `password123`.

5. Start the API:
   ```
   npm run dev
   ```
   Runs on `http://localhost:5000` by default.

## API overview

| Method | Route                                   | Purpose                                  |
|--------|------------------------------------------|-------------------------------------------|
| POST   | /api/auth/login                         | Login, returns JWT                       |
| POST   | /api/auth/signup                        | Create account, returns JWT              |
| GET    | /api/dashboard/summary                  | KPIs, trend, recent apps, notifications  |
| GET    | /api/applications                       | List (supports ?search=&status=)         |
| POST   | /api/applications                       | Create new application                   |
| GET    | /api/applications/:id                   | Applicant + loan + documents + decision  |
| POST   | /api/applications/:id/decision          | approve / reject / request_document      |
| GET    | /api/documents/:applicationId           | Document + OCR status                    |
| POST   | /api/documents/:applicationId/upload    | Upload/simulate a document                |
| POST   | /api/documents/:applicationId/:docId/verify | Mark a document verified              |
| GET    | /api/eligibility/:applicationId         | Latest eligibility record                 |
| POST   | /api/eligibility/:applicationId/evaluate| Run/recompute eligibility score          |
| GET    | /api/reports                            | Recent generated reports                  |
| GET    | /api/reports/download/pdf               | Download PDF summary                      |
| GET    | /api/reports/download/excel             | Download Excel export                     |

All routes except `/api/auth/*` require `Authorization: Bearer <token>`.
The report download routes also accept `?token=<token>` since browser downloads
triggered by a plain link/`window.open` can't set a custom header.
