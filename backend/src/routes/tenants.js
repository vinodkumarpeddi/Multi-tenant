const express = require('express');
const router = express.Router();
const { getTenant, updateTenant, listTenants } = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware');

const { userController } = require('./users');

router.get('/', protect, listTenants);
router.post('/:tenantId/users', protect, userController.addUser);
router.get('/:tenantId/users', protect, userController.listUsers);
router.get('/:tenantId', protect, getTenant);
router.put('/:tenantId', protect, updateTenant);

module.exports = router;
