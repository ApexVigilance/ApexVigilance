import React, { useState, useMemo, useEffect } from 'react';
import { X, Clock, Save, User, MapPin, Search } from 'lucide-react';
import { useStore } from '../../../data/store';
import { TimeLog } from '../../../data/types';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface TerminalRegistrerenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TerminalRegistrerenModal: React.FC<TerminalRegistrerenModalProps> = ({ isOpen, onClose }) => {
  const { employees, shifts, timeLogs, addTimeLog, updateTimeLog } = useStore();
  const { t } = useTranslation();
  
  const [agentSearch, setAgentSearch] = useState('');
  const [shiftSearch, setShiftSearch] = useState('');
  const [showAllShifts, setShowAllShifts] = useState(false);

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [actionType, setActionType] = useState<'IN' | 'UIT'>('IN');
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [note, setNote] = useState('');

  const today = new Date().toISOString().split('T')[0];
  
  // Agents Search
  const filteredAgents = useMemo(() => {
      const q = agentSearch.toLowerCase();
      return employees.filter(e => 
          e.status === 'Active' && 
          (e.name.toLowerCase().includes(q) || (e.badgeNr && e.badgeNr.toLowerCase().includes(q)))
      );
  }, [employees, agentSearch]);

  // Enhanced Shift Filtering
  const availableShifts = useMemo(() => {
      const q = shiftSearch.toLowerCase();
      
      return shifts.filter(s => {
          // 1. If agent selected, filter by it. If not, only show if searching (or showAll is checked)
          if (selectedAgentId && s.employeeId !== selectedAgentId) return false;
          if (!selectedAgentId && !q && !showAllShifts) return false;

          // 2. Date Filter
          const isToday = s.startTime.startsWith(today);
          if (!showAllShifts && !isToday) return false;

          // 3. Search Filter
          if (q) {
              const matches = s.clientName.toLowerCase().includes(q) || 
                              s.location.toLowerCase().includes(q);
              if (!matches) return false;
          }

          return true;
      }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [selectedAgentId, shifts, today, shiftSearch, showAllShifts]);

  // Auto-select shift if only one found and agent is selected
  // Using useEffect ensures this runs after render and doesn't conflict with rendering cycle
  useEffect(() => {
      if (selectedAgentId && availableShifts.length === 1 && !selectedShiftId) {
          setSelectedShiftId(availableShifts[0].id);
      }
  }, [availableShifts, selectedShiftId, selectedAgentId]);

  if (!isOpen) return null;

  const handleSubmit = () => {
      if (!selectedAgentId || !selectedShiftId || !time) return;

      const now = new Date();
      const timestamp = `${today}T${time}:00`;
      
      const existingLog = timeLogs.find(l => l.shiftId === selectedShiftId && !l.clockOut);

      if (actionType === 'IN') {
          if (existingLog) {
              alert('Er is al een actieve sessie voor deze shift.');
              return;
          }
          
          const shift = shifts.find(s => s.id === selectedShiftId);
          const scheduledStart = new Date(shift?.startTime || now);
          const diffMins = Math.round((new Date(timestamp).getTime() - scheduledStart.getTime()) / 60000);
          
          const newLog: TimeLog = {
              id: `TL-MAN-${Date.now()}`,
              shiftId: selectedShiftId,
              employeeId: selectedAgentId,
              date: today,
              clockIn: timestamp,
              status: diffMins > 10 ? 'LATE' : 'OK',
              approvalStatus: 'SUBMITTED',
              deviationMinutes: diffMins,
              correctionReason: note ? `Handmatig: ${note}` : 'Handmatige registratie',
              geoLat: 0, 
              geoLng: 0,
              events: [],
              currentStatus: 'IN_DIENST'
          };
          addTimeLog(newLog);
      } else {
          if (!existingLog) {
              alert('Geen actieve sessie gevonden om uit te klokken.');
              return;
          }
          
          updateTimeLog(existingLog.id, {
              clockOut: timestamp,
              correctionReason: existingLog.correctionReason ? `${existingLog.correctionReason} | UIT Handmatig: ${note}` : `UIT Handmatig: ${note}`
          });
      }

      onClose();
      setSelectedAgentId('');
      setSelectedShiftId('');
      setAgentSearch('');
      setShiftSearch('');
      setShowAllShifts(false);
      setNote('');
      setTime(new Date().toTimeString().slice(0, 5));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-apex-gold" /> {t('tijd.manualReg')}
        </h3>

        <div className="space-y-5">
            {/* Agent Select with Search */}
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Agent</label>
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input 
                        type="text" 
                        placeholder="Zoek agent..." 
                        value={agentSearch}
                        onChange={e => setAgentSearch(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded pl-10 pr-4 py-2 text-white outline-none focus:border-apex-gold text-sm"
                    />
                </div>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <select 
                        value={selectedAgentId}
                        onChange={e => { setSelectedAgentId(e.target.value); setSelectedShiftId(''); }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded pl-10 pr-4 py-2 text-white appearance-none outline-none focus:border-apex-gold"
                    >
                        <option value="">
                            {filteredAgents.length === 0 ? "Geen agenten gevonden" : "Selecteer uit lijst..."}
                        </option>
                        {filteredAgents.map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.badgeNr || 'Geen Badge'})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Shift Select with Search */}
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 flex justify-between items-center">
                    <span>Opdracht / Shift</span>
                    <label className="flex items-center gap-2 cursor-pointer text-[10px] text-zinc-400 hover:text-white">
                        <input 
                            type="checkbox" 
                            checked={showAllShifts} 
                            onChange={e => setShowAllShifts(e.target.checked)} 
                            className="rounded border-zinc-700 bg-zinc-900"
                        />
                        Toon alle datums
                    </label>
                </label>

                {/* Shift Search Input */}
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input 
                        type="text" 
                        placeholder={selectedAgentId ? "Zoek opdracht/shift..." : "Typ om te zoeken in alle shifts..."}
                        value={shiftSearch}
                        onChange={e => setShiftSearch(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded pl-10 pr-4 py-2 text-white outline-none focus:border-apex-gold text-sm"
                    />
                </div>

                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <select 
                        value={selectedShiftId}
                        onChange={e => setSelectedShiftId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded pl-10 pr-4 py-2 text-white appearance-none outline-none focus:border-apex-gold"
                    >
                        <option value="">
                            {availableShifts.length === 0 ? (shiftSearch ? "Geen resultaten" : "Typ om te zoeken of selecteer agent") : "Selecteer Shift..."}
                        </option>
                        {availableShifts.map(s => {
                            const dateStr = new Date(s.startTime).toLocaleDateString();
                            const isToday = s.startTime.startsWith(today);
                            return (
                                <option key={s.id} value={s.id}>
                                    {!isToday ? `[${dateStr}] ` : ''}{s.clientName} ({s.startTime.split('T')[1].slice(0,5)} - {s.endTime.split('T')[1].slice(0,5)})
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            {/* Action & Time */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Actie</label>
                    <div className="flex bg-zinc-950 rounded p-1 border border-zinc-800">
                        <button 
                            onClick={() => setActionType('IN')}
                            className={clsx("flex-1 py-1.5 rounded text-sm font-bold transition-all", actionType === 'IN' ? "bg-green-600 text-white shadow" : "text-zinc-500 hover:text-white")}
                        >
                            INKLOKKEN
                        </button>
                        <button 
                            onClick={() => setActionType('UIT')}
                            className={clsx("flex-1 py-1.5 rounded text-sm font-bold transition-all", actionType === 'UIT' ? "bg-red-600 text-white shadow" : "text-zinc-500 hover:text-white")}
                        >
                            UITKLOKKEN
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Tijdstip</label>
                    <input 
                        type="time" 
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white font-mono text-center outline-none focus:border-apex-gold"
                    />
                </div>
            </div>

            {/* Note */}
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Opmerking (Optioneel)</label>
                <textarea 
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white h-20 outline-none focus:border-apex-gold resize-none"
                    placeholder="Reden voor handmatige invoer..."
                />
            </div>

            <button 
                onClick={handleSubmit}
                disabled={!selectedAgentId || !selectedShiftId}
                className="w-full bg-apex-gold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded mt-2 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
                <Save className="w-4 h-4" /> Registratie Opslaan
            </button>
        </div>
      </div>
    </div>
  );
};