import React, { useState, useEffect } from 'react';
import { Shift } from '../../data/types';
import { X, Save } from 'lucide-react';

interface ShiftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift;
  briefing: string;
  onSave: (data: Partial<Shift> & { briefing: string }) => void;
}

export const ShiftEditModal: React.FC<ShiftEditModalProps> = ({ isOpen, onClose, shift, briefing, onSave }) => {
  const [formData, setFormData] = useState({
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    briefing: ''
  });

  useEffect(() => {
    if (shift && isOpen) {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      
      setFormData({
        location: shift.location,
        date: start.toISOString().split('T')[0],
        startTime: start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        endTime: end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        briefing: briefing
      });
    }
  }, [shift, briefing, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Reconstruct ISO strings
    const datePart = formData.date;
    const startIso = `${datePart}T${formData.startTime}:00`;
    
    // Handle overnight logic simply for demo (if end < start, assume next day)
    let endIso = `${datePart}T${formData.endTime}:00`;
    if (formData.endTime < formData.startTime) {
       const nextDay = new Date(new Date(datePart).getTime() + 86400000).toISOString().split('T')[0];
       endIso = `${nextDay}T${formData.endTime}:00`;
    }

    onSave({
      location: formData.location,
      startTime: startIso,
      endTime: endIso,
      briefing: formData.briefing
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-bold text-white">Shift Bewerken</h3>
           <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
           {/* Read Only Client */}
           <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Klant (Niet wijzigbaar)</label>
              <div className="bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-400 cursor-not-allowed">
                 {shift.clientName}
              </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Locatie</label>
              <input 
                 type="text" 
                 value={formData.location}
                 onChange={e => setFormData({...formData, location: e.target.value})}
                 className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-apex-gold outline-none"
              />
           </div>

           <div className="grid grid-cols-3 gap-4">
              <div>
                 <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Datum</label>
                 <input 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-apex-gold outline-none"
                 />
              </div>
              <div>
                 <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Start</label>
                 <input 
                    type="time" 
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-apex-gold outline-none"
                 />
              </div>
              <div>
                 <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Eind</label>
                 <input 
                    type="time" 
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-apex-gold outline-none"
                 />
              </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Briefing & Instructies</label>
              <textarea 
                 value={formData.briefing}
                 onChange={e => setFormData({...formData, briefing: e.target.value})}
                 className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-apex-gold outline-none h-24"
              />
           </div>

           <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800">
              <button 
                 onClick={handleSave}
                 className="flex-1 bg-apex-gold hover:bg-yellow-500 text-black font-bold py-2 rounded flex items-center justify-center gap-2"
              >
                 <Save className="w-4 h-4" /> Opslaan
              </button>
              <button 
                 onClick={onClose}
                 className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded"
              >
                 Annuleren
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};