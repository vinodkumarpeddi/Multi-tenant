# Research: Multi-Tenant SaaS Architecture

## 1. Multi-Tenancy Analysis

### Approaches Comparison

| Approach | Description | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Shared Database, Shared Schema** | All tenants share the same database and tables. A `tenant_id` column creates logical separation. | - **Cost-effective**: Single database instance.<br>- **Easy Maintenance**: Schema updates are applied once.<br>- **Scalable**: Easy to add new tenants without infrastructure changes. | - **Data Isolation Risk**: Developers must ensure strict `tenant_id` filtering.<br>- **Performance**: "Noisy neighbor" effect if one tenant uses excessive resources.<br>- **Backup Complexity**: Restoring a single tenant's data is difficult. |
| **Shared Database, Separate Schema** | All tenants share the same database, but each has a separate schema (e.g., `schema_tenant_a`, `schema_tenant_b`). | - **Better Isolation**: Logical separation at the database level.<br>- **Customization**: Easier to support custom fields/tables per tenant. | - **Migration Complexity**: Schema updates must be run for every tenant.<br>- **Resource Overhead**: High number of schemas can impact database performance. |
| **Separate Database** | Each tenant has their own dedicated database instance. | - **Maximum Isolation**: Physical data separation.<br>- **Performance**: Dedicated resources per tenant.<br>- **Security**: Breach of one DB doesn't expose others. | - **High Cost**: Expensive infrastructure.<br>- **Maintenance Overhead**: Managing hundreds/thousands of DB instances is complex.<br>- **Scalability Limits**: Harder to aggregate data across tenants. |

### Chosen Approach: Shared Database, Shared Schema
We have selected the **Shared Database, Shared Schema** approach for this project.
**Justification**:
1.  **Simplicity**: It aligns best with the project's scope and timeline (dockerized MVP).
2.  **Resource Efficiency**: Running a single Postgres instance in Docker is lightweight compared to managing multiple schemas or databases.
3.  **Modern tooling**: ORMs and middleware make it easier to enforce `tenant_id` filtering securely, mitigating the main downside of isolation risk.

## 2. Technology Stack Justification

### Backend: Node.js with Express.js
-   **Why**: Non-blocking I/O model is excellent for handling concurrent requests in a multi-tenant environment.
-   **Ecosystem**: Vast library support (JWT, bcrypt, Sequelize/TypeORM/Knex) accelerates development.
-   **JSON Handling**: Native JSON support fits perfectly with our REST API requirements.

### Frontend: React (Vite)
-   **Why**: Component-based architecture allows for reusable UI elements (critical for a dashboard with many similar views).
-   **Performance**: Vite provides a blazing fast dev server and optimized production builds.
-   **State Management**: React Context/Hooks are sufficient for managing auth state and tenant context without external bloat.

### Database: PostgreSQL
-   **Why**: Robost relational database with strong support for ACID transactions (critical for tenant registration).
-   **Reliability**: Industry standard for SaaS applications.
-   **Docker Support**: Official images are stable and easy to configure.

### Authentication: JWT (JSON Web Tokens)
-   **Why**: Stateless authentication is scalable and simplifies the "Shared Database" architecture. No need to look up session state in the DB for every request, reducing load.
-   **Flexibility**: Easy to embed `tenant_id` and `role` directly in the token payload.

### Containerization: Docker & Docker Compose
-   **Why**: Mandatory requirement. Ensures consistent environment across dev and production. Simplifies deployment of the 3-service stack (DB, Backend, Frontend).

## 3. Security Considerations

### Data Isolation Strategy
-   **Row-Level Security (RLS) simulation**: We will implement middleware that extracts `tenant_id` from the JWT and forces it into every database query.
-   **API Design**: No API endpoint will accept a `tenant_id` in the body for data retrieval; it will always be derived from the trusted JWT.

### Authentication & Authorization
-   **JWT**: Signed with a strong secret. 24-hour expiration reduces the attack window if a token is stolen.
-   **Password Hashing**: We will use `bcrypt` (or `argon2`) to hash passwords before storage. Plain text passwords will never be stored.
-   **RBAC**: Middleware will enforce role checks (`super_admin`, `tenant_admin`, `user`) before executing controller logic.

### API Security
-   **Input Validation**: All incoming data will be validated against strict schemas (e.g., using `Joi` or `zod`) to prevent injection attacks.
-   **CORS**: Configured to only allow requests from the specific frontend origin.
-   **Rate Limiting**: (Optional) Can be added to login endpoints to prevent brute-force attacks.

### Audit Logging
-   **Traceability**: Every write operation (CREATE, UPDATE, DELETE) will be logged to an `audit_logs` table, capturing *who* did *what* and *when*. This is crucial for debugging and security audits in a multi-tenant system.
