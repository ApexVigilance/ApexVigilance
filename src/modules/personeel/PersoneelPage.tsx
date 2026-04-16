import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { EmptyState } from '../../ui/EmptyState';
import { Search, Inbox, ShieldAlert, CheckCircle2, ChevronRight, Download, Printer } from 'lucide-react';
import clsx from 'clsx';
import { generatePersoneelListPdf } from './utils/generatePersoneelPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';

export const PersoneelPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { employees } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Review' | 'BadgeAlert'>('All');

  // Helper to check pending
  const hasPendingItems = (e: any) => 
      e.personalInfoStatus === 'PENDING' || 
      e.idCardStatus === 'PENDING' || 
      e.badgeDataStatus === 'PENDING';

  const filteredEmployees = employees.filter(emp => {
    // Search Logic
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (emp.badgeNr && emp.badgeNr.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Filter Logic
    const now = new Date();
    const expiryDate = emp.badgeExpiry ? new Date(emp.badgeExpiry) : null;
    const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    const isBadgeAlert = expiryDate ? daysToExpiry < 60 : false;

    switch (activeFilter) {
      case 'Active': return emp.status === 'Active';
      case 'Review': return hasPendingItems(emp);
      case 'BadgeAlert': return isBadgeAlert && emp.status === 'Active';
      default: return true;
    }
  }).sort((a, b) => {
      // Sort logic: Pending first, then Badge urgency
      const aPending = hasPendingItems(a);
      const bPending = hasPendingItems(b);
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      if (!a.badgeExpiry) return 1;
      if (!b.badgeExpiry) return -1;
      return new Date(a.badgeExpiry).getTime() - new Date(b.badgeExpiry).getTime();
  });

  const handleDownload = () => {
    const { blob, filename } = generatePersoneelListPdf(filteredEmployees, activeFilter);
    downloadPdf(blob, filename);
  };

  const handlePrint = () => {
    const { blob } = generatePersoneelListPdf(filteredEmployees, activeFilter);
    printPdfBlob(blob);
  };

  const FilterButton = ({ filter, label, icon: Icon, count }: { filter: typeof activeFilter, label: string, icon?: any, count?: number }) => (
    <button
      onClick={() => setActiveFilter(filter)}
      className={clsx(
        "px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5",
        activeFilter === filter 
          ? "bg-apex-gold text-black border-apex-gold shadow-md" 
          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
      )}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
      {count !== undefined && count > 0 && (
          <span className={clsx("ml-1 px-1.5 rounded-full text-[9px]", activeFilter === filter ? "bg-black text-white" : "bg-zinc-700 text-zinc-300")}>{count}</span>
      )}
    </button>
  );

  const pendingCount = employees.filter(e => hasPendingItems(e)).length;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">{t('personeel.title')}</h2>
          <p className="text-zinc-400 mt-1">{t('personeel.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
           <div className="flex gap-2">
             <button 
               onClick={handleDownload}
               className="bg-zinc-800 text-white px-3 py-2 rounded-lg font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"
             >
               <Download className="w-4 h-4" /> Download PDF
             </button>
             <button 
               onClick={handlePrint}
               className="bg-zinc-800 text-white px-3 py-2 rounded-lg font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"
             >
               <Printer className="w-4 h-4" /> Afdrukken
             </button>
           </div>
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                  type="text" 
                  placeholder={t('common.search')} 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-sm text-white focus:border-apex-gold focus:outline-none"
              />
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6 items-center bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50">
         <FilterButton filter="All" label="Alle" />
         <FilterButton filter="Active" label="Actief" icon={CheckCircle2} />
         <div className="w-px h-6 bg-zinc-800 mx-1"></div>
         <FilterButton filter="Review" label="Te Beoordelen" icon={Inbox} count={pendingCount} />
         <FilterButton filter="BadgeAlert" label="Badge Verloop" icon={ShieldAlert} />
         
         <div className="ml-auto text-xs text-zinc-500 font-mono hidden md:block px-2">
            {filteredEmployees.length} resultaten
         </div>
      </div>

      {/* List */}
      {filteredEmployees.length === 0 ? <EmptyState message="Geen personeelsleden gevonden." /> : (
        <div className="grid gap-3">
          {filteredEmployees.map(emp => {
             const now = new Date();
             const expiryDate = emp.badgeExpiry ? new Date(emp.badgeExpiry) : null;
             const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
             
             const isExpired = daysToExpiry < 0;
             const isCritical = daysToExpiry >= 0 && daysToExpiry < 15;
             const isWarning = daysToExpiry >= 15 && daysToExpiry < 60;
             
             const isPending = hasPendingItems(emp);
             const isActive = emp.status === 'Active';

             return (
              <div 
                key={emp.id} 
                onClick={() => navigate(`/personeel/${emp.id}`)}
                className={clsx(
                    "bg-zinc-900 border p-4 pt-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all cursor-pointer group relative overflow-hidden",
                    isActive ? "hover:border-apex-gold hover:shadow-lg" : "opacity-70 grayscale-[0.5]",
                    isPending ? "border-orange-500/50 bg-orange-900/5" : "border-zinc-800"
                )}
              >
                {/* Status Indicator Strip */}
                <div className={clsx("absolute left-0 top-0 bottom-0 w-1", 
                    isPending ? "bg-orange-500" :
                    isExpired ? "bg-red-600" : isCritical ? "bg-red-500" : isWarning ? "bg-yellow-500" : isActive ? "bg-green-600" : "bg-zinc-600"
                )} />

                <div className="flex items-center gap-4 mb-3 sm:mb-0 w-full sm:w-auto mt-1 pl-2">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-apex-gold font-bold text-lg border border-zinc-700 shadow-inner shrink-0 relative">
                     {emp.name.charAt(0)}
                     {emp.badgePhotoUrl && (
                         <img src={emp.badgePhotoUrl} className="absolute inset-0 w-full h-full object-cover rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                     )}
                     {isPending && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-zinc-900" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white group-hover:text-apex-gold transition-colors truncate">{emp.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                       <span className="uppercase bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] tracking-wide font-bold">{emp.role}</span>
                       <span className="hidden sm:inline">•</span>
                       <span className="font-mono text-zinc-500">{emp.badgeNr || 'Geen Badge'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                  {/* Badge Status Chips */}
                  <div className="flex gap-2">
                    {isPending && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-orange-950 text-orange-500 px-2 py-1 rounded border border-orange-900">
                            <Inbox className="w-3 h-3" /> TE BEOORDELEN
                        </span>
                    )}
                    {isExpired && isActive && !isPending && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-red-950 text-red-500 px-2 py-1 rounded border border-red-900">
                            <ShieldAlert className="w-3 h-3" /> VERLOPEN
                        </span>
                    )}
                    {isCritical && isActive && !isPending && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-red-900/40 text-red-500 px-2 py-1 rounded border border-red-900 animate-pulse">
                            <ShieldAlert className="w-3 h-3" /> DRINGEND
                        </span>
                    )}
                    {isWarning && isActive && !isPending && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-yellow-900/20 text-yellow-500 px-2 py-1 rounded border border-yellow-900/30">
                            <ShieldAlert className="w-3 h-3" /> BINNENKORT
                        </span>
                    )}
                  </div>
                  
                  <div className={clsx("px-3 py-1 rounded text-xs font-bold uppercase tracking-wider min-w-[80px] text-center hidden sm:block", 
                     emp.status === 'Active' ? 'bg-zinc-950 text-zinc-400 border border-zinc-800' : 'bg-red-900/10 text-red-900 border border-red-900/20'
                  )}>
                    {emp.status === 'Active' ? 'Actief' : 'Inactief'}
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
              </div>
             );
          })}
        </div>
      )}
    </div>
  );
};