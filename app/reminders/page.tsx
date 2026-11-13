'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Reminder } from '@/types';
import {
  Bell,
  Plus,
  Trash2,
  Clock,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function RemindersPage() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_name: medicineName,
          dosage,
          frequency,
          reminder_time: reminderTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setMedicineName('');
      setDosage('');
      setFrequency('Daily');
      setReminderTime('08:00');
      setShowAddModal(false);
      fetchReminders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReminder = async (id: number) => {
    if (!confirm('Are you sure you want to remove this reminder?')) return;
    try {
      const res = await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReminders(reminders.filter((r) => r.reminder_id !== id));
      }
    } catch (err) {
      alert('Failed to delete reminder.');
    }
  };

  const getTimeCategory = (timeStr: string) => {
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour >= 5 && hour < 12) {
      return {
        label: 'Morning',
        icon: <Sunrise className="w-4 h-4 text-amber-500" />,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        label: 'Afternoon',
        icon: <Sun className="w-4 h-4 text-amber-600" />,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    if (hour >= 17 && hour < 21) {
      return {
        label: 'Evening',
        icon: <Sunset className="w-4 h-4 text-teal-600" />,
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
      };
    }
    return {
      label: 'Night',
      icon: <Moon className="w-4 h-4 text-indigo-500" />,
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  };

  const formatTime12h = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Medicine Reminders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personal dosage schedules, daily medication alerts, and one-click local stock refills
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Reminder
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No dosage reminders scheduled</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Schedule daily reminders for your recurring prescriptions, vitamins, and supplements to never miss a dose.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition"
            >
              Create First Reminder
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reminders.map((r) => {
            const timeCat = getTimeCategory(r.reminder_time);
            return (
              <div
                key={r.reminder_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${timeCat.badgeClass}`}
                    >
                      {timeCat.icon}
                      {timeCat.label}
                    </span>

                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {r.frequency || 'Daily'}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900">{r.medicine_name}</h3>
                  {r.dosage && (
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Dosage: <span className="text-slate-700">{r.dosage}</span>
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-teal-700 font-extrabold text-xl">
                    <Clock className="w-5 h-5 text-teal-600" />
                    {formatTime12h(r.reminder_time)}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* ONE-CLICK: Check Local Stock Refill */}
                  <Link
                    href={`/?q=${encodeURIComponent(r.medicine_name.split(' ')[0])}`}
                    className="flex-1 text-center py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold border border-teal-200 transition flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Check Local Stock
                  </Link>

                  <button
                    onClick={() => handleDeleteReminder(r.reminder_id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Delete Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" /> Add Medicine Reminder
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medicine Name
                </label>
                <input
                  type="text"
                  required
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g. Paracetamol 500mg, Metformin..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dosage / Instructions
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 1 tablet after food, 2 drops..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Twice a day">Twice a day</option>
                    <option value="Thrice a day">Thrice a day</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    required
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Set Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
