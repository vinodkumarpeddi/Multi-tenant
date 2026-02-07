# Multi-Tenant SaaS Platform

A production-ready, multi-tenant SaaS application built with Node.js, Express, React, and PostgreSQL.

## Features

- **Multi-Tenancy**: Complete data isolation using Tenant IDs.
- **Authentication**: Secure JWT-based auth with Role-Based Access Control (RBAC).
- **Roles**: Super Admin, Tenant Admin, Standard User.
- **Project Management**: Create and manage projects within your organization.
- **Task Management**: Assign tasks, track status, and set priorities.
- **User Management**: Manage team members within your tenant.
- **Dashboard**: Real-time overview of tenant statistics.
- **Audit Logs**: Track important actions for security and compliance.

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL (pg, sequelize-cli for migrations)
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Axios
- **Infrastructure**: Docker, Docker Compose

## Prerequisites

- Docker and Docker Compose installed on your machine.

## Getting Started

1.  **Clone the repository** (if applicable).
2.  **Start the Application**:
    ```bash
    docker-compose up --build
    ```
    This command will:
    - Start the PostgreSQL database.
    - Build and start the Backend API (running on port 5000).
    - Build and start the Frontend (running on port 3000).
    - Automatically run database migrations and seed initial data.

3.  **Access the Application**:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **Backend API**: [http://localhost:5000](http://localhost:5000)

## Default Credentials

### Super Admin
- **Email**: `superadmin@system.com`
- **Password**: `Admin@123`

### Demo Tenant Admin (Tenant: 'demo')
- **Email**: `admin@demo.com`
- **Password**: `Demo@123`

### Demo User
- **Email**: `user1@demo.com`
- **Password**: `User@123`

## Development

### Backend Structure
- `src/controllers`: Request handlers
- `src/models`: Database models (implicit via SQL)
- `src/routes`: API routes
- `src/middleware`: Auth and Error handling
- `migrations`: SQL migration files

### Frontend Structure
- `src/pages`: Main view components
- `src/components`: Reusable UI components
- `src/context`: React Context (Auth)
- `src/api`: Axios configuration

## API Documentation

- **Auth**: `/api/auth/register-tenant`, `/api/auth/login`, `/api/auth/me`
- **Tenants**: `/api/tenants` (CRUD)
- **Users**: `/api/tenants/:tenantId/users`, `/api/users/:userId`
- **Projects**: `/api/projects`
- **Tasks**: `/api/projects/:projectId/tasks`, `/api/tasks/:taskId`

## License
MIT
