import React, { useState, useEffect } from 'react';
import { Send, Calendar, BarChart } from 'lucide-react';
import './App.css';
import { Input } from "./components/ui/input"
import { Button } from "./components/ui/button"
import { Card, CardHeader, CardContent } from "./components/ui/card"
import FullCalendar from '@fullcalendar/react'; // Import FullCalendar Component
import dayGridPlugin from '@fullcalendar/daygrid'; // Include the fullcalendar day grid plugin

const ChatbotInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [view, setView] = useState('dashboard'); // State to control sidebar view
  const [summary, setSummary] = useState('');

  useEffect(() => {
    // fetchTasks();
    // fetchStats();
    fetchSummary();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'list tasks' }),
      });
      const data = await response.json();
      setTasks(parseTasks(data.message));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'task statistics' }),
      });
      const data = await response.json();
      setStats(parseStats(data.message));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/summary', {
        method: 'GET', // Change to GET
      });
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };
  

  const parseTasks = (message) => {
    return message.split('\n').slice(1).map(task => {
      const match = task.match(/- (.*) \(Due: (.*), Priority: (.*)\)/);
      return match ? { description: match[1], dueDate: match[2], priority: match[3] } : null;
    }).filter(task => task !== null);
  };

  const parseStats = (message) => {
    const lines = message.split('\n');
    return {
      completed: parseInt(lines[1].split(': ')[1]),
      pending: parseInt(lines[2].split(': ')[1]),
      timeSpent: parseInt(lines[3].split(': ')[1])
    };
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const newMessages = [...messages, { text: input, sender: 'user' }];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();

      const newMessagesWithBot = [...newMessages, { text: data.message, sender: 'bot' }];
      setMessages(newMessagesWithBot);
      
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setMessages([...newMessages, { text: 'Sorry, there was an error processing your request.', sender: 'bot' }]);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-100 p-4">
        <div className="space-y-4">
          <Button onClick={() => setView('dashboard')} className="w-full">
            Dashboard
          </Button>
          <Button onClick={() => setView('calendar')} className="w-full">
            Calendar
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-4">
        {view === 'dashboard' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Dashboard</h2>
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Task Summary</h3>
              </CardHeader>
              <CardContent>
                <p>{summary}</p> {/* Display AI-generated summary */}
              </CardContent>
            </Card>
            <div className="flex space-x-4 mt-4">
              <Button onClick={() => setView('day')}>Day</Button>
              <Button onClick={() => setView('week')}>Week</Button>
              <Button onClick={() => setView('month')}>Month</Button>
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Calendar</h2>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={tasks.map(task => ({
                title: task.description,
                date: task.dueDate,
              }))}
            />
          </div>
        )}

        {/* Existing Chat Interface */}
        <div className="flex-grow overflow-auto mb-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Tasks</h3>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5">
                  {tasks.map((task, index) => (
                    <li key={index} className={`mb-2 ${task.priority === 'high' ? 'text-red-500' : (task.priority === 'low' ? 'text-green-500' : '')}`}>
                      {task.description} (Due: {task.dueDate})
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Statistics</h3>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div>
                    <p>Completed tasks: {stats.completed}</p>
                    <p>Pending tasks: {stats.pending}</p>
                    <p>Total time spent: {stats.timeSpent} minutes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg p-2 max-w-xs ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="flex space-x-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            // onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-grow"
          />
          <Button onClick={sendMessage}>
            <Send size={20} />
          </Button>
          <Button onClick={() => sendMessage('plan my day')}>
            <Calendar size={20} />
          </Button>
          <Button onClick={() => sendMessage('task statistics')}>
            <BarChart size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface;
