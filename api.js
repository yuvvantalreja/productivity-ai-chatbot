const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const moment = require('moment');
const Anthropic = require('@anthropic-ai/sdk');

require('dotenv').config();

const app = express();
const cors = require('cors');
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(`mongodb+srv://talrejayuvvan:${process.env.DB_KEY}@cluster0.gznpo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

const taskSchema = new mongoose.Schema({
  description: String,
  dueDate: Date,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 },
  category: String
});

const Task = mongoose.model('Task', taskSchema);

function parseDate(dateString) {
  console.log("DatesString is" + dateString)
  const parsed_date = moment(dateString, ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'], true)
  console.log("ParsedDate is" + parsed_date);
  return parsed_date
}

const anthropic = new Anthropic({
    apiKey: process.env.CLAUD_KEY,
});

async function getClaudeIntent(message) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 512,
      messages: [{ role: "user", content: `
        As a productivity chatbot that manages tasks, sends reminders, and tracks goals, analyze the following user message:
        "${message}"
        Determine the user's intent and provide a JSON response with the following structure:
        {
          "intent": "addTask|listTasks|updateTask|completeTask|deleteTask|planDay|taskStats",
          "taskDetails": {
            "description": "",
            "dueDate": "MM-DD-YYYY",
            "priority": "low|medium|high",
            "category": ""
          },
          "response": ""
        }
        Fill in the appropriate fields based on the user's message. If a field is not applicable, leave it as an empty string.
        The due date should be in the form MM-DD-YYYY. Make sure to calculate this based on the current date.
        The "response" field should contain a friendly message to the user based on the determined intent.
      ` }],
    });
      
    const textContent = response.content[0].text;

    // Find the JSON part within the text content and parse it
    const jsonStart = textContent.indexOf('{');
    const jsonEnd = textContent.lastIndexOf('}') + 1;
    const jsonResponse = textContent.slice(jsonStart, jsonEnd);
    console.log(jsonResponse)
    // Parse the extracted JSON string
    return JSON.parse(jsonResponse);

  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Claude AI failed to process the message');
  }
}

async function getClaudeSummary(){
  const tasks = await Task.find({ completed: false });
  try{
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 128,
      messages: [{
        role: "user", content: `Write a paragraph greeting me and summarising my tasks. My tasks are as follows:${tasks.map(t => `- ${t.description} (Due: ${moment(t.dueDate).format('YYYY-MM-DD')}`).join('\n')}. Make sure to go from most urgent to least urgent tasks. End with a quote of the day and a farewell. Make it light hearted and friendly.`
      }]
    });
    console.log("response" + response);
    return response
  }
  catch(error){
  }
}

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  try {
    const claudeResponse = await getClaudeIntent(message);
    let dbResponse;
    
    switch (claudeResponse.intent) {
      case 'addTask':
        const newTask = new Task({
          description: claudeResponse.taskDetails.description,
          dueDate: parseDate(claudeResponse.taskDetails.dueDate).toDate(),
          priority: claudeResponse.taskDetails.priority,
          category: claudeResponse.taskDetails.category
        });
        await newTask.save();
        dbResponse = 'Task added successfully.';
        break;

      case 'listTasks':
        const tasks = await Task.find({ completed: false });
        dbResponse = tasks.length > 0
          ? `Here are your pending tasks:\n${tasks.map(t => `- ${t.description} (Due: ${moment(t.dueDate).format('YYYY-MM-DD')}, Priority: ${t.priority})`).join('\n')}`
          : "You don't have any pending tasks.";
        break;

      case 'planDay':
        const today = moment().startOf('day');
        const tomorrow = moment(today).add(1, 'days');
        const todaysTasks = await Task.find({
          dueDate: { $gte: today.toDate(), $lt: tomorrow.toDate() },
          completed: false
        }).sort({ priority: -1 });
        dbResponse = todaysTasks.length > 0
          ? `Here's your plan for today:\n${todaysTasks.map(t => `- ${t.description} (Priority: ${t.priority})`).join('\n')}`
          : "You don't have any tasks scheduled for today.";
        break;

      case 'taskStats':
        const completedTasks = await Task.countDocuments({ completed: true });
        const pendingTasks = await Task.countDocuments({ completed: false });
        const totalTimeSpent = await Task.aggregate([
          { $group: { _id: null, total: { $sum: "$timeSpent" } } }
        ]);
        dbResponse = `Here are your task statistics:\n` +
          `Completed tasks: ${completedTasks}\n` +
          `Pending tasks: ${pendingTasks}\n` +
          `Total time spent on tasks: ${totalTimeSpent[0]?.total || 0} minutes`;
        break;

      default:
        dbResponse = "I'm not sure how to handle that request.";
    }

    res.json({ message: `${claudeResponse.response}\n\n${dbResponse}` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
});


app.get('/api/summary', async (req, res) => {
  try {
    const claudeSummary = await getClaudeSummary();
    res.json({ summary: claudeSummary.content[0].text });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred while fetching the summary.' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));