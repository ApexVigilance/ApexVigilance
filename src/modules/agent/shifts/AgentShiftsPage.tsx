
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getGroupKey } from '../../../data/store';
import { ShiftCard } from './components/ShiftCard';
import { Filter, ChevronDown, RefreshCw, Calendar, Inbox, Search, History } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../auth/store';



export const AgentShiftsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const CURRENT_AGENT_ID = user?.employeeId ?? '';
  const { shifts, applications } = useStore();
  
  const [activeTab, setActiveTab] = useState<'MINE' | 'APPLICATIONS' | 'OPEN'>('MINE');
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // --- DATA PREPARATION ---

  // 1. My Shifts - Split into Active/Scheduled vs History
  const myShiftsRaw = useMemo(() => 
    shifts.filter(s => s.employeeId === CURRENT_AGENT_ID).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  , [shifts]);

  const myActiveShifts = myShiftsRaw.filter(s => s.status === 'Scheduled' || s.status === 'Active');
  const myHistoryShifts = myShiftsRaw.filter(s => s.status === 'Completed').sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); 

  // 2. My Applications
  // Join with shift data (using groupId OR hash to find a representative shift)
  const myApplications = useMemo(() => {
    return applications
      .filter(a => a.agentId === CURRENT_AGENT_ID)
      .map(app => {
        // NEW: Try finding by groupId first (Robust)
        let matchingShift = undefined;
        
        if (app.groupId) {
            matchingShift = shifts.find(s => s.groupId === app.groupId);
        }
        
        // Fallback to legacy hash criteria
        if (!matchingShift) {
            try { 
                const criteria = JSON.parse(atob(app.shiftGroupHash)); 
                matchingShift = shifts.find(s => 
                   s.clientName === criteria.c && 
                   s.location === criteria.l && 
                   s.startTime === criteria.s && 
                   s.endTime === criteria.e
                );
            } catch(e) { }
        }

        if (!matchingShift) return null; // Shift deleted or completely changed

        return {
           app,
           shift: matchingShift
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.app.createdAt).getTime() - new Date(a!.app.createdAt).getTime()); 
  }, [applications, shifts]);

  // 3. Open Shifts
  const openShiftGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const now = new Date();

    shifts.forEach(s => {
      // Filter out past shifts and assigned shifts
      if (new Date(s.startTime) <= now) return;
      if (s.employeeId) return; // Already taken
      
      // Check if I already applied (Pending/Approved)
      const groupHash = getGroupKey(s.clientName, s.location, s.startTime, s.endTime);
      const isApplied = applications.some(a => 
         (a.groupId === s.groupId || a.shiftGroupHash === groupHash) && 
         a.agentId === CURRENT_AGENT_ID && 
         (a.status === 'PENDING' || a.status === 'APPROVED')
      );
      if (isApplied) return;

      // Grouping
      const key = `${s.clientName}|${s.location}|${s.startTime}|${s.endTime}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    return Object.values(groups).map(g => ({
        first: g[0],
        total: g.length,
        key: getGroupKey(g[0].clientName, g[0].location, g[0].startTime, g[0].endTime)
    })).sort((a, b) => new Date(a.first.startTime).getTime() - new Date(b.first.startTime).getTime());
  }, [shifts, applications]);


  // --- FILTERING LOGIC ---

  const filterByPeriod = (dateStr: string) => {
    if (filterPeriod === 'ALL') return true;
    
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (filterPeriod === 'TODAY') {
       return date.toDateString() === now.toDateString();
    }
    if (filterPeriod === 'WEEK') {
       const nextWeek = new Date(today);
       nextWeek.setDate(today.getDate() + 7);
       return date >= today && date <= nextWeek;
    }
    if (filterPeriod === 'MONTH') {
       return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const visibleMyActiveShifts = myActiveShifts.filter(s => filterByPeriod(s.startTime));
  const visibleMyHistoryShifts = myHistoryShifts.filter(s => filterByPeriod(s.startTime));
  
  const visibleApplications = myApplications.filter(item => filterByPeriod(item!.shift.startTime));
  const visibleOpenShifts = openShiftGroups.filter(g => filterByPeriod(g.first.startTime));

  // --- HEADER STRIP ---
  const nextShift = myActiveShifts.find(s => new Date(s.endTime) > new Date());

  return (
    <div className="pb-24 animate-in fade-in duration-300 min-h-full">
      {/* Header Info Strip */}
      <div className="mb-6">
         <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2 flex items-center justify-between">
            {t('nav.shifts')}
            <button onClick={handleRefresh} className="p-2 text-zinc-500 hover:text-white transition-colors">
               <RefreshCw className={clsx("w-5 h-5", isRefreshing && "animate-spin")} />
            </button>
         </h1>
         
         <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-8 bg-apex-gold rounded-full"></div>
               <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Volgende Shift</div>
                  {nextShift ? (
                     <div className="text-white font-bold text-sm">
                        {new Date(nextShift.startTime).toLocaleDateString()} • {new Date(nextShift.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                     </div>
                  ) : (
                     <div className="text-zinc-400 text-sm italic">Geen komende shift.</div>
                  )}
               </div>
            </div>
            {!nextShift && (
               <button onClick={() => setActiveTab('OPEN')} className="text-xs text-apex-gold font-bold hover:underline">
                  + Zoeken
               </button>
            )}
         </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900 p-1 rounded-xl mb-4 shadow-inner border border-zinc-800/50">
        <button 
          onClick={() => setActiveTab('MINE')}
          className={clsx("flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all", activeTab === 'MINE' ? "bg-zinc-800 text-white shadow border border-zinc-700" : "text-zinc-500 hover:text-zinc-300")}
        >
          {t('shifts.tabs.mine')}
        </button>
        <button 
          onClick={() => setActiveTab('APPLICATIONS')}
          className={clsx("flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all relative", activeTab === 'APPLICATIONS' ? "bg-zinc-800 text-white shadow border border-zinc-700" : "text-zinc-500 hover:text-zinc-300")}
        >
          {t('shifts.tabs.applications')}
          {applications.filter(a => a.agentId === CURRENT_AGENT_ID && a.status === 'PENDING').length > 0 && (
             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('OPEN')}
          className={clsx("flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all", activeTab === 'OPEN' ? "bg-zinc-800 text-white shadow border border-zinc-700" : "text-zinc-500 hover:text-zinc-300")}
        >
          {t('shifts.tabs.open')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-xs text-zinc-500 font-bold">
           {activeTab === 'MINE' && `${visibleMyActiveShifts.length} gepland`}
           {activeTab === 'APPLICATIONS' && `${visibleApplications.length} aanvragen`}
           {activeTab === 'OPEN' && `${visibleOpenShifts.length} beschikbaar`}
        </div>
        <div className="relative">
           <select 
             value={filterPeriod}
             onChange={(e) => setFilterPeriod(e.target.value as any)}
             className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold pl-3 pr-8 py-2 rounded-lg appearance-none outline-none focus:border-apex-gold transition-colors shadow-sm"
           >
             <option value="ALL">{t('shifts.period.all')}</option>
             <option value="TODAY">{t('shifts.period.today')}</option>
             <option value="WEEK">{t('shifts.period.week')}</option>
             <option value="MONTH">{t('shifts.period.month')}</option>
           </select>
           <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* --- CONTENT AREA --- */}

      {/* 1. MINE */}
      {activeTab === 'MINE' && (
         <div className="space-y-6">
            
            {/* Active/Scheduled */}
            <div className="space-y-3">
               {visibleMyActiveShifts.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                     <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20 text-zinc-500" />
                     <p className="text-zinc-500 text-sm mb-4">{t('shifts.empty.mine')}</p>
                     <div className="flex justify-center gap-3">
                        <button onClick={() => setActiveTab('OPEN')} className="text-xs bg-apex-gold text-black font-bold px-4 py-2 rounded shadow hover:bg-yellow-500 transition-colors">
                           {t('shifts.actions.viewOpen')}
                        </button>
                        <button onClick={() => setFilterPeriod('ALL')} className="text-xs bg-zinc-800 text-white font-bold px-4 py-2 rounded border border-zinc-700 hover:bg-zinc-700 transition-colors">
                           {t('shifts.actions.resetFilter')}
                        </button>
                     </div>
                  </div>
               ) : (
                  visibleMyActiveShifts.map(shift => (
                     <ShiftCard 
                        key={shift.id} 
                        shift={shift} 
                        variant="MINE"
                        onClick={() => navigate(`/agent/shifts/${getGroupKey(shift.clientName, shift.location, shift.startTime, shift.endTime)}`)} 
                     />
                  ))
               )}
            </div>

            {/* History Section */}
            {visibleMyHistoryShifts.length > 0 && (
                <div className="pt-6 border-t border-zinc-800/50">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <History className="w-3 h-3" /> Eerdere Diensten
                    </h3>
                    <div className="space-y-3 opacity-75 hover:opacity-100 transition-opacity">
                        {visibleMyHistoryShifts.map(shift => (
                            <ShiftCard 
                                key={shift.id} 
                                shift={shift} 
                                variant="MINE"
                                onClick={() => navigate(`/agent/shifts/${getGroupKey(shift.clientName, shift.location, shift.startTime, shift.endTime)}`)} 
                            />
                        ))}
                    </div>
                </div>
            )}
         </div>
      )}

      {/* 2. APPLICATIONS */}
      {activeTab === 'APPLICATIONS' && (
         <div className="space-y-3">
            {visibleApplications.length === 0 ? (
               <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                  <Inbox className="w-12 h-12 mx-auto mb-4 opacity-20 text-zinc-500" />
                  <p className="text-zinc-500 text-sm mb-4">{t('shifts.empty.applications')}</p>
                  <button onClick={() => setActiveTab('OPEN')} className="text-xs bg-zinc-800 text-white font-bold px-4 py-2 rounded border border-zinc-700 hover:bg-zinc-700 transition-colors">
                     {t('shifts.actions.viewOpen')}
                  </button>
               </div>
            ) : (
               visibleApplications.map(item => (
                  <ShiftCard 
                     key={item!.app.id} 
                     shift={item!.shift} 
                     variant="APPLICATION"
                     applicationStatus={item!.app.status}
                     applicationNote={item!.app.note}
                     // Navigate using groupId if possible, else hash
                     onClick={() => navigate(`/agent/shifts/${item!.shift.groupId || item!.app.shiftGroupHash}`)} 
                  />
               ))
            )}
         </div>
      )}

      {/* 3. OPEN */}
      {activeTab === 'OPEN' && (
         <div className="space-y-3">
            {visibleOpenShifts.length === 0 ? (
               <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-20 text-zinc-500" />
                  <p className="text-zinc-500 text-sm mb-4">{t('shifts.empty.open')}</p>
                  <div className="flex justify-center gap-3">
                     <button onClick={() => setFilterPeriod('ALL')} className="text-xs bg-zinc-800 text-white font-bold px-4 py-2 rounded border border-zinc-700 hover:bg-zinc-700 transition-colors">
                        {t('shifts.actions.resetFilter')}
                     </button>
                     <button onClick={handleRefresh} className="text-xs bg-zinc-800 text-white font-bold px-4 py-2 rounded border border-zinc-700 hover:bg-zinc-700 transition-colors">
                        {t('common.refresh')}
                     </button>
                  </div>
               </div>
            ) : (
               visibleOpenShifts.map(group => (
                  <ShiftCard 
                     key={group.key} 
                     shift={group.first} 
                     variant="OPEN"
                     openSlots={group.total}
                     onClick={() => navigate(`/agent/shifts/${group.first.groupId}`)} 
                  />
               ))
            )}
         </div>
      )}
    </div>
  );
};
