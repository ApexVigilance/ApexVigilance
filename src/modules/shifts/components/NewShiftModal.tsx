
import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, MapPin, Users, ShieldCheck, RefreshCw } from 'lucide-react';
import { useStore } from '../../../data/store';
import { Shift } from '../../../data/types';
import { useTranslation } from 'react-i18next';

interface NewShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewShiftModal: React.FC<NewShiftModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { clients, createShifts } = useStore();
  const [formData, setFormData] = useState({
    clientName: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    agentsNeeded: 1,
    requiredRole: 'Guard',
    briefing: '',
    recurring: false,
    recurringWeeks: 4
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.clientName || !formData.location) return;

    const startIso = `${formData.date}T${formData.startTime}:00`;
    let endIso = `${formData.date}T${formData.endTime}:00`;
    
    // Handle overnight
    if (formData.endTime < formData.startTime) {
       const d = new Date(formData.date);
       d.setDate(d.getDate() + 1);
       endIso = `${d.toISOString().split('T')[0]}T${formData.endTime}:00`;
    }

    const newShifts: Shift[] = [];
    const totalWeeks = formData.recurring ? formData.recurringWeeks : 1;

    for (let week = 0; week < totalWeeks; week++) {
      const groupId = `GRP-${Date.now()}-W${week}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const offsetMs = week * 7 * 24 * 60 * 60 * 1000;
      const weekStartIso = new Date(new Date(startIso).getTime() + offsetMs).toISOString().replace('Z', '').split('.')[0];
      const weekEndIso = new Date(new Date(endIso).getTime() + offsetMs).toISOString().replace('Z', '').split('.')[0];

      for (let i = 0; i < formData.agentsNeeded; i++) {
        newShifts.push({
          id: `SHIFT-${Date.now()}-W${week}-${i}`,
          groupId,
          clientName: formData.clientName,
          location: formData.location,
          startTime: weekStartIso,
          endTime: weekEndIso,
          employeeId: '',
          status: 'Scheduled',
          requiredRole: formData.requiredRole as any,
          briefing: formData.briefing
        });
      }
    }

    createShifts(newShifts);

    onClose();
    setFormData({
      clientName: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '16:00',
      agentsNeeded: 1,
      requiredRole: 'Guard',
      briefing: '',
      recurring: false,
      recurringWeeks: 4
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-apex-gold" /> Nieuwe Shift Inplannen
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Klant</label>
              <select 
                value={formData.clientName}
                onChange={e => setFormData({...formData, clientName: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white outline-none focus:border-apex-gold"
              >
                <option value="">Selecteer klant...</option>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Locatie</label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2 py-2 text-white outline-none focus:border-apex-gold"
                  placeholder="Locatie..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Datum</label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2 py-2 text-white outline-none focus:border-apex-gold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Aantal Agenten</label>
              <div className="relative">
                <Users className="absolute left-2 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="number" 
                  min="1" 
                  max="50"
                  value={formData.agentsNeeded}
                  onChange={e => setFormData({...formData, agentsNeeded: parseInt(e.target.value) || 1})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2 py-2 text-white outline-none focus:border-apex-gold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Starttijd</label>
              <div className="relative">
                <Clock className="absolute left-2 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="time" 
                  value={formData.startTime}
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2 py-2 text-white outline-none focus:border-apex-gold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Eindtijd</label>
              <div className="relative">
                <Clock className="absolute left-2 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="time" 
                  value={formData.endTime}
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2 py-2 text-white outline-none focus:border-apex-gold"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
             <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-apex-gold" /> Vereisten
             </h4>
             <div>
                <label className="block text-xs text-zinc-500 mb-1">Min. Rol</label>
                <select 
                   value={formData.requiredRole}
                   onChange={e => setFormData({...formData, requiredRole: e.target.value})}
                   className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm"
                >
                   <option value="Guard">{t('roles.guard')}</option>
                   <option value="Senior">{t('roles.senior')}</option>
                </select>
             </div>
          </div>

          {/* Recurring */}
          <div className="border-t border-zinc-800 pt-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.recurring}
                onChange={e => setFormData({...formData, recurring: e.target.checked})}
                className="accent-apex-gold w-4 h-4"
              />
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-apex-gold" />
                <span className="text-sm font-bold text-white">Herhalende shift (wekelijks)</span>
              </div>
            </label>
            {formData.recurring && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Aantal weken herhalen</label>
                <input
                  type="number"
                  min="2"
                  max="52"
                  value={formData.recurringWeeks}
                  onChange={e => setFormData({...formData, recurringWeeks: parseInt(e.target.value) || 4})}
                  className="w-32 bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  Maakt {formData.recurringWeeks} × {formData.agentsNeeded} = {formData.recurringWeeks * formData.agentsNeeded} shifts aan
                </p>
              </div>
            )}
          </div>

          <div>
             <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Briefing (Optioneel)</label>
             <textarea 
                value={formData.briefing}
                onChange={e => setFormData({...formData, briefing: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm focus:border-apex-gold h-20 outline-none resize-none"
                placeholder="Instructies voor de agent..."
             />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={!formData.clientName || !formData.location}
            className="w-full bg-apex-gold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded mt-4 transition-colors shadow-lg shadow-apex-gold/10"
          >
            Shift Inplannen
          </button>
        </div>
      </div>
    </div>
  );
};
