# Taskly 🗒️
A chatbot that keeps track of your tasks, meetings, deadlines and more

![Screenshot 2024-12-26 at 3 50 24 PM](https://github.com/user-attachments/assets/8803bac0-9844-4adb-83bb-78b732a8779e)


Use plain english text to add new tasks, reminders or meetings. No need to set the date or exact time, simply write it and taskly will do it for you.
Taskly is smart, it greets you every morning with a message summarising your tasks and deadlines for the day. You can view your tasks in a calendar view, list view or just tell Taskly to list out the tasks remaining. 

Never have to worry about missing another deadline, because Taskly has got you covered!

## Tech Stack

- ReactJS
- NodeJS/ExpressJS
- MongoDB
- Claude API

## Features
### Natural Language Task Management

![Screenshot 2024-12-26 at 3 52 16 PM](https://github.com/user-attachments/assets/257949dc-3c2c-4d2e-a548-6a3ebe153685)

Add tasks using conversational language
Automatic date and priority detection

![Screenshot 2024-12-26 at 4 04 44 PM](https://github.com/user-attachments/assets/c018501c-433d-4dd2-a8f0-06ed7ed7e5cc)

Smart categorization of tasks
Flexible due date interpretation



## Interactive Calendar

![Screenshot 2024-12-26 at 4 17 16 PM](https://github.com/user-attachments/assets/64822f4f-643e-4d6c-a602-6f2d4eda5bd9)

Multiple view options (Day, Week, Month)
Color-coded tasks by priority
Drag-and-drop task management
Visual task distribution overview

## Smart Dashboard
![Screenshot 2024-12-26 at 3 52 16 PM](https://github.com/user-attachments/assets/655e271a-c878-4ae1-8be4-511167316b16)

Daily task summary
Progress tracking
Task statistics
Morning briefings with motivational quotes

## Task Organization and Storage

Priority levels (High, Medium, Low)
Task categorization
Status tracking
Time spent monitoring
Prompts get stored in database and can be retreived

## Getting Started
### Prerequisites

Node.js (v14 or higher)
MongoDB
Anthropic API key
npm or yarn

### Installation

Clone the repository

`git clone https://github.com/yourusername/taskly.git
cd taskly`

Install dependencies for backend

`npm install -r requirements.txt`

Install dependencies for frontend

`cd client
npm install`

Start the backend server

`node api.js`

Start the frontend development server

`cd client
npm start`

## Usage Examples
### Adding Tasks
Simply type natural language commands like:

- "Add a meeting with John tomorrow at 2pm"
- "Remind me to submit the report by Friday"
- "Schedule dentist appointment for next Tuesday"

### Viewing Tasks

- "Show me my tasks for today"
- "What's due this week?"
- "List all high priority tasks"

## Contributing

1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

## Acknowledgments

Frontend built with ReactJS and TaliwindCSS
Backend built with MongoDB, ExpressJS, NodeJS
Calendar functionality powered by FullCalendar API
AI capabilities powered by Anthropic's Claude API
