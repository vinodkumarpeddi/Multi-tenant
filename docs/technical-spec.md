# Technical Specification

## 1. Project Structure

### Backend (`/backend`)
```
backend/
├── src/
│   ├── config/         # Database and app configuration
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, Tenant, Error handling middleware
│   ├── models/         # Database models/schemas
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic (optional, can be in controllers for simple apps)
│   ├── utils/          # Helper functions (logger, validation)
│   └── app.js          # App entry point
├── migrations/         # Database migration files
├── seeds/              # Database seed data
├── tests/              # Unit and integration tests
├── Dockerfile          # Docker build instructions
├── package.json        # Dependencies
└── .env.example        # Environment variable template
```

### Frontend (`/frontend`)
```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React Context (Auth, Theme)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components (routed)
│   ├── services/       # API client services
│   ├── styles/         # Global styles/Tailwind config
│   ├── utils/          # Helper functions
│   ├── App.jsx         # Main component
│   └── main.jsx        # Entry point
├── Dockerfile          # Docker build instructions
├── package.json        # Dependencies
└── vite.config.js      # Vite configuration
```

## 2. Development Setup Guide

### Prerequisites
-   **Node.js**: v18+
-   **Docker**: Desktop or Engine
-   **PostgreSQL**: v15 (if running locally without Docker)

### Environment Variables
Create a `.env` file in the `backend` directory based on `.env.example`. Key variables:
-   `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
-   `JWT_SECRET`
-   `PORT` (default 5000)

### Installation Steps
1.  **Clone Repository**: `git clone <repo_url>`
2.  **Install Backend Deps**: `cd backend && npm install`
3.  **Install Frontend Deps**: `cd frontend && npm install`

### Running Locally (Manual)
1.  Start PostgreSQL database.
2.  Run Migrations: `npm run migrate` (backend)
3.  Start Backend: `npm run dev`
4.  Start Frontend: `npm run dev`

### Running with Docker (Recommended)
1.  Ensure Docker is running.
2.  Run `docker-compose up -d --build`.
3.  Access Frontend at `http://localhost:3000`.
4.  Access Backend API at `http://localhost:5000`.
