const express = require('express');
const router = express.Router();
const { addUser, listUsers, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Note: Some routes are nested under /tenants/:tenantId/users in the spec
// We will need to route them appropriately in app.js or handle here
// The prompt says: 
// API 8: POST /api/tenants/:tenantId/users
// API 9: GET /api/tenants/:tenantId/users
// API 10: PUT /api/users/:userId
// API 11: DELETE /api/users/:userId

// We can split this.
// For /api/users
router.put('/:userId', protect, updateUser);
router.delete('/:userId', protect, deleteUser);

// For /api/tenants/:tenantId/users
// We need to export a separate router or merge them?
// Let's create a separate router file for tenant-users if strictly following structure,
// OR just mount this router at /api/users and /api/tenants/:tenantId/users?
// Express allows mounting the same router.
// But the path params are different.

// Let's handle the direct /users/ routes here.
// And export handler functions for the tenant router.

module.exports = router;
module.exports.userController = { addUser, listUsers };
