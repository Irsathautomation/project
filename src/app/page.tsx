'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [newEvent, setNewEvent] = useState({ time: '', title: '', description: '' });
  const [editing, setEditing] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const res = await fetch('/api/schedule');
    const data = await res.json();
    setEvents(data);
  };

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
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description || '')}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-8">FabricShop Day Planner</h1>
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex justify-center">
          <button onClick={() => setView('daily')} className={`px-4 py-2 ${view === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Daily</button>
          <button onClick={() => setView('weekly')} className={`px-4 py-2 ${view === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Weekly</button>
        </div>

        {view === 'daily' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Calendar</h2>
              <Calendar
                onChange={(value) => setSelectedDate(value as Date)}
                value={selectedDate}
                tileContent={({ date }) => {
                  const dayEvents = events.filter(e => e.date === date.toDateString());
                  return dayEvents.length > 0 ? <div className="text-xs bg-blue-200 rounded p-1">{dayEvents.length}</div> : null;
                }}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Events for {selectedDate.toDateString()}</h2>
              <ul className="mb-4">
                {eventsOnDate.map(event => (
                  <li key={event.id} className="bg-white p-4 rounded shadow mb-2">
                    <div className="flex justify-between">
                      <span><strong>{event.time}</strong> - {event.title}</span>
                      <div>
                        <button onClick={() => editEvent(event)} className="text-blue-500 mr-2">Edit</button>
                        <button onClick={() => deleteEvent(event.id)} className="text-red-500 mr-2">Delete</button>
                        <button onClick={() => addToGoogleCalendar(event)} className="text-green-500">GCal</button>
                      </div>
                    </div>
                    {event.description && <p className="text-sm text-gray-600">{event.description}</p>}
                  </li>
                ))}
              </ul>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lg font-semibold mb-2">{editing ? 'Edit Event' : 'Add Event'}</h3>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="border p-2 mr-2 mb-2"
                />
                <input
                  type="text"
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="border p-2 mr-2 mb-2"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="border p-2 mr-2 mb-2"
                />
                {editing ? (
                  <button onClick={saveEdit} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Save</button>
                ) : (
                  <button onClick={addEvent} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Add</button>
                )}
                {editing && <button onClick={() => { setEditing(null); setNewEvent({ time: '', title: '', description: '' }); }} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>}
              </div>
            </div>
          </div>
        )}

        {view === 'weekly' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Weekly View</h2>
            {/* Simple weekly, show next 7 days */}
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const dayEvents = events.filter(e => e.date === date.toDateString());
              return (
                <div key={i} className="bg-white p-4 rounded shadow mb-2">
                  <h3 className="font-semibold">{date.toDateString()}</h3>
                  {dayEvents.map(event => (
                    <p key={event.id}>{event.time} - {event.title}</p>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Dashboard - Upcoming Events</h2>
          <ul>
            {upcomingEvents.map(event => (
              <li key={event.id} className="bg-white p-2 rounded shadow mb-1">
                {event.date} {event.time} - {event.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">AI Suggestions</h2>
          <ul>
            {aiSuggestions().map((sug, i) => (
              <li key={i} className="bg-yellow-100 p-2 rounded mb-1">{sug}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
