const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database: 'connected', // We will verify this later
    timestamp: new Date().toISOString()
  });
});

const { initializeDatabase } = require('./utils/dbInit');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/users', require('./routes/users'));

app.use('/api/projects', require('./routes/projects'));

// Global Task Routes (PUT/PATCH/DELETE /api/tasks/:id)
const tasksRouter2 = require('express').Router();
const taskController = require('./controllers/taskController');
const { protect } = require('./middleware/authMiddleware');

tasksRouter2.patch('/:taskId/status', protect, taskController.updateTaskStatus);
tasksRouter2.put('/:taskId', protect, taskController.updateTask);
tasksRouter2.delete('/:taskId', protect, taskController.deleteTask);

app.use('/api/tasks', tasksRouter2);

if (require.main === module) {
  // Initialize DB before starting server
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = app;
