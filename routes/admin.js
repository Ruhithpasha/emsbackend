const express = require('express');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const Admin = require('../models/Admin');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all employees
router.get('/employees', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find().select('-password');
    res.json(employees);
  } catch (error) {
    console.error('Fetch employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new employee
router.post('/employees', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { firstName, email, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (existingEmployee || existingAdmin) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new employee
    const employee = new Employee({
      firstName,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: {
        id: employee._id,
        firstName: employee.firstName,
        email: employee.email,
        taskCounts: employee.taskCounts,
        tasks: employee.tasks
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign task to employee
router.post('/employees/:employeeId/tasks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { taskTitle, taskDescription, taskDate, category } = req.body;

    if (!taskTitle || !taskDescription || !taskDate || !category) {
      return res.status(400).json({ message: 'All task fields are required' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const newTask = {
      taskTitle,
      taskDescription,
      taskDate,
      category,
      active: false,
      newTask: true,
      completed: false,
      failed: false
    };

    employee.tasks.push(newTask);
    await employee.save();

    res.json({
      success: true,
      message: 'Task assigned successfully',
      task: newTask
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete employee
router.delete('/employees/:employeeId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findByIdAndDelete(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const employees = await Employee.find().select('taskCounts');
    
    let totalTasks = 0;
    let completedTasks = 0;
    let activeTasks = 0;
    let failedTasks = 0;

    employees.forEach(emp => {
      totalTasks += emp.taskCounts.active + emp.taskCounts.completed + emp.taskCounts.failed;
      completedTasks += emp.taskCounts.completed;
      activeTasks += emp.taskCounts.active;
      failedTasks += emp.taskCounts.failed;
    });

    res.json({
      totalEmployees,
      totalTasks,
      completedTasks,
      activeTasks,
      failedTasks
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks from all employees
router.get('/tasks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find().select('firstName email tasks');
    const allTasks = [];

    employees.forEach(employee => {
      employee.tasks.forEach(task => {
        allTasks.push({
          ...task.toObject(),
          _id: task._id,
          assignedTo: employee._id,
          assignedToName: employee.firstName,
          assignedToEmail: employee.email,
          // Map task status to match frontend expectations
          taskStatus: task.newTask ? 'newTask' : 
                     task.active ? 'active' : 
                     task.completed ? 'completed' : 
                     task.failed ? 'failed' : 'newTask',
          priority: task.priority || 'medium' // Default priority if not set
        });
      });
    });

    res.json(allTasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.put('/tasks/:taskId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { taskStatus } = req.body;

    // Find the employee who has this task
    const employee = await Employee.findOne({ 'tasks._id': taskId });
    if (!employee) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = employee.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Reset all status flags
    task.newTask = false;
    task.active = false;
    task.completed = false;
    task.failed = false;

    // Set the new status
    switch (taskStatus) {
      case 'newTask':
        task.newTask = true;
        break;
      case 'active':
        task.active = true;
        break;
      case 'completed':
        task.completed = true;
        break;
      case 'failed':
        task.failed = true;
        break;
      default:
        task.newTask = true;
    }

    await employee.save();

    res.json({
      success: true,
      message: 'Task status updated successfully',
      task: task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/tasks/:taskId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the employee who has this task
    const employee = await Employee.findOne({ 'tasks._id': taskId });
    if (!employee) {
      return res.status(404).json({ message: 'Task not found' });
    }

    employee.tasks.id(taskId).remove();
    await employee.save();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Migration endpoint to fix existing task statuses
router.post('/migrate-tasks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find({});
    let updatedCount = 0;

    for (const employee of employees) {
      let hasChanges = false;
      
      employee.tasks.forEach(task => {
        // Check if task has conflicting statuses
        const statuses = [task.newTask, task.active, task.completed, task.failed];
        const trueCount = statuses.filter(status => status === true).length;
        
        if (trueCount > 1) {
          // Reset all statuses
          task.active = false;
          task.newTask = false;
          task.completed = false;
          task.failed = false;
          
          // Set appropriate status based on priority
          if (task.completed) task.completed = true;
          else if (task.failed) task.failed = true;
          else if (task.active) task.active = true;
          else task.newTask = true;
          
          hasChanges = true;
        } else if (trueCount === 0) {
          // If no status is set, default to newTask
          task.newTask = true;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        await employee.save();
        updatedCount++;
      }
    }

    res.json({
      success: true,
      message: `Migration completed. Updated ${updatedCount} employees.`,
      updatedCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: 'Migration failed' });
  }
});

module.exports = router;
