'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import toast, { Toaster } from 'react-hot-toast';
import { FaCalendarAlt, FaList, FaTachometerAlt, FaRobot, FaPlus, FaEdit, FaTrash, FaGoogle } from 'react-icons/fa';

interface Event {
  id: string;
  date: string;
  time: string;
  title: string;
  description?: string;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'dashboard' | 'calendar' | 'events' | 'suggestions'>('dashboard');
  const [newEvent, setNewEvent] = useState({ time: '', title: '', description: '' });
  const [editing, setEditing] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000); // poll every 10s for real-time
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    const res = await fetch('/api/schedule');
    const data = await res.json();
    setEvents(data);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentDate = now.toDateString();
      const currentTime = now.toTimeString().slice(0, 5);
      events.forEach(event => {
        if (event.date === currentDate && event.time === currentTime) {
          toast(`Reminder: ${event.title}`, { icon: '🔔' });
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [events]);

  const addEvent = async () => {
    if (!newEvent.time || !newEvent.title) return;
    const event: Event = {
      id: Date.now().toString(),
      date: selectedDate.toDateString(),
      time: newEvent.time,
      title: newEvent.title,
      description: newEvent.description,
    };
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (res.ok) {
      fetchEvents();
      setNewEvent({ time: '', title: '', description: '' });
      toast.success('Event added!');
    }
  };

  const deleteEvent = async (id: string) => {
    const res = await fetch('/api/schedule', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      fetchEvents();
      toast.success('Event deleted!');
    }
  };

  const editEvent = (event: Event) => {
    setEditing(event);
    setNewEvent({ time: event.time, title: event.title, description: event.description || '' });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const updated = { ...editing, time: newEvent.time, title: newEvent.title, description: newEvent.description };
    const res = await fetch('/api/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      fetchEvents();
      setEditing(null);
      setNewEvent({ time: '', title: '', description: '' });
      toast.success('Event updated!');
    }
  };

  const eventsOnDate = events.filter(e => e.date === selectedDate.toDateString());
  const upcomingEvents = events.filter(e => new Date(e.date + ' ' + e.time) > new Date()).sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()).slice(0, 5);

  const aiSuggestions = () => {
    const suggestions = [];
    const today = new Date().toDateString();
    const todayEvents = events.filter(e => e.date === today);
    if (todayEvents.length === 0) suggestions.push("No events today - consider adding shop opening tasks.");
    if (!todayEvents.some(e => e.title.toLowerCase().includes('inventory'))) suggestions.push("Suggest checking fabric inventory.");
    return suggestions;
  };

  const addToGoogleCalendar = (event: Event) => {
    const start = new Date(event.date + ' ' + event.time);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description || '')}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster />
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white p-4">
        <h1 className="text-2xl font-bold mb-8">FabricShop CRM</h1>
        <nav>
          <button onClick={() => setView('dashboard')} className={`flex items-center w-full p-3 mb-2 rounded ${view === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-800'}`}>
            <FaTachometerAlt className="mr-3" /> Dashboard
          </button>
          <button onClick={() => setView('calendar')} className={`flex items-center w-full p-3 mb-2 rounded ${view === 'calendar' ? 'bg-blue-700' : 'hover:bg-blue-800'}`}>
            <FaCalendarAlt className="mr-3" /> Calendar
          </button>
          <button onClick={() => setView('events')} className={`flex items-center w-full p-3 mb-2 rounded ${view === 'events' ? 'bg-blue-700' : 'hover:bg-blue-800'}`}>
            <FaList className="mr-3" /> Events
          </button>
          <button onClick={() => setView('suggestions')} className={`flex items-center w-full p-3 mb-2 rounded ${view === 'suggestions' ? 'bg-blue-700' : 'hover:bg-blue-800'}`}>
            <FaRobot className="mr-3" /> AI Suggestions
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {view === 'dashboard' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">Total Events</h3>
                <p className="text-3xl font-bold text-blue-600">{events.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">Today's Events</h3>
                <p className="text-3xl font-bold text-green-600">{eventsOnDate.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">Upcoming</h3>
                <p className="text-3xl font-bold text-purple-600">{upcomingEvents.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Upcoming Events</h3>
              <ul>
                {upcomingEvents.map(event => (
                  <li key={event.id} className="flex justify-between items-center py-2 border-b">
                    <span>{event.date} {event.time} - {event.title}</span>
                    <div>
                      <button onClick={() => editEvent(event)} className="text-blue-500 mr-2"><FaEdit /></button>
                      <button onClick={() => deleteEvent(event.id)} className="text-red-500 mr-2"><FaTrash /></button>
                      <button onClick={() => addToGoogleCalendar(event)} className="text-green-500"><FaGoogle /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Calendar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Calendar
                  onChange={(value) => setSelectedDate(value as Date)}
                  value={selectedDate}
                  tileContent={({ date }) => {
                    const dayEvents = events.filter(e => e.date === date.toDateString());
                    return dayEvents.length > 0 ? <div className="text-xs bg-blue-200 rounded p-1 mt-1">{dayEvents.length}</div> : null;
                  }}
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Events for {selectedDate.toDateString()}</h3>
                <ul>
                  {eventsOnDate.map(event => (
                    <li key={event.id} className="flex justify-between items-center py-2 border-b">
                      <span>{event.time} - {event.title}</span>
                      <div>
                        <button onClick={() => editEvent(event)} className="text-blue-500 mr-2"><FaEdit /></button>
                        <button onClick={() => deleteEvent(event.id)} className="text-red-500 mr-2"><FaTrash /></button>
                        <button onClick={() => addToGoogleCalendar(event)} className="text-green-500"><FaGoogle /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {view === 'events' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Manage Events</h2>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-semibold mb-4">{editing ? 'Edit Event' : 'Add New Event'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="border p-3 rounded"
                  placeholder="Time"
                />
                <input
                  type="text"
                  placeholder="Event Title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="border p-3 rounded"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="border p-3 rounded"
                />
              </div>
              {editing ? (
                <div>
                  <button onClick={saveEdit} className="bg-green-500 text-white px-6 py-3 rounded mr-2"><FaEdit className="inline mr-2" />Save Changes</button>
                  <button onClick={() => { setEditing(null); setNewEvent({ time: '', title: '', description: '' }); }} className="bg-gray-500 text-white px-6 py-3 rounded">Cancel</button>
                </div>
              ) : (
                <button onClick={addEvent} className="bg-blue-500 text-white px-6 py-3 rounded"><FaPlus className="inline mr-2" />Add Event</button>
              )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">All Events</h3>
              <ul>
                {events.map(event => (
                  <li key={event.id} className="flex justify-between items-center py-3 border-b">
                    <div>
                      <strong>{event.date} {event.time}</strong> - {event.title}
                      {event.description && <p className="text-gray-600">{event.description}</p>}
                    </div>
                    <div>
                      <button onClick={() => editEvent(event)} className="text-blue-500 mr-3"><FaEdit /></button>
                      <button onClick={() => deleteEvent(event.id)} className="text-red-500 mr-3"><FaTrash /></button>
                      <button onClick={() => addToGoogleCalendar(event)} className="text-green-500"><FaGoogle /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {view === 'suggestions' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">AI Suggestions</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
              <ul>
                {aiSuggestions().map((sug, i) => (
                  <li key={i} className="py-2 border-b text-gray-700">{sug}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
