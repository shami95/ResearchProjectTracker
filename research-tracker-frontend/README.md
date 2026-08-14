# Research Project Tracker — Frontend

React + TypeScript frontend for the CMJD Assignment 2 coursework, connecting
to the Spring Boot Research Project Tracker backend.

## Tech Stack
- React 18 + TypeScript (Create React App)
- React Router v6 (SPA navigation)
- Axios (backend communication)
- Context API (auth/global state)
- React Bootstrap (styling)

## Prerequisites
- Node.js 18+ and npm
- The backend running at `http://localhost:8081` (see `research-tracker-backend/README.md`)

## Setup

```bash
npm install
npm start
```

The app opens at `http://localhost:3000` and talks to the backend at
`http://localhost:8081` by default. To point it somewhere else, create a
`.env.local` file:

```
REACT_APP_API_BASE_URL=http://localhost:8081
```

## Structure

```
src/
├── api/axiosClient.ts       axios instance: attaches JWT, redirects to /login on 401
├── context/AuthContext.tsx  global auth state (Context API)
├── utils/jwt.ts             decode/expiry helpers for the JWT
├── types/index.ts           TypeScript types matching backend DTOs
├── components/              NavBar, route guards, spinner, status badge
└── pages/                   one file per route
```

## Routes

| Path                  | Page                          | Access             |
|------------------------|-------------------------------|---------------------|
| `/login`               | Sign in                       | Public              |
| `/register`            | Sign up                       | Public              |
| `/dashboard`           | Overview / stats              | Any authenticated   |
| `/projects`            | Project list + search/filter  | Any authenticated   |
| `/projects/new`        | Create project                | PI, ADMIN           |
| `/projects/:id`        | Project detail, milestones, documents | Any authenticated (edit/delete gated by role) |
| `/projects/:id/edit`   | Edit project                  | Owning PI, ADMIN    |
| `/milestones`          | All milestones across projects| Any authenticated   |
| `/documents`           | All documents across projects | Any authenticated   |
| `/admin`               | User management                | ADMIN only          |

## Test accounts

The backend seeds three accounts on first run (see backend README):

| Username    | Password    | Role   |
|-------------|-------------|--------|
| `admin`     | `Admin@123` | ADMIN  |
| `dr.perera` | `Pi@12345`  | PI     |
| `viewer1`   | `Viewer@123`| VIEWER |

You can also register your own account from `/register` — it will be created
with the `MEMBER` role.

## Notes
- The JWT is stored in `localStorage` and decoded client-side to read the
  user's id/role/name; a 401 response from the API clears it and redirects
  to `/login`.
- This was built and verified with `npm install`, `npx tsc --noEmit`, and a
  full `npm run build` — all completed with zero errors.
