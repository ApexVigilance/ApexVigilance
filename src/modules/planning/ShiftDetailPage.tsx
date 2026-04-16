import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../../ui/BackButton';
import { useStore } from '../../data/store';
import { Shift } from '../../data/types';
import { useAuthStore } from '../../modules/auth/store';
import { 
  MapPin, Users, Trash2, CheckCircle2, ShieldAlert,
  CircleDashed, X, ShieldCheck, Download, Tag, Printer, XCircle, Check, Inbox
} from 'lucide-react';
import clsx from 'clsx';
import { generatePlanningGroupPdf } from './utils/generatePlanningPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';

export const ShiftDetailPage: React.FC = () => {
  const { id } = useParams(); // This is primarily the groupId
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { shifts, employees, deleteShift, approveShift, rejectShift, applications, approveApplication, rejectApplication, updateShift } = useStore();
  const { user } = useAuthStore();
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetSlotId, setTargetSlotId] = useState<string | null>(null);
  const [agentSearch, setAgentSearch] = useState('');

  // Group lookup by groupId
  const groupShifts = useMemo(() => {
    if (!id) return [];
    let found = shifts.filter(s => s.groupId === id);
    if (found.length === 0) {
        try {
            const criteria = JSON.parse(atob(id));
            found = shifts.filter(s => 
                s.clientName === criteria.c && 
                s.location === criteria.l && 
                s.startTime === criteria.s && 
                s.endTime === criteria.e
            );
        } catch (e) {}
    }
    return found;
  }, [shifts, id]);

  // Effect to redirect if group becomes empty
  useEffect(() => {
      if (groupShifts.length === 0 && id) {
          navigate('/planning');
      }
  }, [groupShifts.length, id, navigate]);

  if (groupShifts.length === 0) {
    return <div className="text-white p-8 text-center">Bezig met laden of groep verwijderd...</div>;
  }

  const first = groupShifts[0];
  const total = groupShifts.length;
  const assignedCount = groupShifts.filter(s => s.employeeId).length;
  const isFull = assignedCount === total;
  const reqRole = first.requiredRole || 'Guard';
  const reqCerts = first.requiredCertificates || [];

  const complianceStats = useMemo(() => {
    let roleMatches = 0;
    let certMatches = 0;
    let assignedAgents = 0;

    groupShifts.forEach(shift => {
       if (shift.employeeId) {
          assignedAgents++;
          const emp = employees.find(e => e.id === shift.employeeId);
          if (emp) {
             const roleOK = reqRole === 'Guard' || (reqRole === 'Senior' && emp.role === 'Senior');
             if (roleOK) roleMatches++;
             const hasAllCerts = reqCerts.every(c => emp.certificates?.includes(c));
             if (hasAllCerts) certMatches++;
          }
       }
    });

    return { 
        isCompliant: assignedAgents > 0 && roleMatches === assignedAgents && certMatches === assignedAgents,
        isPartial: assignedAgents > 0 && (roleMatches < assignedAgents || certMatches < assignedAgents)
    };
  }, [groupShifts, employees, reqRole, reqCerts]);

  const pendingApplications = useMemo(() => {
      if (!id || !first) return [];
      return applications.filter(a => {
          if (a.status !== 'PENDING') return false;
          if (a.groupId === id) return true;
          try {
              const criteria = JSON.parse(atob(a.shiftGroupHash));
              return criteria.c === first.clientName && criteria.l === first.location && criteria.s === first.startTime && criteria.e === first.endTime;
          } catch(e) { return false; }
      });
  }, [applications, id, first]);

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
      let msg = "Weet je zeker dat je dit slot wilt verwijderen uit de planning?";
      if (shift.employeeId) {
          msg = `LET OP: ${employees.find(e => e.id === shift.employeeId)?.name} is al toegewezen aan dit slot. Verwijderen?`;
      }

      if (confirm(msg)) {
          deleteShift(shift.id);
      }
  };

  const handleDownload = () => {
    const { blob, filename } = generatePlanningGroupPdf(groupShifts, employees);
    downloadPdf(blob, filename);
  };

  const handlePrint = () => {
    const { blob } = generatePlanningGroupPdf(groupShifts, employees);
    printPdfBlob(blob);
  };

  // ADMIN APPROVAL LOGIC
  const handleApproveShift = (shiftId: string) => {
      approveShift(shiftId, 'Admin');
  };

  const handleRejectShift = (shiftId: string) => {
      const reason = prompt('Reden van afkeuring:');
      if (reason) {
          rejectShift(shiftId, 'Admin', reason);
      }
  };

  const handleApproveApp = (appId: string) => {
      const res = approveApplication(appId, user?.id || 'Admin');
      if (!res.success) alert(res.error);
  };

  const handleRejectApp = (appId: string) => {
      if (confirm('Zeker dat je deze aanvraag wilt weigeren?')) {
          rejectApplication(appId, user?.id || 'Admin', 'Geweigerd door admin');
      }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <BackButton />

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8 relative overflow-hidden">
        {assignedCount > 0 && (
           <div className={clsx(
              "absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-xs font-black uppercase flex items-center gap-2 border-b border-l",
              complianceStats.isCompliant ? "bg-green-500 text-black border-green-600" : "bg-orange-500 text-black border-orange-600"
           )}>
              {complianceStats.isCompliant ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {complianceStats.isCompliant ? "100% CONFORM" : "AANDACHT VEREIST"}
           </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-3xl font-bold text-white uppercase tracking-tight">{first.clientName}</h1>
                 <span className={clsx("px-3 py-1 rounded-full text-sm font-bold border", isFull ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-apex-gold text-black border-yellow-600")}>
                    {isFull ? 'VOLZET' : 'OPENSTAAND'}
                 </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-zinc-400">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {first.location}</span>
                {first.exeCode && <span className="flex items-center gap-2 font-bold bg-zinc-800 px-2 py-0.5 rounded text-white text-xs"><Tag className="w-3 h-3" /> {first.exeCode}</span>}
              </div>
           </div>
           
           <div className="flex gap-4">
              <button 
                onClick={handleDownload} 
                className="bg-zinc-800 text-white px-4 py-2 rounded font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button 
                onClick={handlePrint} 
                className="bg-zinc-800 text-white px-4 py-2 rounded font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"
              >
                <Printer className="w-4 h-4" /> Afdrukken
              </button>
              <div className="flex gap-4 text-sm">
                <div className="bg-zinc-950 px-4 py-2 rounded border border-zinc-800 text-center">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase">Datum</div>
                    <div className="text-white font-bold">{new Date(first.startTime).toLocaleDateString()}</div>
                </div>
                <div className="bg-zinc-950 px-4 py-2 rounded border border-zinc-800 text-center">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase">Uur</div>
                    <div className="text-white font-mono">{new Date(first.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(first.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-apex-gold" /> Toegewezen Personeel</h3>
            <div className="space-y-3">
               {groupShifts.map((shift, idx) => {
                  const employee = employees.find(e => e.id === shift.employeeId);
                  return (
                     <div key={shift.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-500 font-bold border border-zinc-800">{idx + 1}</div>
                           <div className="flex flex-col">
                                {employee ? (
                                    <div>
                                        <div className="font-bold text-white">{employee.name}</div>
                                        <div className="text-xs text-zinc-500 font-mono">{employee.badgeNr} • {employee.role}</div>
                                    </div>
                                ) : (
                                    <div className="text-zinc-500 italic flex items-center gap-2"><CircleDashed className="w-4 h-4" /> Open positie</div>
                                )}
                                {/* STATUS & APPROVAL INDICATORS */}
                                <div className="mt-1">
                                    <span className={clsx("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border",
                                        shift.status === 'Approved' ? "bg-green-900/20 text-green-500 border-green-900/50" :
                                        shift.status === 'Rejected' ? "bg-red-900/20 text-red-500 border-red-900/50" :
                                        shift.status === 'Submitted' ? "bg-blue-900/20 text-blue-500 border-blue-900/50" :
                                        "bg-zinc-800 text-zinc-500 border-zinc-700"
                                    )}>{shift.status}</span>
                                </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           {/* ADMIN APPROVAL BUTTONS */}
                           {user?.role === 'admin' && shift.status === 'Submitted' && (
                               <>
                                   <button 
                                       onClick={() => handleApproveShift(shift.id)}
                                       className="p-2 bg-green-600/10 hover:bg-green-600/30 text-green-500 border border-green-600/30 rounded"
                                       title="Goedkeuren"
                                   >
                                       <Check className="w-4 h-4" />
                                   </button>
                                   <button 
                                       onClick={() => handleRejectShift(shift.id)}
                                       className="p-2 bg-red-600/10 hover:bg-red-600/30 text-red-500 border border-red-600/30 rounded"
                                       title="Afkeuren"
                                   >
                                       <X className="w-4 h-4" />
                                   </button>
                               </>
                           )}

                           {employee ? (
                              <button onClick={() => handleUnassign(shift.id)} className="text-zinc-600 hover:text-red-500 p-2 transition-colors border border-zinc-800 rounded bg-zinc-950" title="Agent ontkoppelen"><X className="w-4 h-4" /></button>
                           ) : (
                              <button onClick={() => { setTargetSlotId(shift.id); setIsAssignModalOpen(true); }} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors border border-zinc-700">Toewijzen</button>
                           )}
                           <button 
                                onClick={() => handleDeleteSlot(shift)}
                                className="text-zinc-600 hover:text-red-600 p-2 border border-zinc-800 rounded bg-zinc-950 hover:bg-red-900/10" 
                                title="Slot verwijderen"
                           >
                               <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  );
               })}
            </div>

            {/* NEW PENDING APPLICATIONS SECTION */}
            {pendingApplications.length > 0 && (
               <div className="mt-8 pt-8 border-t border-zinc-800">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Inbox className="w-5 h-5 text-blue-500" /> Openstaande Sollicitaties</h3>
                  <div className="space-y-3">
                     {pendingApplications.map(app => (
                        <div key={app.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center justify-between">
                           <div>
                              <div className="font-bold text-white">{app.agentName}</div>
                              <div className="text-xs text-zinc-500">Aangevraagd op {new Date(app.createdAt).toLocaleString()}</div>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => handleApproveApp(app.id)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors">Goedkeuren</button>
                              <button onClick={() => handleRejectApp(app.id)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors">Weigeren</button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>

         <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 h-fit">
            <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-apex-gold" /> {t('planning.requirements')}</h3>
            <div className="space-y-4">
               <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Min. Rol</label>
                  <div className="text-white font-bold">{reqRole}</div>
               </div>
               {reqCerts.length > 0 && (
                  <div>
                     <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">Certificaten</label>
                     <div className="flex flex-wrap gap-2">
                        {reqCerts.map(c => <span key={c} className="bg-zinc-800 px-2 py-1 rounded text-xs border border-zinc-700 text-zinc-300">{c}</span>)}
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>

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
                        <div><div className="font-bold text-white">{agent.name}</div><div className="text-xs text-zinc-500">{agent.role}</div></div>
                        <button onClick={() => handleAssign(agent.id)} className="bg-apex-gold text-black px-3 py-1 rounded text-xs font-bold uppercase">Kies</button>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
