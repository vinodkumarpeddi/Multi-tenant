# System Architecture

## 1. System Architecture Diagram

![System Architecture](./images/system-architecture.png)
*(To be generated: A diagram showing Client -> Nginx/Frontend -> Backend API -> PostgreSQL)*

## 2. Database Schema Design (ERD)

![Database ERD](./images/database-erd.png)
*(To be generated: An ERD showing relationships between Tenants, Users, Projects, Tasks, and Audit Logs)*

### Description
-   **Tenants**: Root entity. Everything (except Super Admin) belongs to a tenant.
-   **Users**: Belongs to a Tenant.
-   **Projects**: Belongs to a Tenant. Created by a User.
-   **Tasks**: Belongs to a Project (and thus a Tenant). Assigned to a User.

## 3. API Architecture

### Authentication
-   `POST /api/auth/register-tenant`: Register new organization.
-   `POST /api/auth/login`: Authenticate user.
-   `GET /api/auth/me`: Get current user context.
-   `POST /api/auth/logout`: Invalidate session.

### Tenant Management
-   `GET /api/tenants`: List all tenants (Super Admin).
-   `GET /api/tenants/:id`: Get tenant details.
-   `PUT /api/tenants/:id`: Update tenant details.

### User Management
-   `GET /api/tenants/:tenantId/users`: List users in tenant.
-   `POST /api/tenants/:tenantId/users`: Add user to tenant.
-   `PUT /api/users/:id`: Update user.
-   `DELETE /api/users/:id`: Remove user.

### Project Management
-   `GET /api/projects`: List projects.
-   `POST /api/projects`: Create project.
-   `GET /api/projects/:id`: Get project details.
-   `PUT /api/projects/:id`: Update project.
-   `DELETE /api/projects/:id`: Delete project.

### Task Management
-   `GET /api/projects/:projectId/tasks`: List tasks in project.
-   `POST /api/projects/:projectId/tasks`: Create task.
-   `PUT /api/tasks/:id`: Update task details.
-   `PATCH /api/tasks/:id/status`: Update task status.
-   `DELETE /api/tasks/:id`: Delete task.
