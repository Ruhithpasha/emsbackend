const express = require('express');
const Employee = require('../models/Employee');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get employee profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.put('/task/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { active, newTask, completed, failed } = req.body;

    const employee = await Employee.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const task = employee.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Reset all statuses first to ensure mutual exclusivity
    task.active = false;
    task.newTask = false;
    task.completed = false;
    task.failed = false;

    // Set the new status (only one should be true)
    if (active === true) task.active = true;
    else if (newTask === true) task.newTask = true;
    else if (completed === true) task.completed = true;
    else if (failed === true) task.failed = true;
    else task.newTask = true; // Default fallback

    await employee.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
