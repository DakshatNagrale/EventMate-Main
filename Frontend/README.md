# EventMate Frontend (React + Tailwind)

This folder is a React + Tailwind UI that maps directly to the existing backend routes in `Backend/`.

## Setup

```bash
cd Frontend
npm install
npm run dev
```

The default dev server runs on `http://localhost:5173`.

## Backend CORS

Set the backend `FRONTEND_URL` to the same origin as the dev server, for example:

```
FRONTEND_URL=http://localhost:5173
```

## Notes

- Tokens are stored in `localStorage` and attached to protected requests as `Authorization: Bearer <token>`.
- Refresh token flow is supported via `/api/auth/refresh-token`.
- The backend password reset handlers currently require authentication; the UI honors that behavior.

## Current Structure

```text
Frontend/
  src/
    assets/
      logo.png
    common/
      SummaryApi.js
    components/
      Footer.jsx
      Header.jsx
      Search.jsx
      ...
    hooks/
      useMobile.jsx
    pages/
      Home.jsx
      Login.jsx
      Register.jsx
      SearchPage.jsx
      ...
    routes/
      index.jsx
    utils/
      Axios.js
      AxiosToastError.js
      auth.js
      logout.js
    App.jsx
    index.css
  main.jsx
  package.json
  package-lock.json
  vite.config.js
```
