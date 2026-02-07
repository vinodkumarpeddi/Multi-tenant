const express = require('express');
const router = express.Router({ mergeParams: true }); // Important for accessing :projectId from parent router
const { createTask, listTasks, updateTaskStatus, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Routes mounted at /api/projects/:projectId/tasks
router.post('/', protect, createTask);
router.get('/', protect, listTasks);

// Routes mounted at /api/tasks
// These need a separate router or we handle route matching carefully.
// The best way for 'global' task routes (PUT /tasks/:id) is to have another router instance or root route in app.js
// Let's assume this file exports a router for the nested part, and we export specific handlers or another router for global parts.

module.exports = router;
module.exports.taskController = { updateTaskStatus, updateTask, deleteTask };
