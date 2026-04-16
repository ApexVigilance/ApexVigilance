
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, FullIncident, IncidentStatus, IncidentType } from '../../data/store';
import { Plus, AlertTriangle, MapPin, User, ChevronRight, Clock, Tag, X, Upload, Printer, CheckCircle, Mail, AlertOctagon } from 'lucide-react';
import clsx from 'clsx';
import { NewIncidentModal } from './components/NewIncidentModal';

export const IncidentenPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('fr') ? 'fr-BE' : 'nl-BE';
  const navigate = useNavigate();
  const { incidents, shifts, createIncident } = useStore();
  
  const [activeTab, setActiveTab] = useState<IncidentStatus | 'All'>('Submitted');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const filteredIncidents = incidents.filter(i => 
      activeTab === 'All' ? true : i.status === activeTab
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const TabButton = ({ status, label }: { status: IncidentStatus | 'All'; label: string }) => (
    <button
      onClick={() => setActiveTab(status)}
      className={clsx(
        "pb-3 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
        activeTab === status 
          ? "border-apex-gold text-white" 
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      )}
    >
      {label}
      <span className={clsx("text-xs py-0.5 px-2 rounded-full", activeTab === status ? "bg-apex-gold text-black" : "bg-zinc-800 text-zinc-400")}>
        {status === 'All' ? incidents.length : incidents.filter(i => i.status === status).length}
      </span>
    </button>
  );

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white uppercase tracking-tight">{t('incidenten.title')}</h2>
           <p className="text-zinc-400 mt-1">{t('incidenten.subtitle')}</p>
        </div>
        <button 
           onClick={() => setIsCreateModalOpen(true)}
           className="bg-apex-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-apex-gold/20 flex items-center gap-2 active:scale-95"
        >
           <Plus className="w-5 h-5" /> {t('incidenten.newTitle')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-end">
        <div className="flex space-x-1 border-b border-zinc-800 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <TabButton status="Submitted" label={t('incidenten.tabs.submitted')} />
          <TabButton status="Approved" label={t('incidenten.tabs.approved')} />
          <TabButton status="Rejected" label={t('incidenten.tabs.rejected')} />
          <TabButton status="Draft" label={t('incidenten.status.Draft')} />
          <TabButton status="Archived" label={t('incidenten.tabs.archived')} />
          <TabButton status="All" label={t('incidenten.tabs.all')} />
        </div>
      </div>

      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
           <div className="py-16 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
             <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>{t('incidenten.emptyList')}</p>
           </div>
        ) : (
           filteredIncidents.map(inc => {
             const shift = shifts.find(s => s.id === inc.shiftId);
             
             return (
               <Link 
                 to={`/incidenten/${inc.id}`} 
                 key={inc.id} 
                 className="block group relative"
               >
                 <div className={clsx(
                   "bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between",
                   "transition-all duration-200 hover:shadow-[0_0_25px_rgba(212,175,55,0.08)] hover:border-apex-gold/30 hover:bg-zinc-900",
                   "active:scale-[0.99] relative overflow-hidden backdrop-blur-sm"
                 )}>
                   
                   {/* Status Indicator Strip */}
                   <div className={clsx("absolute left-0 top-0 bottom-0 w-1 transition-colors", 
                      inc.status === 'Draft' ? 'bg-zinc-600' :
                      inc.status === 'Approved' ? 'bg-green-500' :
                      inc.status === 'Rejected' ? 'bg-red-500' :
                      'bg-blue-500'
                   )} />

                   <div className="flex items-start gap-5 pl-2">
                      <div className="h-12 w-12 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-400 shrink-0 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                        {inc.type === 'Complaint' ? <AlertOctagon className="w-6 h-6 text-orange-500" /> : <AlertTriangle className="w-6 h-6 text-red-500" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                           <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded uppercase border backdrop-blur-sm",
                              inc.status === 'Submitted' ? "bg-blue-900/20 text-blue-400 border-blue-900/30" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                           )}>
                              {t(`incidenten.status.${inc.status}`)}
                           </span>
                           <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded uppercase border backdrop-blur-sm",
                              inc.severity === 'Critical' ? "bg-purple-900/20 text-purple-400 border-purple-900/30" :
                              inc.severity === 'High' ? "bg-red-900/20 text-red-400 border-red-900/30" :
                              inc.severity === 'Medium' ? "bg-orange-900/20 text-orange-400 border-orange-900/30" : 
                              "bg-blue-900/20 text-blue-400 border-blue-900/30"
                           )}>
                              {t(`incidenten.severity.${inc.severity}`)}
                           </span>
                           <span className="text-zinc-500 text-xs font-mono">{new Date(inc.date).toLocaleDateString(locale)}</span>
                        </div>
                        <h4 className="text-white font-bold text-lg group-hover:text-apex-gold transition-colors truncate pr-4">
                           {inc.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-zinc-400">
                           <span className="flex items-center gap-1.5">
                              <User className="w-3 h-3" /> {inc.auditLog[0]?.user || 'Unknown'}
                           </span>
                           {shift && (
                              <span className="flex items-center gap-1.5">
                                 <MapPin className="w-3 h-3" /> {shift.clientName}
                              </span>
                           )}
                        </div>
                      </div>
                   </div>

                   <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-4 pl-2 md:pl-0">
                      <div className="bg-zinc-950 p-2 rounded-full border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                         <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white" />
                      </div>
                   </div>
                 </div>
               </Link>
             );
           })
        )}
      </div>

      <NewIncidentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
};
