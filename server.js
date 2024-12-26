const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const natural = require('natural');
const moment = require('moment');

const app = express();
const cors = require('cors');
app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb+srv://talrejayuvvan:princey65@cluster0.gznpo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
  
// Enhanced Task schema
const taskSchema = new mongoose.Schema({
  description: String,
  dueDate: Date,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 }, // in minutes
  category: String
});

const Task = mongoose.model('Task', taskSchema);

// Enhanced NLP classifier
const classifier = new natural.BayesClassifier();

classifier.addDocument('add task', 'addTask');
classifier.addDocument('create task', 'addTask');
classifier.addDocument('new task', 'addTask');
classifier.addDocument('show tasks', 'listTasks');
classifier.addDocument('list tasks', 'listTasks');
classifier.addDocument('view tasks', 'listTasks');
classifier.addDocument('update task', 'updateTask');
classifier.addDocument('modify task', 'updateTask');
classifier.addDocument('change task', 'updateTask');
classifier.addDocument('complete task', 'completeTask');
classifier.addDocument('finish task', 'completeTask');
classifier.addDocument('task done', 'completeTask');
classifier.addDocument('delete task', 'deleteTask');
classifier.addDocument('remove task', 'deleteTask');
classifier.addDocument('plan my day', 'planDay');
classifier.addDocument('daily plan', 'planDay');
classifier.addDocument('today\'s schedule', 'planDay');
classifier.addDocument('task statistics', 'taskStats');
classifier.addDocument('productivity report', 'taskStats');

classifier.train();

// Helper function to parse dates
function parseDate(dateString) {
  return moment(dateString, ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'], true);
}

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const intent = classifier.classify(message.toLowerCase());

  let response;

  try {
    switch (intent) {
      case 'addTask':
        const tokenizer = new natural.SentenceTokenizer();
        const taskDetails = tokenizer.tokenize(message);
        console.log("Task Details:", taskDetails);
        const newTask = new Task({
          description: taskDetails.slice(2).join(' '),
          dueDate: parseDate(taskDetails[taskDetails.length - 1]).isValid() 
            ? parseDate(taskDetails[taskDetails.length - 1]).toDate() 
            : null,
          priority: taskDetails.includes('high') ? 'high' : (taskDetails.includes('low') ? 'low' : 'medium'),
          category: taskDetails.includes('work') ? 'work' : (taskDetails.includes('personal') ? 'personal' : 'general')
        });
        await newTask.save();
        response = `Task "${newTask.description}" has been added.`;
        break;

      case 'listTasks':
        const tasks = await Task.find({ completed: false });
        response = tasks.length > 0
          ? `Here are your pending tasks:\n${tasks.map(t => `- ${t.description} (Due: ${t.dueDate ? moment(t.dueDate).format('YYYY-MM-DD') : 'Not set'}, Priority: ${t.priority})`).join('\n')}`
          : "You don't have any pending tasks.";
        break;

      case 'updateTask':
        // This is a simplified update. In a real application, you'd need to handle various update scenarios.
        const updateDetails = natural.SentenceTokenizer().tokenize(message);
        const taskToUpdate = await Task.findOne({ description: new RegExp(updateDetails[2], 'i') });
        if (taskToUpdate) {
          if (updateDetails.includes('priority')) {
            taskToUpdate.priority = updateDetails.includes('high') ? 'high' : (updateDetails.includes('low') ? 'low' : 'medium');
          }
          if (updateDetails.includes('due')) {
            const newDueDate = parseDate(updateDetails[updateDetails.length - 1]);
            if (newDueDate.isValid()) {
              taskToUpdate.dueDate = newDueDate.toDate();
            }
          }
          await taskToUpdate.save();
          response = `Task "${taskToUpdate.description}" has been updated.`;
        } else {
          response = "I couldn't find that task. Can you please try again with the exact task description?";
        }
        break;

      case 'completeTask':
        const taskToComplete = await Task.findOne({ description: new RegExp(message.replace(/complete task|finish task|task done/i, '').trim(), 'i') });
        if (taskToComplete) {
          taskToComplete.completed = true;
          await taskToComplete.save();
          response = `Task "${taskToComplete.description}" has been marked as completed.`;
        } else {
          response = "I couldn't find that task. Can you please try again with the exact task description?";
        }
        break;

      case 'deleteTask':
        const taskToDelete = await Task.findOneAndDelete({ description: new RegExp(message.replace(/delete task|remove task/i, '').trim(), 'i') });
        if (taskToDelete) {
          response = `Task "${taskToDelete.description}" has been deleted.`;
        } else {
          response = "I couldn't find that task. Can you please try again with the exact task description?";
        }
        break;

      case 'planDay':
        const today = moment().startOf('day');
        const tomorrow = moment(today).add(1, 'days');
        const todaysTasks = await Task.find({
          dueDate: { $gte: today.toDate(), $lt: tomorrow.toDate() },
          completed: false
        }).sort({ priority: -1 });
        response = todaysTasks.length > 0
          ? `Here's your plan for today:\n${todaysTasks.map(t => `- ${t.description} (Priority: ${t.priority})`).join('\n')}`
          : "You don't have any tasks scheduled for today.";
        break;

      case 'taskStats':
        const completedTasks = await Task.countDocuments({ completed: true });
        const pendingTasks = await Task.countDocuments({ completed: false });
        const totalTimeSpent = await Task.aggregate([
          { $group: { _id: null, total: { $sum: "$timeSpent" } } }
        ]);
        response = `Here are your task statistics:\n` +
          `Completed tasks: ${completedTasks}\n` +
          `Pending tasks: ${pendingTasks}\n` +
          `Total time spent on tasks: ${totalTimeSpent[0]?.total || 0} minutes`;
        break;

      default:
        response = "I'm sorry, I didn't understand that. Could you please rephrase?";
    }
  } catch (error) {
    console.error('Error:', error);
    response = "I'm sorry, there was an error processing your request. Please try again.";
  }

  res.json({ message: response });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));