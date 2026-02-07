# Product Requirements Document (PRD)

## 1. User Personas

### 1.1 Super Admin
-   **Role**: System-level administrator.
-   **Key Responsibilities**: Oversee all tenants, manage global settings, intervene in tenant issues.
-   **Goals**: Ensure system stability, manage tenant subscriptions, view global analytics.
-   **Pain Points**: Lack of visibility into distinct tenant usage, difficulty in troubleshooting cross-tenant issues.

### 1.2 Tenant Admin
-   **Role**: Organization administrator (the customer).
-   **Key Responsibilities**: Manage their own organization's users, projects, and billing/subscription.
-   **Goals**: Efficiently onboard team members, configure project workflows, maintain data security.
-   **Pain Points**: Complexity in managing user roles, fear of data leaks to other organizations.

### 1.3 End User
-   **Role**: Regular team member.
-   **Key Responsibilities**: Execute tasks, collaborate on projects, update status.
-   **Goals**: Complete assigned work, track progress, communicate updates.
-   **Pain Points**: Confusing interface, difficulty finding assigned tasks.

## 2. Functional Requirements

### Authentication Module
-   **FR-001**: The system shall allow new tenants to register with a unique subdomain.
-   **FR-002**: The system shall allow users to login using email, password, and tenant subdomain.
-   **FR-003**: The system shall support JWT-based authentication with a 24-hour expiry.
-   **FR-004**: The system shall allow users to logout, invalidating their client-side session.

### Tenant Management Module
-   **FR-005**: The system shall allow Super Admins to view a list of all registered tenants.
-   **FR-006**: The system shall allow Tenant Admins to view and update their organization's profile (name).
-   **FR-007**: The system shall enforce subscription limits (max users, max projects) based on the tenant's plan.

### User Management Module
-   **FR-008**: The system shall allow Tenant Admins to invite/add new users to their organization.
-   **FR-009**: The system shall allow Tenant Admins to update user roles (Admin vs User).
-   **FR-010**: The system shall allow Tenant Admins to deactivate/remove users from their organization.

### Project Management Module
-   **FR-011**: The system shall allow users to create new projects with a name and description.
-   **FR-012**: The system shall allow users to view a list of projects associated with their tenant.
-   **FR-013**: The system shall allow project creators or admins to update project details/status.

### Task Management Module
-   **FR-014**: The system shall allow users to create tasks within a project.
-   **FR-015**: The system shall allow users to assign tasks to other members of the same tenant.
-   **FR-016**: The system shall allow users to update task status (Todo -> In Progress -> Done).

### Audit Logging
-   **FR-017**: The system shall record all critical actions (Create/Update/Delete) in an audit log.

## 3. Non-Functional Requirements

-   **NFR-001 (Performance)**: API response time should be under 200ms for 90% of requests.
-   **NFR-002 (Security)**: All passwords must be hashed using bcrypt/argon2 before storage.
-   **NFR-003 (Scalability)**: The system must support at least 100 concurrent users without degradation.
-   **NFR-004 (Availability)**: The system should aim for 99.9% uptime.
-   **NFR-005 (Usability)**: The user interface must be responsive and usable on mobile devices.
