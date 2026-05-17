import React, { useState, useEffect } from 'react';

// --- TYPES ---
type ViewMode = 'day' | 'week' | 'month' | 'year' | 'timetable';
type Priority = 'high' | 'medium' | 'low';

interface User {
  name: string;
  designation: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  priority: Priority;
  isCompleted: boolean;
}

interface TimetableSlot {
  id: string;
  day: string; // e.g., "Monday"
  subject: string;
  time: string;
}

export default function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [loginName, setLoginName] = useState('');
  const [loginDesignation, setLoginDesignation] = useState('');

  // --- APP STATE ---
  const [currentView, setCurrentView] = useState<ViewMode>('month');
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Submit Engineering Thesis Proposal', description: 'Final draft adjustments', date: '2026-05-18', time: '10:00', priority: 'high', isCompleted: false },
    { id: '2', title: 'Pick up groceries', description: 'Milk and eggs', date: '2026-05-18', time: '17:30', priority: 'low', isCompleted: true },
    { id: '3', title: 'UI Layout Review', description: 'Check responsive panels', date: '2026-05-20', time: '14:00', priority: 'medium', isCompleted: false }
  ]);
  
  const [timetable, setTimetable] = useState<TimetableSlot[]>([
    { id: 't1', day: 'Monday', subject: 'Advanced Mathematics', time: '09:00 - 10:30' },
    { id: 't2', day: 'Monday', subject: 'Machine Learning Lab', time: '11:00 - 13:00' },
    { id: 't3', day: 'Wednesday', subject: 'Software Architecture', time: '10:00 - 11:30' }
  ]);

  // --- CRUD MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDate, setTaskDate] = useState('2026-05-18');
  const [taskTime, setTaskTime] = useState('09:00');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');

  // --- AI STATE ---
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiChat, setAiChat] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: "Hi! Ask me anything about your upcoming schedule, or say 'Give me a briefing'." }
  ]);

  // --- PERSISTENT LOGIN CHECK ---
  useEffect(() => {
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName || !loginDesignation) return;
    const newUser = { name: loginName, designation: loginDesignation };
    localStorage.setItem('app_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('app_user');
    setUser(null);
  };

  // --- TASK ACTIONS ---
  const openAddModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDate('2026-05-18');
    setTaskTime('09:00');
    setTaskPriority('medium');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description);
    setTaskDate(task.date);
    setTaskTime(task.time);
    setTaskPriority(task.priority);
    setIsModalOpen(true);
  };

  const saveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      // Edit existing
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, title: taskTitle, description: taskDesc, date: taskDate, time: taskTime, priority: taskPriority } : t));
    } else {
      // Add new
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskTitle,
        description: taskDesc,
        date: taskDate,
        time: taskTime,
        priority: taskPriority,
        isCompleted: false
      };
      setTasks([...tasks, newTask]);
    }
    setIsModalOpen(false);
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  // --- DEMO AI IMPLEMENTATION (TEXT + AUDIO OUT) ---
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAiQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const userMsg = aiQuery;
    setAiChat(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAiQuery('');

    // Simulated Deterministic Rule Engine acting as our local fast AI processor
    setTimeout(() => {
      let responseText = `I processed your request, ${user?.name || 'User'}. `;
      const queryLower = userMsg.toLowerCase();

      if (queryLower.includes('briefing') || queryLower.includes('schedule') || queryLower.includes('tomorrow') || queryLower.includes('monday')) {
        const highTasks = tasks.filter(t => t.priority === 'high' && !t.isCompleted);
        const mondayClasses = timetable.filter(t => t.day === 'Monday');
        
        responseText = `Here is your status update. You have ${highTasks.length} urgent high-priority tasks remaining. Namely, "${highTasks[0]?.title || 'none'}". Your Monday includes ${mondayClasses.length} sessions starting with ${mondayClasses[0]?.subject || 'nothing scheduled'}.`;
      } else if (queryLower.includes('timetable') || queryLower.includes('classes')) {
        responseText = `Your current recurring timetable lists ${timetable.length} active instances. You have classes structured on Mondays and Wednesdays.`;
      } else {
        responseText = `I analyzed your active dashboard database. Everything looks clean. You have ${tasks.filter(t => !t.isCompleted).length} total open items. Let me know if you need me to adjust your timetable!`;
      }

      setAiChat(prev => [...prev, { sender: 'ai', text: responseText }]);
      speakText(responseText); // Direct audio feedback trigger
    }, 600);
  };

  // --- LOGIN SCREEN CONDITIONAL ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-indigo-600 mx-auto flex items-center justify-center text-white font-bold text-xl mb-3">⚡</div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome to FocusPlan</h2>
            <p className="text-slate-500 text-sm mt-1">Configure your workspace workspace profiles</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
              <input type="text" required placeholder="John Doe" value={loginName} onChange={e => setLoginName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Designation</label>
              <input type="text" required placeholder="e.g., Engineering Student / Product Owner" value={loginDesignation} onChange={e => setLoginDesignation(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg text-sm shadow-sm hover:bg-indigo-700 transition duration-150">
              Initialize Profile & Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN APP COMPONENT ---
  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 font-sans overflow-hidden select-none">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 flex-shrink-0">
        <div>
          <div className="flex items-center space-x-3 mb-6 px-1">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">FP</div>
            <span className="text-lg font-bold tracking-tight text-slate-900">FocusPlan</span>
          </div>

          <button onClick={openAddModal} className="w-full bg-indigo-600 text-white rounded-lg py-2.5 px-4 font-medium text-sm shadow-sm hover:bg-indigo-700 transition mb-6">
            + New Event / Task
          </button>

          <nav className="space-y-1">
            {(['day', 'week', 'month', 'year', 'timetable'] as ViewMode[]).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`w-full text-left capitalize px-3 py-2 rounded-md text-sm font-medium transition flex items-center justify-between ${
                  currentView === view ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{view} Planner</span>
                {view === 'timetable' && <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{timetable.length}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Card / Logout Container */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.designation}</p>
          </div>
          <button onClick={handleLogout} title="Sign Out" className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition">
            🚪
          </button>
        </div>
      </aside>

      {/* 2. CENTER CONTENT ARCHITECTURE (GOOGLE CALENDAR STYLE GRID) */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold capitalize text-slate-900">{currentView} Engine Overview</h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">System Functional</span>
          </div>
          <div className="text-sm text-slate-500 font-medium">May 2026</div>
        </header>

        {/* Main Interface Content Router */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* MONTH PLANNER GRID (Google Calendar Layout Mock) */}
          {currentView === 'month' && (
            <div className="h-full flex flex-col">
              <div className="grid grid-cols-7 gap-px bg-slate-200 text-center text-xs font-semibold text-slate-500 pb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-2 bg-white">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-b-xl overflow-hidden border border-slate-200 flex-1">
                {Array.from({ length: 35 }).map((_, i) => {
                  const dayNum = i - 3; // Offset mockup configuration
                  const dateStr = `2026-05-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                  const dayTasks = tasks.filter(t => t.date === dateStr);

                  return (
                    <div key={i} className="bg-white p-2 min-h-[90px] flex flex-col justify-between group hover:bg-slate-50 transition relative">
                      <span className={`text-xs font-bold ${dayNum === 18 ? 'bg-indigo-600 text-white h-5 w-5 rounded-full flex items-center justify-center' : 'text-slate-400'}`}>
                        {dayNum > 0 && dayNum <= 31 ? dayNum : ''}
                      </span>
                      
                      <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[60px]">
                        {dayNum > 0 && dayTasks.map(task => (
                          <div 
                            key={task.id}
                            onClick={() => openEditModal(task)}
                            className={`text-[11px] p-1 rounded border font-medium truncate cursor-pointer transition shadow-2xs ${
                              task.isCompleted ? 'bg-slate-100 text-slate-400 line-through border-slate-200' :
                              task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200 border-l-4 border-l-red-500' :
                              task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200 border-l-4 border-l-amber-500' :
                              'bg-blue-50 text-blue-700 border-blue-200 border-l-4 border-l-blue-500'
                            }`}
                          >
                            {task.time} {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAY PLANNER VIEW */}
          {currentView === 'day' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-lg font-bold text-slate-800">Monday, May 18, 2026</h3>
              </div>
              <div className="space-y-2">
                {['09:00', '10:00', '11:00', '12:00', '14:00', '17:00'].map(hour => {
                  const hourTasks = tasks.filter(t => t.date === '2026-05-18' && t.time.startsWith(hour.substring(0,2)));
                  return (
                    <div key={hour} className="flex items-start space-x-4 py-3 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-400 w-12 pt-0.5">{hour}</span>
                      <div className="flex-1 space-y-1">
                        {hourTasks.length === 0 ? <div className="text-xs text-slate-300 italic">No scheduled task items</div> : 
                          hourTasks.map(t => (
                            <div key={t.id} onClick={() => openEditModal(t)} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:border-indigo-300 transition">
                              <div>
                                <h4 className={`text-sm font-semibold ${t.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.title}</h4>
                                <p className="text-xs text-slate-500">{t.description}</p>
                              </div>
                              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${t.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-200'}`}>{t.priority}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK PLANNER VIEW */}
          {currentView === 'week' && (
            <div className="grid grid-cols-7 gap-4 h-full">
              {['Sun 17', 'Mon 18', 'Tue 19', 'Wed 20', 'Thu 21', 'Fri 22', 'Sat 23'].map((day, dIdx) => {
                const targetDayStr = `2026-05-${17 + dIdx}`;
                const dayTasks = tasks.filter(t => t.date === targetDayStr);
                return (
                  <div key={day} className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex flex-col">
                    <span className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-2 mb-2 block text-center">{day}</span>
                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {dayTasks.map(t => (
                        <div key={t.id} onClick={() => openEditModal(t)} className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs text-xs cursor-pointer hover:border-indigo-400 transition">
                          <p className="font-semibold text-slate-800 truncate">{t.title}</p>
                          <span className="text-[10px] text-slate-400">{t.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* YEAR PLANNER VIEW */}
          {currentView === 'year' && (
            <div className="grid grid-cols-4 gap-6">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                <div key={month} className="border border-slate-200 rounded-lg p-3 bg-white">
                  <h4 className="text-xs font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">{month} 2026</h4>
                  <div className="grid grid-cols-7 gap-1 text-[9px] text-center text-slate-400">
                    {Array.from({ length: 28 }).map((_, d) => (
                      <span key={d} className={`p-0.5 rounded-xs ${idx === 4 && d === 17 ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-100'}`}>{d + 1}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TIMETABLE VIEW */}
          {currentView === 'timetable' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Master Class & Shift Timetable</h3>
                  <p className="text-xs text-slate-500">Your layout configuration for recurring weekly timelines</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold text-slate-600 border-b border-slate-200">
                      <th className="p-4">Day of Week</th>
                      <th className="p-4">Subject / Block Session</th>
                      <th className="p-4">Duration Interval</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100">
                    {timetable.map(slot => (
                      <tr key={slot.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-semibold text-slate-700">{slot.day}</td>
                        <td className="p-4"><span className="bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-md text-xs">{slot.subject}</span></td>
                        <td className="p-4 text-slate-500 font-mono text-xs">{slot.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 3. RIGHT PANEL (DUAL-PURPOSE TO-DO LIST & INTEGRATED AI PANEL) */}
      <aside className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col justify-between flex-shrink-0">
        
        {/* TO DO ELEMENT CHECKLIST */}
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">To-Do Trackers</h3>
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {tasks.map(task => (
              <div key={task.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-start space-x-2 shadow-3xs group">
                <input type="checkbox" checked={task.isCompleted} onChange={() => toggleTaskCompletion(task.id)} className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"/>
                <div className="flex-1 min-w-0" onClick={() => openEditModal(task)}>
                  <p className={`text-xs font-semibold truncate cursor-pointer ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                  <span className="text-[10px] text-slate-400 block font-mono">{task.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI DRAWER INTERACTION HUB */}
        <div className="border-t border-slate-200 bg-white p-4 h-72 flex flex-col justify-between shadow-lg relative">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">✨ AI Assistant Engine</span>
            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">TTS ACTIVE</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 mb-2 text-xs pr-1">
            {aiChat.map((msg, i) => (
              <div key={i} className={`p-2.5 rounded-lg max-w-[85%] ${msg.sender === 'user' ? 'bg-indigo-600 text-white ml-auto' : 'bg-slate-100 text-slate-700'}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleAiQuery} className="flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="Ask about schedule..." 
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 px-3 rounded-lg text-xs shadow-xs transition">
              ➔
            </button>
          </form>
        </div>
      </aside>

      {/* 4. CRUD ADD/EDIT DYNAMIC TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900">{editingTask ? 'Modify Active Event' : 'Add Calendar Entry'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={saveTask} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Title</label>
                <input type="text" required value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="w-full p-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea rows={2} value={taskDesc} onChange={e => setTaskDesc(e.target.value)} className="w-full p-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Target Date</label>
                  <input type="date" required value={taskDate} onChange={e => setTaskDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Time Block</label>
                  <input type="time" required value={taskTime} onChange={e => setTaskTime(e.target.value)} className="w-full p-2 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 outline-none"/>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Visual Priority Highlight</label>
                <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as Priority)} className="w-full p-2 border border-slate-200 rounded-md text-xs bg-white outline-none">
                  <option value="low">Low (Blue Accent)</option>
                  <option value="medium">Medium (Amber Accent)</option>
                  <option value="high">High Urgent (Red Accent)</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 shadow-sm">Save Parameters</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}