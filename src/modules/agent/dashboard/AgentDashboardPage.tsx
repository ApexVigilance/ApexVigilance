import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../data/store';
import { useAuthStore } from '../../auth/store';
import { 
  RefreshCw, MapPin, Navigation, Clock, Calendar, 
  ChevronRight, AlertTriangle, FileText, Bell, 
  Play, Square, ArrowRight, Shield, Award, User
} from 'lucide-react';
import clsx from 'clsx';


export const AgentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const CURRENT_AGENT_ID = user?.employeeId ?? '';
  const { shifts, employees, updates } = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- DATA LOGIC (LIVE FROM STORE) ---

  const now = new Date();

  // 1. Current Agent Data
  const currentAgent = useMemo(() => employees.find(e => e.id === CURRENT_AGENT_ID), [employees, CURRENT_AGENT_ID]);

  // 2. My Shifts (Live filter from store)
  const myShifts = useMemo(() => 
    shifts.filter(s => s.employeeId === CURRENT_AGENT_ID).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  , [shifts]);

  // 3. Next Upcoming Shift
  const nextShift = useMemo(() => 
    myShifts.find(s => new Date(s.endTime) > now)
  , [myShifts, now]);

  // 4. Currently Active Shift (for Time Reg)
  const activeShift = useMemo(() => 
    myShifts.find(s => now >= new Date(s.startTime) && now <= new Date(s.endTime))
  , [myShifts, now]);

  // 5. Open Shifts (Future, Unassigned, Live filter)
  const openShifts = useMemo(() => 
    shifts
      .filter(s => (!s.employeeId || s.employeeId === '') && new Date(s.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      // Unique group filtering logic for preview
      .reduce((acc: any[], current) => {
          const isDuplicate = acc.find(item => 
              item.clientName === current.clientName && 
              item.startTime === current.startTime &&
              item.location === current.location
          );
          if (!isDuplicate) {
              return acc.concat([current]);
          }
          return acc;
      }, [])
      .slice(0, 3)
  , [shifts, now]);

  // Helper for Group Key (reusing logic for navigation)
  const getGroupKey = (s: any) => btoa(JSON.stringify({c: s.clientName, l: s.location, s: s.startTime, e: s.endTime}));

  // --- SMART TEXT HELPERS ---

  const getFirstName = () => {
    // Try to get real name from employee store first, fall back to auth user
    if (currentAgent?.name) return currentAgent.name.split(' ')[0];
    if (user?.username) return user.username.split(' ')[0];
    return `Agent ${CURRENT_AGENT_ID}`;
  };

  const getStatusLine = () => {
    if (activeShift) {
        return { label: 'HUIDIGE DIENST', text: 'NU ACTIEF', color: 'text-green-400', dot: 'bg-green-500' };
    }
    if (!nextShift) {
        return { label: 'PLANNING', text: 'GEEN GEPLANDE DIENST', color: 'text-zinc-500', dot: 'bg-zinc-600' };
    }

    const start = new Date(nextShift.startTime);
    const diffMs = start.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const timeStr = start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

    // Logic for text
    let text = '';
    const isToday = start.getDate() === now.getDate() && start.getMonth() === now.getMonth();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = start.getDate() === tomorrow.getDate() && start.getMonth() === tomorrow.getMonth();

    if (diffMins < 60 && diffMins > 0) {
        text = `OVER ${diffMins} MIN • ${timeStr}`;
    } else if (isToday) {
        text = `VANDAAG • ${timeStr}`;
    } else if (isTomorrow) {
        text = `MORGEN • ${timeStr}`;
    } else {
        const dateStr = start.toLocaleDateString('nl-BE', {day:'numeric', month:'short'}).toUpperCase();
        text = `${dateStr} • ${timeStr}`;
    }

    return { label: 'VOLGENDE DIENST', text, color: 'text-white', dot: 'bg-apex-gold' };
  };

  const getClockInAvailability = () => {
    if (!nextShift) return "Geen geplande shift.";
    const start = new Date(nextShift.startTime);
    const availableFrom = new Date(start.getTime() - 30 * 60000); // 30 mins before
    return `Inklokken beschikbaar vanaf ${availableFrom.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
  };

  const statusLine = getStatusLine();

  // --- UPDATES DATA ---
  const getUpdateIcon = (type: string) => {
    switch(type) {
      case 'instructie': return <FileText className="w-3 h-3 text-blue-400" />;
      case 'planning': return <Calendar className="w-3 h-3 text-apex-gold" />;
      case 'verlof': return <User className="w-3 h-3 text-green-400" />;
      case 'certificaat': return <Award className="w-3 h-3 text-purple-400" />;
      default: return <Bell className="w-3 h-3 text-zinc-400" />;
    }
  };

  const formatUpdateTime = (iso: string) => {
      const date = new Date(iso);
      const diff = Math.floor((Date.now() - date.getTime()) / 60000);
      if (diff < 60) return `${diff}m geleden`;
      if (diff < 1440) return `${Math.floor(diff/60)}u geleden`;
      return `${Math.floor(diff/1440)}d geleden`;
  };

  // --- ACTIONS ---

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const handleTimeAction = (action: 'in' | 'out') => {
    alert(action === 'in' ? "U bent ingeklokt! (Simulatie)" : "U bent uitgeklokt! (Simulatie)");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      
      {/* Toast Notification */}
      <div className={clsx(
        "fixed top-24 left-1/2 -translate-x-1/2 bg-zinc-800 border border-apex-gold text-apex-gold px-4 py-2 rounded-full shadow-2xl text-sm font-bold transition-all z-50 flex items-center gap-2",
        showToast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      )}>
        <RefreshCw className="w-3 h-3" /> Dashboard Vernieuwd
      </div>

      {/* 1) HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            WELKOM, {getFirstName()}
          </h1>
          {/* Live Clock */}
          <div className="mt-2 font-mono text-4xl font-black text-apex-gold tracking-tight leading-none">
            {currentTime.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mt-1">
            {currentTime.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          
          {/* Futuristic Status Pill */}
          <div className="mt-3 inline-flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-full py-1.5 px-4 backdrop-blur-md shadow-sm">
             <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusLine.dot)}></span>
                  <span className={clsx("relative inline-flex rounded-full h-2 w-2", statusLine.dot)}></span>
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{statusLine.label}</span>
             </div>
             <div className="h-3 w-px bg-zinc-700"></div>
             <span className={clsx("text-xs font-bold tracking-wide font-mono", statusLine.color)}>
                {statusLine.text}
             </span>
          </div>
        </div>

        <button 
          onClick={handleRefresh} 
          className="group p-3 bg-zinc-900/50 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:scale-95 mt-1"
        >
          <RefreshCw className={clsx("w-5 h-5 transition-transform", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* 2) MIJN PLANNING (Hero Card) */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-apex-gold" />
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Eerstvolgende Dienst</h2>
        </div>

        {nextShift ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md p-5 group transition-all hover:border-apex-gold/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.05)]">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-apex-gold/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
              <span className="bg-apex-gold/20 text-apex-gold border border-apex-gold/30 text-[10px] font-black uppercase px-2 py-1 rounded-full tracking-wide">
                Mijn Shift
              </span>
              <div className="text-right">
                <div className="text-white font-black text-4xl leading-none tracking-tight">
                  {new Date(nextShift.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </div>
                <div className="text-apex-gold text-xs font-bold uppercase tracking-wider mt-1">
                  {new Date(nextShift.startTime).toLocaleDateString('nl-BE', {weekday: 'long', day: 'numeric', month: 'short'})}
                </div>
              </div>
            </div>

            <div className="mb-6 relative z-10">
              <h3 className="text-xl font-bold text-white mb-1 truncate pr-4">{nextShift.clientName}</h3>
              <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{nextShift.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              <button 
                onClick={() => navigate(`/agent/shifts/${getGroupKey(nextShift)}`)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-sm transition-colors border border-zinc-700 active:scale-[0.98]"
              >
                Details
              </button>
              <button className="bg-apex-gold hover:bg-yellow-500 text-black font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-apex-gold/10 active:scale-[0.98]">
                <Navigation className="w-3.5 h-3.5" /> Navigatie
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center backdrop-blur-sm">
            <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Geen diensten gepland.</p>
          </div>
        )}
      </section>

      {/* 3) TIJDREGISTRATIE (CTA) */}
      <section>
        <div className={clsx(
           "relative overflow-hidden rounded-2xl border backdrop-blur-sm p-1 transition-all",
           activeShift ? "border-green-500/30 bg-green-900/10" : "border-zinc-800 bg-zinc-900/40"
        )}>
          {activeShift ? (
             <button 
                onClick={() => handleTimeAction('in')}
                className="w-full bg-gradient-to-r from-green-900/80 to-green-800/80 border border-green-500/30 p-6 rounded-xl group relative overflow-hidden active:scale-[0.99] transition-all"
             >
                <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-between relative z-10">
                   <div className="text-left">
                      <div className="text-green-400 font-black text-lg uppercase tracking-tight flex items-center gap-2">
                         <Play className="w-5 h-5 fill-current animate-pulse" /> Inklokken
                      </div>
                      <div className="text-green-200/60 text-xs mt-1 font-mono">Shift actief • {activeShift.clientName}</div>
                   </div>
                   <Clock className="w-8 h-8 text-green-500 opacity-50 group-hover:scale-110 transition-transform" />
                </div>
             </button>
          ) : (
             <div className="w-full bg-zinc-900/50 p-6 rounded-xl flex items-center justify-between">
                <div className="text-left">
                   <div className="text-zinc-500 font-bold text-lg uppercase tracking-tight flex items-center gap-2">
                      <Clock className="w-5 h-5" /> Geen Actieve Shift
                   </div>
                   <div className="text-zinc-600 text-xs mt-1">{getClockInAvailability()}</div>
                </div>
             </div>
          )}
        </div>
      </section>

      {/* 4) BESCHIKBAAR (Preview) */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-blue-500" />
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Beschikbaar</h2>
          </div>
          <button 
            onClick={() => navigate('/agent/shifts')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Alles zien
          </button>
        </div>

        {openShifts.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x no-scrollbar">
            {openShifts.map((shift, idx) => (
              <div 
                key={idx}
                className="min-w-[260px] snap-center bg-zinc-900/40 border border-white/5 rounded-xl p-4 backdrop-blur-sm hover:bg-zinc-900/60 transition-colors group"
              >
                <div className="flex justify-between items-start mb-3">
                   <div className="flex flex-col">
                      <span className="text-white font-bold text-sm truncate max-w-[140px]">{shift.clientName}</span>
                      <span className="text-zinc-500 text-xs truncate max-w-[140px]">{shift.location}</span>
                   </div>
                   <span className="text-[10px] font-bold bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded border border-blue-900/30">
                      OPEN
                   </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4 bg-zinc-950/50 p-2 rounded">
                   <Calendar className="w-3 h-3" />
                   {new Date(shift.startTime).toLocaleDateString([], {day:'numeric', month:'short'})} • 
                   {new Date(shift.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </div>

                <button 
                   onClick={() => navigate(`/agent/shifts/${getGroupKey(shift)}`)}
                   className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-zinc-700 transition-all active:scale-95"
                >
                   Bekijken & Opgeven
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 border border-zinc-800 border-dashed rounded-xl flex items-center justify-between bg-zinc-900/20">
             <p className="text-zinc-500 text-sm italic">Geen open diensten beschikbaar.</p>
             <button onClick={handleRefresh} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors">
                <RefreshCw className={clsx("w-4 h-4 text-zinc-400", isRefreshing && "animate-spin")} />
             </button>
          </div>
        )}
      </section>

      {/* 5) SNELLE ACTIES */}
      <section>
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Snelle Acties</h2>
        <div className="grid grid-cols-2 gap-3">
           <div 
              onClick={() => navigate('/agent/incidenten')}
              className="bg-zinc-900/50 border border-zinc-800 hover:border-red-900/50 p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-[0.98] cursor-pointer group backdrop-blur-sm"
           >
              <div className="w-10 h-10 bg-red-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                 <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-center">
                 <span className="text-xs font-bold text-white block">Incident</span>
                 <span className="text-[10px] text-zinc-500 block">Melden met foto</span>
              </div>
           </div>
           
           <div 
              onClick={() => navigate('/agent/rapporten')}
              className="bg-zinc-900/50 border border-zinc-800 hover:border-blue-900/50 p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-[0.98] cursor-pointer group backdrop-blur-sm"
           >
              <div className="w-10 h-10 bg-blue-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                 <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-center">
                 <span className="text-xs font-bold text-white block">Rapport</span>
                 <span className="text-[10px] text-zinc-500 block">Verslag opmaken</span>
              </div>
           </div>
        </div>
      </section>

      {/* 6) UPDATES (Live) */}
      <section>
         <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-zinc-500" />
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Updates</h2>
         </div>
         <div className="space-y-2">
            {updates.slice(0, 5).map((update, i) => (
               <div key={update.id} className="flex items-center gap-3 p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg backdrop-blur-sm hover:bg-zinc-900/50 transition-colors group">
                  <div className="relative">
                     <div className="bg-zinc-950 p-1.5 rounded-md border border-zinc-800">
                        {getUpdateIcon(update.type)}
                     </div>
                     {i < 1 && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-zinc-900" />
                     )}
                  </div>
                  <div className="min-w-0 flex-1">
                     <span className="text-sm text-zinc-300 block truncate group-hover:text-white transition-colors">{update.text}</span>
                     <span className="text-[10px] text-zinc-600 font-mono">{formatUpdateTime(update.timestamp)}</span>
                  </div>
               </div>
            ))}
            {updates.length === 0 && (
                <div className="text-xs text-zinc-500 italic p-2 text-center">Geen recente updates.</div>
            )}
         </div>
      </section>

    </div>
  );
};