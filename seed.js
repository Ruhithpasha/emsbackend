const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/Employee');
const Admin = require('./models/Admin');
require('dotenv').config();

// Sample data based on your frontend LocalStorage
const sampleEmployees = [
  {
    firstName: "Ruhith",
    email: "e@e.com",
    password: "123",
    taskCounts: {
      active: 2,
      newTask: 1,
      completed: 1,
      failed: 0
    },
    tasks: [
      {
        active: true,
        newTask: true,
        completed: false,
        failed: false,
        taskTitle: "Update website",
        taskDescription: "Revamp the homepage design",
        taskDate: "2024-10-12",
        category: "Design"
      },
      {
        active: false,
        newTask: false,
        completed: true,
        failed: false,
        taskTitle: "Client meeting",
        taskDescription: "Discuss project requirements",
        taskDate: "2024-10-10",
        category: "Meeting"
      },
      {
        active: true,
        newTask: false,
        completed: false,
        failed: false,
        taskTitle: "Fix bugs",
        taskDescription: "Resolve bugs reported in issue tracker",
        taskDate: "2024-10-14",
        category: "Development"
      }
    ]
  },
  {
    firstName: "Sneha",
    email: "employee2@example.com",
    password: "123",
    taskCounts: {
      active: 1,
      newTask: 0,
      completed: 1,
      failed: 0
    },
    tasks: [
      {
        active: true,
        newTask: false,
        completed: false,
        failed: false,
        taskTitle: "Database optimization",
        taskDescription: "Optimize queries for better performance",
        taskDate: "2024-10-11",
        category: "Database"
      },
      {
        active: false,
        newTask: false,
        completed: true,
        failed: false,
        taskTitle: "Design new feature",
        taskDescription: "Create mockups for the new feature",
        taskDate: "2024-10-09",
        category: "Design"
      }
    ]
  }
];

const sampleAdmin = {
  email: "admin@me.com",
  password: "123",
  firstName: "Admin"
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Employee.deleteMany({});
    await Admin.deleteMany({});
    console.log('Cleared existing data');

    // Hash passwords and create employees
    for (const empData of sampleEmployees) {
      const hashedPassword = await bcrypt.hash(empData.password, 10);
      
      const employee = new Employee({
        ...empData,
        password: hashedPassword
      });
      
      await employee.save();
      console.log(`Created employee: ${empData.firstName} (${empData.email})`);
    }

    // Create admin
    const hashedAdminPassword = await bcrypt.hash(sampleAdmin.password, 10);
    const admin = new Admin({
      ...sampleAdmin,
      password: hashedAdminPassword
    });
    
    await admin.save();
    console.log(`Created admin: ${sampleAdmin.email}`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
