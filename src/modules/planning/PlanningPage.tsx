import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore, generateGroupId } from '../../data/store';
import { Shift } from '../../data/types';
import { 
  Calendar, MapPin, Plus, Clock, ChevronRight, Filter, X, ShieldCheck, Download, Tag, Trash2, Printer
} from 'lucide-react';
import clsx from 'clsx';
import { generatePlanningOverviewPdf } from './utils/generatePlanningPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';

export const PlanningPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { shifts, clients, deleteGroup, createShifts } = useStore();

  const [filterDate, setFilterDate] = useState<'Today' | 'Week' | 'Month'>('Week');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'Full'>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newShift, setNewShift] = useState({
    clientName: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    agentsNeeded: 1,
    role: 'Guard' as 'Guard' | 'Senior',
    certificates: [] as string[],
    exeCode: ''
  });

  const exeCodes = ['', 'EXE 10', 'EXE 07', 'EXE 06', 'EXE 14'];

  // Grouping Logic
  const shiftGroups = useMemo(() => {
    const groups: Record<string, Shift[]> = {};
    
    shifts.forEach(shift => {
      const key = shift.groupId || 'orphan';
      if (!groups[key]) groups[key] = [];
      groups[key].push(shift);
    });

    return Object.values(groups).map(groupShifts => {
      const first = groupShifts[0];
      const total = groupShifts.length;
      const assigned = groupShifts.filter(s => s.employeeId && s.employeeId !== '').length;
      
      let status: 'OPEN' | 'VOLZET' | 'IN_UITVOERING' = 'OPEN';
      if (assigned >= total) status = 'VOLZET';
      
      const now = new Date();
      const start = new Date(first.startTime);
      const end = new Date(first.endTime);
      
      if (now >= start && now <= end) status = 'IN_UITVOERING';

      return {
        key: first.groupId,
        details: first,
        total,
        assigned,
        status,
        shifts: groupShifts
      };
    });
  }, [shifts]);

  // Filtering Logic
  const filteredGroups = shiftGroups.filter(group => {
    const groupDate = new Date(group.details.startTime);
    const now = new Date();
    
    // Date Filter
    if (filterDate === 'Today') {
      const isToday = groupDate.toDateString() === now.toDateString();
      if (!isToday) return false;
    } else if (filterDate === 'Week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0,0,0,0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      if (groupDate < startOfWeek || groupDate >= endOfWeek) return false;
    } else if (filterDate === 'Month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        if (groupDate < startOfMonth || groupDate > endOfMonth) return false;
    }

    // Status Filter
    if (filterStatus === 'Open' && group.status === 'VOLZET') return false;
    if (filterStatus === 'Full' && group.status !== 'VOLZET') return false;

    return true;
  }).sort((a, b) => new Date(a.details.startTime).getTime() - new Date(b.details.startTime).getTime());

  const handleCreateShift = () => {
    if (!newShift.clientName || !newShift.location) return;
    
    const createdShifts: Shift[] = [];
    const groupId = generateGroupId();
    
    const startISO = `${newShift.date}T${newShift.startTime}:00`;
    let endISO = `${newShift.date}T${newShift.endTime}:00`;
    
    if (newShift.endTime < newShift.startTime) {
       const d = new Date(newShift.date);
       d.setDate(d.getDate() + 1);
       endISO = `${d.toISOString().split('T')[0]}T${newShift.endTime}:00`;
    }

    for (let i = 0; i < newShift.agentsNeeded; i++) {
       createdShifts.push({
         id: `PLAN-${Date.now()}-${i}`,
         groupId: groupId,
         clientName: newShift.clientName,
         location: newShift.location,
         startTime: startISO,
         endTime: endISO,
         employeeId: '', 
         status: 'Scheduled',
         requiredRole: newShift.role,
         requiredCertificates: newShift.certificates,
         exeCode: newShift.exeCode || undefined
       });
    }

    createShifts(createdShifts);

    setIsModalOpen(false);
  };

  const handleDownload = () => {
    const { blob, filename } = generatePlanningOverviewPdf(filteredGroups, filterDate);
    downloadPdf(blob, filename);
  };

  const handlePrint = () => {
    const { blob } = generatePlanningOverviewPdf(filteredGroups, filterDate);
    printPdfBlob(blob);
  };

  const handleDeleteGroup = (e: React.MouseEvent, groupKey: string, assigned: number) => {
      e.stopPropagation();
      let msg = 'Weet je zeker dat je deze shift groep wilt verwijderen?';
      if (assigned > 0) msg += `\nLET OP: Er zijn ${assigned} agenten reeds ingepland!`;
      
      if (confirm(msg)) {
          deleteGroup(groupKey);
      }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">{t('planning.title')}</h2>
          <p className="text-zinc-400 mt-1">Beheer shifts en personeelsplanning</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownload}
            className="bg-zinc-800 text-white px-3 py-2 rounded font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700 text-sm"
          >
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Download </span>PDF
          </button>
          <button
            onClick={handlePrint}
            className="bg-zinc-800 text-white px-3 py-2 rounded font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700 text-sm"
          >
            <Printer className="w-4 h-4" /><span className="hidden sm:inline">Afdrukken</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-apex-gold text-black px-3 py-2 rounded font-bold hover:bg-yellow-400 transition-colors flex items-center gap-2 shadow-lg shadow-apex-gold/20 text-sm"
          >
            <Plus className="w-4 h-4" /> Nieuwe Shift
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
         <div className="flex bg-zinc-950 p-1 rounded border border-zinc-800 w-full sm:w-auto">
            {(['Today', 'Week', 'Month'] as const).map(f => (
               <button
                  key={f}
                  onClick={() => setFilterDate(f)}
                  className={clsx(
                     "flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold uppercase rounded transition-colors",
                     filterDate === f ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
               >
                  <span className="sm:hidden">{f === 'Today' ? 'Vandaag' : f === 'Week' ? 'Week' : 'Maand'}</span>
                  <span className="hidden sm:inline">{f === 'Today' ? 'Vandaag' : f === 'Week' ? 'Deze Week' : 'Deze Maand'}</span>
               </button>
            ))}
         </div>

         <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
            <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="flex-1 sm:flex-none bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:border-apex-gold outline-none"
            >
                <option value="All">Alle Statussen</option>
                <option value="Open">Openstaand</option>
                <option value="Full">Volzet</option>
            </select>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {filteredGroups.length === 0 ? (
            <div className="col-span-full py-20 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/50">
               <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p>Geen shifts gevonden voor deze periode.</p>
            </div>
         ) : (
            filteredGroups.map((group) => {
               const percentage = Math.round((group.assigned / group.total) * 100);
               const progressColor = percentage === 100 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-orange-500' : 'bg-red-500';

               return (
                  <div 
                     key={group.key}
                     onClick={() => navigate(`/planning/${group.key}`)}
                     className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 cursor-pointer hover:border-apex-gold hover:shadow-lg transition-all group relative overflow-hidden flex flex-col justify-between"
                  >
                     <div className={clsx("absolute top-0 left-0 bottom-0 w-1", 
                        group.status === 'VOLZET' ? "bg-zinc-600" : 
                        group.status === 'IN_UITVOERING' ? "bg-green-500" : "bg-apex-gold"
                     )} />

                     <button 
                        onClick={(e) => handleDeleteGroup(e, group.key, group.assigned)}
                        className="absolute top-2 right-2 p-2 text-zinc-400 hover:text-red-500 z-20 bg-zinc-950/50 hover:bg-zinc-900 rounded-full transition-colors"
                        title="Groep verwijderen"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>

                     <div>
                        <div className="flex justify-between items-start mb-4 pl-3">
                           <div>
                              <h3 className="font-bold text-white text-lg group-hover:text-apex-gold transition-colors truncate max-w-[180px]">
                                 {group.details.clientName}
                              </h3>
                              <div className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                 <MapPin className="w-3 h-3" /> {group.details.location}
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-1 mr-6">
                              <span className={clsx(
                                 "text-[10px] font-bold uppercase px-2 py-1 rounded border",
                                 group.status === 'VOLZET' ? "bg-zinc-800 text-zinc-400 border-zinc-700" :
                                 group.status === 'IN_UITVOERING' ? "bg-green-900/20 text-green-400 border-green-900/30 animate-pulse" :
                                 "bg-yellow-900/20 text-apex-gold border-yellow-900/30"
                              )}>
                                 {group.status === 'IN_UITVOERING' ? 'Bezig' : group.status === 'VOLZET' ? 'Volzet' : 'Open'}
                              </span>
                              {group.details.exeCode && (
                                 <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                                    <Tag className="w-2 h-2" /> {group.details.exeCode}
                                 </span>
                              )}
                           </div>
                        </div>

                        <div className="pl-3 space-y-3 mb-4">
                           <div className="flex items-center gap-3 text-sm text-zinc-300">
                              <Calendar className="w-4 h-4 text-zinc-500" />
                              <span>{new Date(group.details.startTime).toLocaleDateString()}</span>
                           </div>
                           <div className="flex items-center gap-3 text-sm text-zinc-300">
                              <Clock className="w-4 h-4 text-zinc-500" />
                              <span className="font-mono">
                                 {new Date(group.details.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                                 {new Date(group.details.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="mt-2 pt-4 border-t border-zinc-800 pl-3">
                        <div className="flex justify-between items-end mb-1">
                           <div className="text-xs font-bold text-zinc-400 uppercase">Capaciteit {percentage}%</div>
                           <div className="text-sm font-bold text-white">
                              {group.assigned} <span className="text-zinc-500 font-normal">/ {group.total}</span>
                           </div>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-3">
                           <div className={clsx("h-full rounded-full transition-all duration-500", progressColor)} style={{ width: `${percentage}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-xs text-zinc-500">
                           <span>{group.total - group.assigned} open slots</span>
                           <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white" />
                        </div>
                     </div>
                  </div>
               );
            })
         )}
      </div>

      {/* New Shift Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
               <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-apex-gold" /> Nieuwe Shift Inplannen</h3>

               <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm text-zinc-400 mb-1">Klant</label>
                        <select 
                           value={newShift.clientName}
                           onChange={e => setNewShift({...newShift, clientName: e.target.value})}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-apex-gold outline-none"
                        >
                           <option value="">Selecteer klant...</option>
                           {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm text-zinc-400 mb-1">Locatie</label>
                        <input 
                           type="text" 
                           value={newShift.location}
                           onChange={e => setNewShift({...newShift, location: e.target.value})}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-apex-gold outline-none"
                           placeholder="bv. Hoofdingang"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm text-zinc-400 mb-1">Datum</label>
                        <input type="date" value={newShift.date} onChange={e => setNewShift({...newShift, date: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-apex-gold outline-none" />
                     </div>
                     <div>
                        <label className="block text-sm text-zinc-400 mb-1">Aantal Agenten</label>
                        <input type="number" min="1" max="20" value={newShift.agentsNeeded} onChange={e => setNewShift({...newShift, agentsNeeded: parseInt(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-apex-gold outline-none" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-sm text-zinc-400 mb-1">Starttijd</label><input type="time" value={newShift.startTime} onChange={e => setNewShift({...newShift, startTime: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-apex-gold outline-none" /></div>
                     <div><label className="block text-sm text-zinc-400 mb-1">Eindtijd</label><input type="time" value={newShift.endTime} onChange={e => setNewShift({...newShift, endTime: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-apex-gold outline-none" /></div>
                  </div>

                  <div>
                     <label className="block text-sm text-zinc-400 mb-1">{t('planning.exeLabel')}</label>
                     <select 
                        value={newShift.exeCode}
                        onChange={e => setNewShift({...newShift, exeCode: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-apex-gold outline-none"
                     >
                        {exeCodes.map(code => <option key={code} value={code}>{code || 'Geen'}</option>)}
                     </select>
                  </div>

                  <div className="border-t border-zinc-800 pt-4 mt-2">
                     <h4 className="text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-apex-gold" /> {t('planning.requirements')}</h4>
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                           <label className="block text-sm text-zinc-400 mb-1">Min. Rol</label>
                           <select value={newShift.role} onChange={e => setNewShift({...newShift, role: e.target.value as any})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white outline-none focus:border-apex-gold">
                              <option value="Guard">{t('roles.guard')}</option>
                              <option value="Senior">{t('roles.senior')}</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <button 
                     onClick={handleCreateShift}
                     disabled={!newShift.clientName || !newShift.location}
                     className="w-full bg-apex-gold hover:bg-yellow-500 text-black font-bold py-3 rounded mt-4 disabled:opacity-50 transition-colors shadow-lg"
                  >Shift Inplannen</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};