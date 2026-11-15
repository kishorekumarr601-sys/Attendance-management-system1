import React, { useMemo, useState } from 'react';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { CircularAudience } from '../data/types';
import { useApp } from '../store/AppContext';
import { formatDisplayDate, toDateKey } from '../utils/date';

export const CircularsPage: React.FC = () => {
  const { state, dispatch, session, showToast } = useApp();
  const isAdmin = session?.role === 'admin';

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<CircularAudience>('All');
  const [error, setError] = useState('');

  const visibleCirculars = useMemo(() => {
    if (isAdmin) return state.circulars;
    if (session?.role === 'faculty') {
      return state.circulars.filter((c) => c.audience === 'All' || c.audience === 'Staff');
    }
    return state.circulars.filter((c) => c.audience === 'All' || c.audience === 'Students');
  }, [state.circulars, isAdmin, session?.role]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and circular message are required.');
      return;
    }
    setError('');
    dispatch({
      type: 'ADD_CIRCULAR',
      payload: {
        title: title.trim(),
        message: message.trim(),
        date: toDateKey(),
        audience,
      },
    });
    setTitle('');
    setMessage('');
    showToast('Circular sent', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="erp-card p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#D4A017]" />
            Circulars & Official Alerts
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            {visibleCirculars.length} published notice(s) for {state.settings.institutionName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <section className="erp-card p-5 space-y-4 h-fit">
            <h3 className="text-base font-bold text-[#7A0000]">Publish New Circular</h3>
            <form onSubmit={handleSend} className="space-y-3" noValidate>
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="circ-title">
                  Title
                </label>
                <input
                  id="circ-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Internal Assessment Schedule"
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="circ-aud">
                  Audience
                </label>
                <select
                  id="circ-aud"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as CircularAudience)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
                >
                  <option value="All">All (Staff & Students)</option>
                  <option value="Staff">Staff Only</option>
                  <option value="Students">Students Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="circ-msg">
                  Message
                </label>
                <textarea
                  id="circ-msg"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write official notice details..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>

              {error && <p className="text-xs font-semibold text-[#C0000C]">{error}</p>}

              <button
                type="submit"
                className="btn-gold w-full py-2.5 min-h-[44px] text-xs inline-flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Send Circular
              </button>
            </form>
          </section>
        )}

        <section className={`erp-card p-5 space-y-3 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className="text-base font-bold text-[#7A0000]">Published Circulars</h3>
          {visibleCirculars.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#5A0000] bg-[#FFF5F5] rounded-xl">
              No circulars published yet.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleCirculars.map((c) => (
                <article
                  key={c.id}
                  className="p-4 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-[#7A0000]">{c.title}</h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#7A0000] text-[#FFD700] text-[10px] font-bold">
                          {c.audience}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5A0000] mt-0.5">
                        Published on {formatDisplayDate(c.date)}
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'DELETE_CIRCULAR', payload: c.id });
                          showToast('Circular deleted', 'info');
                        }}
                        aria-label={`Delete circular ${c.title}`}
                        className="w-9 h-9 rounded-full hover:bg-[#C0000C]/10 text-[#C0000C] flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#333333] leading-relaxed">{c.message}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
