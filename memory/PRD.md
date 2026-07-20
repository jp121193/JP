# JP - Logistics & Ceramics Directory

## Original Problem Statement
Build a production-ready, highly responsive web app "JP" — a specialized directory for logistics + ceramic business ops. Data access restricted to approved users only. Two directory tabs (Morvi Ceramics + Mundra/Kandla container yards) with search + Google Maps links. Admin CRUD. React + Tailwind, corporate deep-blue/slate palette, mobile-first.

## User Choices (locked in)
- **Auth**: Mobile number + password (custom JWT). No SMS OTP.
- **Payment**: NONE. Collected offline by owner.
- **Access grant**: Admin manually approves users from admin panel.
- **Admin management**: Simple admin-only UI for CRUD and user approval.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB). JWT via PyJWT + bcrypt. Bearer-token auth. All routes under `/api`.
- **Frontend**: React 19, Tailwind, Phosphor icons, sonner toasts. Manrope headings, IBM Plex Sans body.
- **Data**: MongoDB collections — `users`, `ceramics`, `yards`. UUID string IDs.
- **Seed on startup**: 1 admin user (env-driven), 5 Morvi ceramics, 3 Mundra + 3 Kandla yards.

## Users / Personas
1. **Admin (JP owner)** — mobile 9999999999 / admin@JP2026. Approves users, manages directory.
2. **Field user (logistics operator)** — mobile signup → pending → approved by admin → uses directory on phone.

## Phase 1 (SHIPPED · 2026-07-20)
- Mobile+password JWT auth (`/api/auth/register`, `/login`, `/me`)
- Admin-gated approval flow (`pending` → `approved`)
- Directory dashboard (2 tabs, sticky search, Google Maps links open in new tab)
- Admin console: user approval/revoke/delete + full CRUD for ceramics & yards
- Seeded placeholder data
- Mobile-first responsive UI, corporate deep-blue/slate palette

## Phase 2 Backlog (P0/P1/P2)
- **P0**: Multi-admin support (invite more admins from admin panel)
- **P1**: SMS OTP verification on signup (Twilio) so mobile numbers are real
- **P1**: Bulk CSV import for ceramics & yards
- **P1**: WhatsApp deep-link on each row for quick contact
- **P2**: Analytics — most-viewed listings, active users per week
- **P2**: Email/WhatsApp notification to admin when a new user signs up
- **P2**: Public read-only preview page (a couple of sample listings) to entice signup
- **P2**: Password reset via SMS OTP

## Test Credentials
See `/app/memory/test_credentials.md`.
