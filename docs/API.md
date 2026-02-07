# API Documentation

## Authentication

### 1. Tenant Registration
-   **Endpoint**: `POST /api/auth/register-tenant`
-   **Auth**: Public
-   **Body**:
    ```json
    {
      "tenantName": "Acme Corp",
      "subdomain": "acme",
      "adminEmail": "admin@acme.com",
      "adminPassword": "password123",
      "adminFullName": "John Doe"
    }
    ```
-   **Response (201)**:
    ```json
    {
      "success": true,
      "message": "Tenant registered successfully",
      "data": { "tenantId": "...", "subdomain": "acme" }
    }
    ```

### 2. Login
-   **Endpoint**: `POST /api/auth/login`
-   **Auth**: Public
-   **Body**:
    ```json
    {
      "email": "admin@acme.com",
      "password": "password123",
      "tenantSubdomain": "acme"
    }
    ```
-   **Response (200)**:
    ```json
    {
      "success": true,
      "data": { "token": "jwt...", "user": { ... } }
    }
    ```

### 3. Get Current User
-   **Endpoint**: `GET /api/auth/me`
-   **Auth**: Bearer Token
-   **Response (200)**: User profile and tenant info.

### 4. Logout
-   **Endpoint**: `POST /api/auth/logout`
-   **Auth**: Bearer Token
-   **Response (200)**: Success message.

## Tenant Management

### 5. Get Tenant Details
-   **Endpoint**: `GET /api/tenants/:tenantId`
-   **Auth**: Tenant Admin or Super Admin
-   **Response (200)**: Tenant details and quotas.

### 6. Update Tenant
-   **Endpoint**: `PUT /api/tenants/:tenantId`
-   **Auth**: Tenant Admin (partial) or Super Admin (full)
-   **Body**: `{ "name": "New Name" }`

### 7. List All Tenants
-   **Endpoint**: `GET /api/tenants`
-   **Auth**: Super Admin Only
-   **Response (200)**: List of all registered tenants.

## User Management

### 8. Add User
-   **Endpoint**: `POST /api/tenants/:tenantId/users`
-   **Auth**: Tenant Admin
-   **Body**:
    ```json
    {
      "email": "user@acme.com",
      "password": "password123",
      "fullName": "Jane Doe",
      "role": "user"
    }
    ```

### 9. List Users
-   **Endpoint**: `GET /api/tenants/:tenantId/users`
-   **Auth**: Tenant Admin

### 10. Update User
-   **Endpoint**: `PUT /api/users/:userId`
-   **Auth**: Tenant Admin

### 11. Delete User
-   **Endpoint**: `DELETE /api/users/:userId`
-   **Auth**: Tenant Admin

## Project Management

### 12. Create Project
-   **Endpoint**: `POST /api/projects`
-   **Auth**: User
-   **Body**: `{ "name": "Project X", "description": "..." }`

### 13. List Projects
-   **Endpoint**: `GET /api/projects`
-   **Auth**: User

### 14. Update Project
-   **Endpoint**: `PUT /api/projects/:projectId`
-   **Auth**: Tenant Admin or Creator

### 15. Delete Project
-   **Endpoint**: `DELETE /api/projects/:projectId`
-   **Auth**: Tenant Admin or Creator

## Task Management

### 16. Create Task
-   **Endpoint**: `POST /api/projects/:projectId/tasks`
-   **Auth**: User
-   **Body**: `{ "title": "Fix Bug", "assignedTo": "userId" }`

### 17. List Tasks
-   **Endpoint**: `GET /api/projects/:projectId/tasks`
-   **Auth**: User

### 18. Update Task Status
-   **Endpoint**: `PATCH /api/tasks/:taskId/status`
-   **Auth**: User
-   **Body**: `{ "status": "completed" }`

### 19. Update Task
-   **Endpoint**: `PUT /api/tasks/:taskId`
-   **Auth**: User
