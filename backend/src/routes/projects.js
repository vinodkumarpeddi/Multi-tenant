const express = require('express');
const router = express.Router();
const { createProject, listProjects, getProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createProject);
router.get('/', protect, listProjects);
router.get('/:projectId', protect, getProject);
router.put('/:projectId', protect, updateProject);
router.delete('/:projectId', protect, deleteProject);

// Nested Tasks Routes will be mounted here in app.js or handled via forwarded requests?
// The spec has: 
// API 16: POST /api/projects/:projectId/tasks
// API 17: GET /api/projects/:projectId/tasks
// So we should mount tasks router on /:projectId/tasks
const { taskController } = require('./tasks');
const tasksRouter = require('./tasks');

// We can delegate to tasks router if we set mergeParams: true in tasks router
router.use('/:projectId/tasks', tasksRouter);

module.exports = router;
