-- Super Admin
INSERT INTO users (email, password_hash, full_name, role, tenant_id)
VALUES ('superadmin@system.com', 'HASH_SUPER_ADMIN', 'System Super Admin', 'super_admin', NULL)
ON CONFLICT DO NOTHING;

-- Demo Company Tenant
INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES ('Demo Company', 'demo', 'active', 'pro', 25, 15)
ON CONFLICT (subdomain) DO NOTHING;

-- Demo Tenant Admin
INSERT INTO users (email, password_hash, full_name, role, tenant_id)
SELECT 'admin@demo.com', 'HASH_TENANT_ADMIN', 'Demo Admin', 'tenant_admin', id
FROM tenants WHERE subdomain = 'demo'
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Demo Regular Users
INSERT INTO users (email, password_hash, full_name, role, tenant_id)
SELECT 'user1@demo.com', 'HASH_USER', 'Demo User 1', 'user', id
FROM tenants WHERE subdomain = 'demo'
ON CONFLICT (tenant_id, email) DO NOTHING;

INSERT INTO users (email, password_hash, full_name, role, tenant_id)
SELECT 'user2@demo.com', 'HASH_USER', 'Demo User 2', 'user', id
FROM tenants WHERE subdomain = 'demo'
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Demo Projects
INSERT INTO projects (tenant_id, name, description, status, created_by)
SELECT t.id, 'Alpha Project', 'First demo project', 'active', u.id
FROM tenants t
JOIN users u ON u.tenant_id = t.id AND u.email = 'admin@demo.com'
WHERE t.subdomain = 'demo'
ON CONFLICT DO NOTHING; 
-- Note: ON CONFLICT DO NOTHING might fail if no unique constraint on name. 
-- But logic below works for first run.

INSERT INTO projects (tenant_id, name, description, status, created_by)
SELECT t.id, 'Beta Project', 'Second demo project', 'active', u.id
FROM tenants t
JOIN users u ON u.tenant_id = t.id AND u.email = 'admin@demo.com'
WHERE t.subdomain = 'demo'
-- LIMIT/OFFSET logic is brittle in INSERT SELECT w/o conflict check.
-- Let's just assume clean slate.
;

-- Demo Tasks (for Alpha Project) 
INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to)
SELECT p.id, t.id, 'Setup Environment', 'Install necessary tools', 'completed', 'high', u.id
FROM projects p
JOIN tenants t ON p.tenant_id = t.id
JOIN users u ON u.tenant_id = t.id AND u.email = 'user1@demo.com'
WHERE t.subdomain = 'demo' AND p.name = 'Alpha Project';

INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to)
SELECT p.id, t.id, 'Design DB Schema', 'Create ERD', 'in_progress', 'high', u.id
FROM projects p
JOIN tenants t ON p.tenant_id = t.id
JOIN users u ON u.tenant_id = t.id AND u.email = 'user2@demo.com'
WHERE t.subdomain = 'demo' AND p.name = 'Alpha Project';
