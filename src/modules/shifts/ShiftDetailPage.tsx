import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../../ui/BackButton';
import { useStore, getGroupKey } from '../../data/store';
import { Shift } from '../../data/types';
import { EditShiftModal } from './components/EditShiftModal';
import { ApplicationsPanel } from './components/ApplicationsPanel';
import { 
  Calendar, MapPin, Clock, Users, Trash2, CheckCircle2, ShieldAlert,
  Search, CircleDashed, X, ShieldCheck, Download, Tag, Edit, Activity, UserPlus, Info, CheckSquare, ZapOff, Printer
} from 'lucide-react';
import clsx from 'clsx';
import { generateShiftDetailPdf } from './utils/generateShiftsPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';

export const ShiftDetailPage: React.FC = () => {
  const { id } = useParams(); // This is the shift ID acting as entry point
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { shifts, employees, applications, deleteShift, deleteGroup, approveApplication, rejectApplication, timeLogs, updateShift } = useStore();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetSlotId, setTargetSlotId] = useState<string | null>(null);
  const [agentSearch, setAgentSearch] = useState('');

  const activeTab = searchParams.get('tab') || 'details';
  const setTab = (tab: string) => setSearchParams({ tab });

  // 1. Find representative shift
  const representativeShift = shifts.find(s => s.id === id);

  // 2. Find group
  const groupShifts = useMemo(() => {
    if (!representativeShift) return [];
    return shifts.filter(s => s.groupId === representativeShift.groupId);
  }, [shifts, representativeShift]);

  // Redirect if deleted
  useEffect(() => {
      if (!representativeShift) {
          navigate('/shifts');
      }
  }, [representativeShift, navigate]);

  if (!representativeShift || groupShifts.length === 0) {
    return <div className="text-white p-8 text-center">Shift niet gevonden.</div>;
  }

  const assignedCount = groupShifts.filter(s => s.employeeId).length;
  const isFull = assignedCount === groupShifts.length;
  const reqRole = representativeShift.requiredRole === 'Senior' ? t('roles.senior') : t('roles.guard');
  
  // Pending Applications
  const groupHash = getGroupKey(representativeShift.clientName, representativeShift.location, representativeShift.startTime, representativeShift.endTime);
  const pendingApps = applications.filter(a => 
      (a.groupId === representativeShift.groupId || a.shiftGroupHash === groupHash) && 
      a.status === 'PENDING'
  );
  
  // History: Approved, Rejected, Withdrawn
  const historyApps = applications.filter(a => 
    (a.groupId === representativeShift.groupId || a.shiftGroupHash === groupHash) && 
    (a.status === 'APPROVED' || a.status === 'REJECTED' || a.status === 'WITHDRAWN')
  ).sort((a, b) => new Date(b.decidedAt || b.createdAt).getTime() - new Date(a.decidedAt || a.createdAt).getTime());

  // Check for any active timelogs associated with this shift group
  const activeTimeLogs = timeLogs.filter(log => groupShifts.some(s => s.id === log.shiftId));

  // --- ACTIONS ---

  const handleAssign = (employeeId: string) => {
    if (targetSlotId) {
      updateShift(targetSlotId, { employeeId, status: 'Scheduled' });
      setIsAssignModalOpen(false);
      setTargetSlotId(null);
    }
  };

  const handleUnassign = (shiftId: string) => {
    if (confirm('Agent verwijderen van deze shift?')) {
      updateShift(shiftId, { employeeId: '', status: 'Scheduled' });
    }
  };

  const handleDeleteSlot = (shift: Shift) => {
      let msg = "Weet je zeker dat je dit specifieke slot wilt verwijderen?";
      if (shift.employeeId) {
          msg = `LET OP: Er is een agent toegewezen. Verwijderen?`;
      }
      if (confirm(msg)) {
          deleteShift(shift.id);
      }
  };

  const handleDeleteGroup = () => {
      let confirmMsg = `Weet je zeker dat je de VOLLEDIGE GROEP (${groupShifts.length} slots) wilt verwijderen?`;
      if (assignedCount > 0) confirmMsg += "\n\nEr is personeel toegewezen. Zeker verwijderen?";
      if (pendingApps.length > 0) confirmMsg += "\n\nEr zijn openstaande aanvragen. Deze worden geannuleerd.";
      
      if (confirm(confirmMsg)) {
          deleteGroup(representativeShift.groupId);
          navigate('/shifts');
      }
  };

  const handleDownload = () => {
    const { blob, filename } = generateShiftDetailPdf(representativeShift, groupShifts, employees, pendingApps);
    downloadPdf(blob, filename);
  };

  const handlePrint = () => {
    const { blob } = generateShiftDetailPdf(representativeShift, groupShifts, employees, pendingApps);
    printPdfBlob(blob);
  };

  const handleApproveApp = (appId: string) => {
      const res = approveApplication(appId, 'Admin');
      if (!res.success) alert(res.error);
  };

  const handleRejectApp = (appId: string, reason?: string) => {
      rejectApplication(appId, 'Admin', reason);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in">
      <BackButton />

      {/* HEADER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-3xl font-bold text-white uppercase tracking-tight">{representativeShift.clientName}</h1>
                 <span className={clsx(
                    "px-3 py-1 rounded-full text-sm font-bold border", 
                    isFull 
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" 
                      : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                 )}>
                    {isFull ? t('shifts.status.full') : t('shifts.status.open')}
                 </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-zinc-400">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {representativeShift.location}</span>
                {representativeShift.exeCode && <span className="flex items-center gap-2 font-bold bg-zinc-800 px-2 py-0.5 rounded text-white text-xs"><Tag className="w-3 h-3" /> {representativeShift.exeCode}</span>}
              </div>
           </div>
           
           <div className="flex gap-2">
              <button onClick={handleDownload} className="bg-zinc-800 text-white px-4 py-2 rounded font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"><Download className="w-4 h-4" /> Download PDF</button>
              <button onClick={handlePrint} className="bg-zinc-800 text-white px-4 py-2 rounded font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"><Printer className="w-4 h-4" /> Afdrukken</button>
              <button onClick={() => setIsEditModalOpen(true)} className="bg-zinc-800 text-white px-4 py-2 rounded font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"><Edit className="w-4 h-4" /> Bewerk</button>
              <button onClick={handleDeleteGroup} className="bg-red-900/20 text-red-500 px-4 py-2 rounded font-bold hover:bg-red-900/40 transition-colors flex items-center gap-2 border border-red-900/50"><Trash2 className="w-4 h-4" /> Opdracht Verwijderen</button>
           </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto">
          <button 
            onClick={() => setTab('details')}
            className={clsx("px-6 py-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap", activeTab === 'details' ? "border-blue-500 text-blue-500" : "border-transparent text-zinc-500 hover:text-zinc-300")}
          >
            <Info className="w-4 h-4" /> Details & Planning
          </button>
          <button 
            onClick={() => setTab('live')}
            className={clsx("px-6 py-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap", activeTab === 'live' ? "border-green-500 text-green-500" : "border-transparent text-zinc-500 hover:text-zinc-300")}
          >
            <Activity className="w-4 h-4" /> Status Monitor
          </button>
          <button 
            onClick={() => setTab('aanmeldingen')}
            className={clsx("px-6 py-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap", activeTab === 'aanmeldingen' ? "border-apex-gold text-apex-gold" : "border-transparent text-zinc-500 hover:text-zinc-300")}
          >
            <UserPlus className="w-4 h-4" /> Aanmeldingen
            {pendingApps.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">{pendingApps.length}</span>}
          </button>
      </div>

      {/* TAB CONTENT: DETAILS */}
      {activeTab === 'details' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-apex-gold" /> Toegewezen Personeel</h3>
            <div className="space-y-3">
               {groupShifts.map((shift, idx) => {
                  const employee = employees.find(e => e.id === shift.employeeId);
                  return (
                     <div key={shift.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center justify-between group transition-colors hover:border-zinc-700">
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-500 font-bold border border-zinc-800">{idx + 1}</div>
                           {employee ? (
                              <div>
                                 <div className="font-bold text-white">{employee.name}</div>
                                 <div className="text-xs text-zinc-500 font-mono">{employee.badgeNr} • {employee.role === 'Guard' ? t('roles.guard') : t('roles.senior')}</div>
                              </div>
                           ) : (
                              <div className="text-zinc-500 italic flex items-center gap-2"><CircleDashed className="w-4 h-4" /> Open positie</div>
                           )}
                        </div>
                        <div className="flex items-center gap-2">
                           {employee ? (
                              <button onClick={() => handleUnassign(shift.id)} className="text-zinc-600 hover:text-red-500 p-2 transition-colors border border-zinc-800 rounded bg-zinc-950" title="Agent ontkoppelen"><X className="w-4 h-4" /></button>
                           ) : (
                              <button onClick={() => { setTargetSlotId(shift.id); setIsAssignModalOpen(true); }} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors border border-zinc-700">Toewijzen</button>
                           )}
                           <button onClick={() => handleDeleteSlot(shift)} className="text-zinc-600 hover:text-red-600 p-2 border border-zinc-800 rounded bg-zinc-950 hover:bg-red-900/10" title="Slot verwijderen"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         <div className="space-y-6 h-fit">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-apex-gold" /> Vereisten</h3>
                <div className="space-y-4">
                   <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Min. Rol</label>
                      <div className="text-white font-bold">{reqRole}</div>
                   </div>
                   {representativeShift.exeCode && (
                       <div>
                          <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">EXE Code</label>
                          <div className="text-white font-mono bg-zinc-950 px-2 py-1 rounded inline-block border border-zinc-800">{representativeShift.exeCode}</div>
                       </div>
                   )}
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase flex items-center gap-2"><Info className="w-4 h-4 text-apex-gold" /> Briefing</h3>
                    <button onClick={() => setIsEditModalOpen(true)} className="text-xs text-apex-gold hover:underline">Bewerken</button>
                </div>
                <div className="text-zinc-300 text-sm whitespace-pre-wrap bg-zinc-950 p-3 rounded border border-zinc-800">
                    {representativeShift.briefing || 'Geen briefing opgegeven.'}
                </div>
            </div>
         </div>
      </div>
      )}

      {/* TAB CONTENT: LIVE */}
      {activeTab === 'live' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-zinc-800 rounded-full border border-zinc-700">
                      <Activity className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-white">{t('shifts.monitor.title')}</h3>
                      <p className="text-sm text-zinc-400">{t('shifts.monitor.subtitle')}</p>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTimeLogs.length > 0 ? activeTimeLogs.map(log => {
                      const emp = employees.find(e => e.id === log.employeeId);
                      return (
                          <div key={log.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex justify-between items-center">
                              <div>
                                  <div className="font-bold text-white">{emp?.name || 'Onbekend'}</div>
                                  <div className="text-xs text-zinc-500 mt-1">
                                      {t('shifts.monitor.clockedIn')}: {new Date(log.clockIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                  </div>
                              </div>
                              <span className={clsx("px-2 py-1 rounded text-xs font-bold uppercase border", 
                                  log.currentStatus === 'IN_DIENST' ? "bg-green-900/20 text-green-500 border-green-900/50" : 
                                  log.currentStatus === 'PAUZE' ? "bg-orange-900/20 text-orange-500 border-orange-900/50" :
                                  log.currentStatus === 'AFGEROND' ? "bg-zinc-800 text-zinc-400 border-zinc-700" :
                                  "bg-zinc-800 text-zinc-500 border-zinc-700"
                              )}>
                                  {log.currentStatus}
                              </span>
                          </div>
                      );
                  }) : (
                      <div className="col-span-2 text-center text-zinc-500 italic py-8 border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/50">
                          {t('shifts.monitor.offline')}
                      </div>
                  )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                  <p className="text-xs text-zinc-500">
                      Data wordt bijgewerkt bij elke statuswijziging.
                  </p>
              </div>
          </div>
      )}

      {/* TAB CONTENT: AANMELDINGEN */}
      {activeTab === 'aanmeldingen' && (
          <ApplicationsPanel 
              applications={pendingApps}
              history={historyApps}
              onApprove={handleApproveApp}
              onReject={handleRejectApp}
          />
      )}

      {/* MODALS */}
      {isAssignModalOpen && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-lg shadow-2xl h-[600px] flex flex-col">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Selecteer Agent</h3>
                  <button onClick={() => setIsAssignModalOpen(false)}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
               </div>
               <input type="text" placeholder="Zoek op naam..." value={agentSearch} onChange={e => setAgentSearch(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 mb-4 text-white outline-none focus:border-apex-gold" />
               <div className="flex-1 overflow-y-auto space-y-2">
                  {employees.filter(e => e.status === 'Active' && e.name.toLowerCase().includes(agentSearch.toLowerCase())).map(agent => (
                     <div key={agent.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded flex justify-between items-center hover:border-zinc-600 transition-colors">
                        <div><div className="font-bold text-white">{agent.name}</div><div className="text-xs text-zinc-500">{agent.role === 'Guard' ? t('roles.guard') : t('roles.senior')}</div></div>
                        <button onClick={() => handleAssign(agent.id)} className="bg-apex-gold text-black px-3 py-1 rounded text-xs font-bold uppercase">Kies</button>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}

      <EditShiftModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        shift={representativeShift}
        groupShifts={groupShifts}
      />
    </div>
  );
};