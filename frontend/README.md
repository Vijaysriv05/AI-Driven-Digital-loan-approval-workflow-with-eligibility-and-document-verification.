# Nimbus Lending — Frontend

React + Vite dashboard for the loan management app, matching the backend API
in `loanapp-backend`.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the env file (only needed if your API isn't on `http://localhost:5000`):
   ```
   cp .env.example .env
   ```

3. Start the dev server:
   ```
   npm run dev
   ```
   Opens on `http://localhost:5173`. Make sure the backend is running on
   `http://localhost:5000` (or update `VITE_API_URL`).

4. Log in with the seeded account:
   - Email: `admin@nimbuslending.com`
   - Password: `password123`

## Pages

- **Login / Signup** — split-screen auth with a banking illustration
- **Dashboard** — 4 KPI cards, one approval trend chart, recent applications table, recent notifications
- **Applications** — searchable/filterable table, links to New Application and Applicant Details
- **Applicant Details** — 4 cards (Applicant, Loan, Documents, Decision) with Approve / Reject / Request Document actions
- **Document Verification** — upload simulation, OCR extracted data, verification status per document
- **Eligibility** — circular eligibility score, key metrics, AI recommendation with 3 reasons
- **Reports** — download PDF/Excel, recent reports table
- **Settings** — Profile, Password, Notifications, Theme

## Design tokens

White background, primary blue `#2563EB`, gray cards, 12px radius, Inter font,
soft shadows with light glassmorphism on the navbar, max content width 1280px.
