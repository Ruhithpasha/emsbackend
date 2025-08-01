const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    default: false
  },
  newTask: {
    type: Boolean,
    default: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  failed: {
    type: Boolean,
    default: false
  },
  taskTitle: {
    type: String,
    required: true
  },
  taskDescription: {
    type: String,
    required: true
  },
  taskDate: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  }
});

// Ensure task statuses are mutually exclusive
taskSchema.pre('save', function(next) {
  // Only one status should be true at a time
  const statuses = ['newTask', 'active', 'completed', 'failed'];
  const trueStatuses = statuses.filter(status => this[status]);
  
  // If multiple statuses are true, prioritize in this order: completed > failed > active > newTask
  if (trueStatuses.length > 1) {
    // Reset all statuses
    statuses.forEach(status => this[status] = false);
    
    // Set the highest priority status
    if (this.completed) this.completed = true;
    else if (this.failed) this.failed = true;
    else if (this.active) this.active = true;
    else this.newTask = true;
  }
  
  next();
});

const employeeSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'employee'
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  taskCounts: {
    active: {
      type: Number,
      default: 0
    },
    newTask: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    }
  },
  tasks: [taskSchema]
}, {
  timestamps: true
});

// Update task counts before saving
employeeSchema.pre('save', function(next) {
  this.taskCounts.active = this.tasks.filter(task => task.active).length;
  this.taskCounts.newTask = this.tasks.filter(task => task.newTask).length;
  this.taskCounts.completed = this.tasks.filter(task => task.completed).length;
  this.taskCounts.failed = this.tasks.filter(task => task.failed).length;
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
