# EventMate Frontend (React + Tailwind)

This folder is a React + Tailwind UI that maps directly to the existing backend routes in `Backend/`.

## Setup

```bash
cd Frontend
npm install
npm run dev
```

The default dev server runs on `http://localhost:5173`.

## Shared Environment File

Frontend now reads environment variables from `../Backend/.env` (same file used by backend).

- Preferred: set `PORT` and `FRONTEND_URL` in `Backend/.env`.
- Optional override: add `VITE_API_URL` in `Backend/.env` if frontend should call a different backend URL.

## Backend CORS

Set the backend `FRONTEND_URL` to the same origin as the dev server, for example:

```
FRONTEND_URL=http://localhost:5173
```

## Notes

- Tokens are stored in `localStorage` and attached to protected requests as `Authorization: Bearer <token>`.
- Refresh token flow is supported via `/api/auth/refresh-token`.
- Password reset uses public backend routes: `/api/user/forgot-password` and `/api/user/reset-password`.
