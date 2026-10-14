# Employee & Task Management — Frontend

React + Vite + Tailwind + React Router.

## Setup

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173 (proxies /api to http://localhost:5000)
```

Start the backend first (see the backend README). Set `VITE_API_URL` in `.env` to the deployed backend URL for production builds, for example `https://your-api.onrender.com/api`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build in `dist/`
- `npm run preview` — serve the production build locally

## Routes

| Path | Screen |
| --- | --- |
| `/dashboard` | Stats and employee workload |
| `/employees`, `/employees/new`, `/employees/:id`, `/employees/:id/edit` | Employee list, add, view, edit |
| `/tasks`, `/tasks/new`, `/tasks/:id`, `/tasks/:id/edit` | Task list, add, view, edit |

Task list URLs carry all state, for example `/tasks?status=In%20Progress&priority=High&page=2&sort=dueDate&order=asc`. Opening a copied URL shows the same view.

## Deployment

- **Vercel:** `vercel.json` rewrites all paths to `index.html`.
- **Netlify:** `public/_redirects` does the same.
- Set `VITE_API_URL` in the hosting dashboard. Make sure the backend's `CORS_ORIGIN` includes the frontend URL.
