
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Users, 
  ChevronRight, 
  CalendarPlus, 
  Clock, 
  FileText, 
  Activity, 
  CheckCircle2,
  Bell,
  BellOff,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { shifts, incidents, employees, updates } = useStore();
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'ALERT' | 'INFO' | 'SUCCESS'>('ALL');

  // KPI DATA CALCULATIONS
  const activeShiftsCount = shifts.filter(s => s.status === 'Active').length;
  // BEWIJS: status 'Submitted' matcht met IncidentStatus type in types.ts en de default tab in IncidentenPage
  const openIncidentsCount = incidents.filter(i => i.status === 'Submitted').length;
  const totalGuardsCount = employees.length;

  const kpiCards = [
    {
      label: t('dashboard.kpi.activeShifts'),
      value: activeShiftsCount,
      subLabel: 'Real-time actief',
      icon: ShieldAlert,
      path: '/shifts',
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/10 to-transparent',
      borderColor: 'group-hover:border-emerald-500/30'
    },
    {
      label: t('dashboard.kpi.openIncidents'),
      value: openIncidentsCount,
      subLabel: 'Wacht op review',
      icon: AlertTriangle,
      path: '/incidenten',
      color: 'text-red-500',
      bgGradient: 'from-red-500/10 to-transparent',
      borderColor: 'group-hover:border-red-500/30'
    },
    {
      label: t('dashboard.kpi.totalGuards'),
      value: totalGuardsCount,
      subLabel: 'In personeelsbestand',
      icon: Users,
      path: '/personeel',
      color: 'text-apex-gold',
      bgGradient: 'from-yellow-500/10 to-transparent',
      borderColor: 'group-hover:border-apex-gold/30'
    }
  ];

  // Live activity processing
  const filteredActivities = (updates || [])
    .map(u => {
        let statusKey: 'ALERT' | 'INFO' | 'SUCCESS' = 'INFO';
        let icon = Bell;
        let color = 'text-blue-400';

        if (u.type === 'badge') {
            statusKey = 'ALERT';
            icon = ShieldAlert;
            color = 'text-red-500';
        } else if (u.type === 'planning') {
            statusKey = 'INFO';
            icon = CalendarPlus;
            color = 'text-apex-gold';
        } else if (u.text.toLowerCase().includes('goedgekeurd') || u.text.toLowerCase().includes('ok')) {
            statusKey = 'SUCCESS';
            icon = CheckCircle2;
            color = 'text-green-500';
        }

        return {
            id: u.id,
            text: u.text,
            time: new Date(u.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            statusKey,
            icon,
            color,
            timestamp: new Date(u.timestamp)
        };
    })
    .filter(a => activityFilter === 'ALL' || a.statusKey === activityFilter)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // BEWIJS: Alle paden komen exact overeen met router definities in routes.tsx
  const quickActions = [
    { label: t('dashboard.action.newShift'), sub: 'Plan direct in', icon: CalendarPlus, path: '/planning', color: 'text-blue-400', primary: true },
    { label: t('dashboard.action.reportIncident'), sub: 'Dossier aanmaken', icon: AlertTriangle, path: '/incidenten', color: 'text-red-400', primary: false },
    { label: t('dashboard.action.timeLogs'), sub: 'Bekijk pointages', icon: Clock, path: '/tijdregistraties', color: 'text-emerald-400', primary: false },
    { label: t('dashboard.action.reports'), sub: 'Alle verslagen', icon: FileText, path: '/rapporten', color: 'text-apex-gold', primary: false },
  ];

  return (
    <div className="relative space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-apex-gold/5 rounded-full blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] opacity-20" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight drop-shadow-lg">
            {t('dashboard.title')}
          </h2>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-zinc-400 text-sm md:text-base">{t('dashboard.subtitle')}</p>
             <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-black/40 border border-green-500/20 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-400 tracking-wider uppercase">{t('dashboard.live')}</span>
             </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {kpiCards.map((kpi, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(kpi.path)}
            className={clsx(
              "group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md p-5 md:p-6 cursor-pointer transition-all duration-300",
              "hover:-translate-y-1 hover:shadow-2xl hover:bg-zinc-900/60 active:scale-[0.98]",
              kpi.borderColor
            )}
          >
             <div className={clsx("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", kpi.bgGradient)} />
             <div className="relative flex justify-between items-start">
                <div>
                   <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover:text-zinc-400 transition-colors">
                     {kpi.label}
                   </p>
                   <p className={clsx("text-4xl md:text-5xl font-black tracking-tighter drop-shadow-sm", kpi.color)}>
                     {kpi.value}
                   </p>
                   <p className="text-[10px] font-mono text-zinc-500 mt-2 flex items-center gap-1">
                     {kpi.subLabel}
                   </p>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-xl border border-white/5 shadow-inner">
                   <kpi.icon className={clsx("w-6 h-6 transition-transform group-hover:scale-110", kpi.color)} />
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Live Activity Feed */}
        <div className="lg:col-span-2 flex flex-col gap-4">
           <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Activity className="w-5 h-5 text-apex-gold" />
                 {t('dashboard.activity.title')}
              </h3>
              
              <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 backdrop-blur-sm">
                 {(['ALL', 'ALERT', 'INFO', 'SUCCESS'] as const).map((filter) => (
                    <button
                       key={filter}
                       onClick={() => setActivityFilter(filter)}
                       className={clsx(
                          "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                          activityFilter === filter 
                             ? "bg-zinc-800 text-white shadow-sm" 
                             : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                       )}
                    >
                       {filter === 'ALL' ? 'Alles' : filter === 'ALERT' ? 'Alarm' : filter === 'INFO' ? 'Info' : 'OK'}
                    </button>
                 ))}
              </div>
           </div>

           <div className="relative rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md overflow-hidden min-h-[300px]">
              {filteredActivities.length === 0 ? (
                 <div className="p-12 text-center flex flex-col items-center justify-center h-full text-zinc-500">
                    <BellOff className="w-8 h-8 mb-2 opacity-20" />
                    <span className="italic">{t('dashboard.activity.empty')}</span>
                 </div>
              ) : (
                 <div className="divide-y divide-zinc-800/50">
                    {filteredActivities.map((act) => (
                       <div key={act.id} className={clsx(
                          "p-4 flex items-center justify-between hover:bg-white/5 transition-colors group relative overflow-hidden",
                          act.statusKey === 'ALERT' && "bg-red-900/5"
                       )}>
                          <div className="flex items-center gap-4">
                             <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg",
                                act.statusKey === 'ALERT' ? "bg-red-950/50 border-red-500/30 text-red-500" :
                                act.statusKey === 'SUCCESS' ? "bg-green-950/50 border-green-500/30 text-green-500" :
                                "bg-zinc-800/50 border-zinc-700/50 text-blue-400"
                             )}>
                                <act.icon className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{act.text}</p>
                                <p className="text-xs text-zinc-500 font-mono mt-0.5">{act.time}</p>
                             </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500" />
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-4">
           <h3 className="text-lg font-bold text-white">
              {t('dashboard.quickActions.title')}
           </h3>
           <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, idx) => (
                 <button 
                    key={idx}
                    onClick={() => navigate(action.path)}
                    className={clsx(
                       "relative flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm transition-all duration-300 group text-left",
                       action.primary 
                          ? "bg-gradient-to-br from-zinc-800 to-zinc-900 border-apex-gold/30 hover:border-apex-gold"
                          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-600"
                    )}
                 >
                    <div className="flex items-center gap-4">
                       <div className={clsx(
                          "p-2.5 rounded-xl border shadow-inner transition-colors", 
                          action.primary ? "bg-apex-gold text-black border-apex-gold" : "bg-zinc-950 border-zinc-800 group-hover:border-zinc-700",
                          !action.primary && action.color
                       )}>
                          <action.icon className="w-5 h-5" />
                       </div>
                       <div>
                          <span className={clsx("block font-bold text-sm", action.primary ? "text-white" : "text-zinc-300 group-hover:text-white")}>
                             {action.label}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">
                             {action.sub}
                          </span>
                       </div>
                    </div>
                    <Zap className={clsx("w-4 h-4 transition-all opacity-0 group-hover:opacity-100", action.primary ? "text-apex-gold" : "text-zinc-600")} />
                 </button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
