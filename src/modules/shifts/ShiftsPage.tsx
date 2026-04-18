import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore, getGroupKey } from '../../data/store';
import { ShiftCard } from './components/ShiftCard';
import { NewShiftModal } from './components/NewShiftModal';
import { Filter, Search, Plus, Download, Printer, CheckSquare, Trash2, XCircle, Square } from 'lucide-react';
import clsx from 'clsx';
import { generateShiftsListPdf } from './utils/generateShiftsPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';

export const ShiftsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { shifts, applications, updateShiftGroup, deleteShift } = useStore();
  
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'ISSUES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  // Group Shifts by Client+Location+Start+End to form a "Job" card
  const groupedShifts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    shifts.forEach(s => {
      // Hide Cancelled shifts from overview unless explicitly requested (Future feature maybe)
      if (s.status === 'Cancelled') return;

      const key = `${s.clientName}|${s.location}|${s.startTime}|${s.endTime}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    // Convert groups to array and sort by start time desc
    return Object.values(groups).map(group => {
      const first = group[0];
      const total = group.length;
      const assigned = group.filter(s => s.employeeId).length;
      
      let status = 'Scheduled';
      if (group.some(s => s.status === 'Active')) status = 'Active';
      else if (group.every(s => s.status === 'Completed')) status = 'Completed';
      
      const isOvernight = new Date(first.endTime).getDate() !== new Date(first.startTime).getDate();
      const compliance: 'NON_CONFORM' | 'PARTIAL' | 'CONFORM' = assigned === 0 ? 'NON_CONFORM' : (assigned < total ? 'PARTIAL' : 'CONFORM');

      // NEW: Calculate pending applications using groupId first, then hash fallback
      const groupHash = getGroupKey(first.clientName, first.location, first.startTime, first.endTime);
      const pendingCount = applications.filter(a => 
          (a.groupId === first.groupId || a.shiftGroupHash === groupHash) && 
          a.status === 'PENDING'
      ).length;

      return {
        id: first.id, // Use ID of first slot as group ID for navigation
        data: first,
        total,
        assigned,
        status,
        isOvernight,
        compliance,
        pendingCount 
      };
    }).sort((a, b) => new Date(b.data.startTime).getTime() - new Date(a.data.startTime).getTime());
  }, [shifts, applications]);

  const filteredGroups = groupedShifts.filter(g => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = g.data.clientName.toLowerCase().includes(query) || g.data.location.toLowerCase().includes(query);
    if (!matchesSearch) return false;

    if (activeFilter === 'OPEN') return g.assigned < g.total && g.status !== 'Completed';
    if (activeFilter === 'SCHEDULED') return g.status === 'Scheduled';
    if (activeFilter === 'ACTIVE') return g.status === 'Active';
    if (activeFilter === 'COMPLETED') return g.status === 'Completed';
    if (activeFilter === 'ISSUES') return g.compliance !== 'CONFORM';
    
    return true;
  });

  const handleDownload = () => {
    const { blob, filename } = generateShiftsListPdf(filteredGroups, activeFilter);
    downloadPdf(blob, filename);
  };

  const handlePrint = () => {
    const { blob } = generateShiftsListPdf(filteredGroups, activeFilter);
    printPdfBlob(blob);
  };

  const toggleSelect = (id: string) => {
    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkCancel = () => {
    if (!confirm(`${selectedGroupIds.size} shift(s) annuleren?`)) return;
    const groups = filteredGroups.filter(g => selectedGroupIds.has(g.id));
    groups.forEach(g => {
      const ids = shifts.filter(s =>
        s.clientName === g.data.clientName && s.location === g.data.location &&
        s.startTime === g.data.startTime && s.endTime === g.data.endTime
      ).map(s => s.id);
      updateShiftGroup(ids, { status: 'Cancelled' });
    });
    setSelectedGroupIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkDelete = () => {
    if (!confirm(`${selectedGroupIds.size} shift(s) definitief verwijderen?`)) return;
    const groups = filteredGroups.filter(g => selectedGroupIds.has(g.id));
    groups.forEach(g => {
      shifts.filter(s =>
        s.clientName === g.data.clientName && s.location === g.data.location &&
        s.startTime === g.data.startTime && s.endTime === g.data.endTime
      ).forEach(s => deleteShift(s.id));
    });
    setSelectedGroupIds(new Set());
    setSelectionMode(false);
  };

  const FilterChip = ({ id, label, count }: { id: typeof activeFilter, label: string, count: number }) => (
    <button
      onClick={() => setActiveFilter(id)}
      className={clsx(
        "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2",
        activeFilter === id 
          ? "bg-apex-gold text-black border-apex-gold shadow-lg shadow-apex-gold/20" 
          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
      )}
    >
      {label}
      <span className={clsx("px-1.5 py-0.5 rounded-full text-[10px]", activeFilter === id ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-500")}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">{t('shifts.title')}</h2>
          <p className="text-zinc-400 mt-1">{t('shifts.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button
                onClick={handleDownload}
                className="bg-zinc-800 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700 transition-colors text-sm"
            >
                <Download className="w-4 h-4" /><span className="hidden sm:inline">Download </span>PDF
            </button>
            <button
                onClick={handlePrint}
                className="bg-zinc-800 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 hover:bg-zinc-700 transition-colors text-sm"
            >
                <Printer className="w-4 h-4" /><span className="hidden sm:inline">Afdrukken</span>
            </button>
            <button
               onClick={() => { setSelectionMode(m => !m); setSelectedGroupIds(new Set()); }}
               className={clsx("px-3 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm border", selectionMode ? "bg-apex-gold text-black border-yellow-600" : "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700")}
            >
               <CheckSquare className="w-4 h-4" /><span className="hidden sm:inline">Selecteren</span>
            </button>
            <button
               onClick={() => setIsNewModalOpen(true)}
               className="bg-apex-gold hover:bg-yellow-500 text-black border border-yellow-600 px-3 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-apex-gold/20 text-sm"
            >
               <Plus className="w-4 h-4" /> Nieuwe Shift
            </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 mb-8">
         <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
               type="text" 
               placeholder="Zoek op klant, locatie..." 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:border-apex-gold outline-none shadow-sm"
            />
         </div>

         <div className="flex flex-wrap gap-2 items-center flex-1">
            <FilterChip id="ALL" label="Alles" count={groupedShifts.length} />
            <FilterChip id="OPEN" label="Open Slots" count={groupedShifts.filter(g => g.assigned < g.total && g.status !== 'Completed').length} />
            <FilterChip id="SCHEDULED" label="Ingepland" count={groupedShifts.filter(g => g.status === 'Scheduled').length} />
            <FilterChip id="ACTIVE" label="Bezig" count={groupedShifts.filter(g => g.status === 'Active').length} />
            <FilterChip id="COMPLETED" label="Afgerond" count={groupedShifts.filter(g => g.status === 'Completed').length} />
            <FilterChip id="ISSUES" label="Problemen" count={groupedShifts.filter(g => g.compliance !== 'CONFORM').length} />
         </div>
      </div>

      {filteredGroups.length === 0 ? (
         <div className="py-24 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30 flex flex-col items-center justify-center">
            <Filter className="w-12 h-12 text-zinc-600 mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Geen shifts gevonden</h3>
            <p className="text-zinc-500 max-w-md mx-auto mb-6">Pas de filters aan of maak een nieuwe shift aan.</p>
            <button 
               onClick={() => { setActiveFilter('ALL'); setSearchQuery(''); }}
               className="text-apex-gold font-bold hover:underline"
            >
               Reset filters
            </button>
         </div>
      ) : (
         <>
           {/* Bulk Action Bar */}
           {selectionMode && selectedGroupIds.size > 0 && (
             <div className="sticky top-20 z-30 flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 mb-4 shadow-2xl">
               <span className="text-white font-bold text-sm flex-1">{selectedGroupIds.size} geselecteerd</span>
               <button onClick={handleBulkCancel} className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                 <XCircle className="w-4 h-4" /> Annuleren
               </button>
               <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                 <Trash2 className="w-4 h-4" /> Verwijderen
               </button>
               <button onClick={() => setSelectedGroupIds(new Set())} className="text-zinc-500 hover:text-white text-xs underline">Deselecteer</button>
             </div>
           )}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredGroups.map(group => (
                 <div key={group.id} className="relative">
                   {selectionMode && (
                     <button
                       onClick={() => toggleSelect(group.id)}
                       className={clsx(
                         "absolute top-2 left-2 z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors shadow-lg",
                         selectedGroupIds.has(group.id)
                           ? "bg-apex-gold border-apex-gold text-black"
                           : "bg-zinc-900 border-zinc-600 text-zinc-500 hover:border-apex-gold"
                       )}
                     >
                       {selectedGroupIds.has(group.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                     </button>
                   )}
                   <ShiftCard
                      shift={{ ...group.data, status: group.status }}
                      totalSlots={group.total}
                      filledSlots={group.assigned}
                      openSlots={group.total - group.assigned}
                      isOvernight={group.isOvernight}
                      complianceStatus={group.compliance}
                      pendingCount={group.pendingCount}
                   />
                 </div>
              ))}
           </div>
         </>
      )}

      <NewShiftModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} />
    </div>
  );
};