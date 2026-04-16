import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { BackButton } from '../../ui/BackButton';
import { TimeLog } from '../../data/types';
import { 
  Clock, MapPin, Shield, User, Calendar, CheckCircle, XCircle, Edit2, AlertTriangle, FileText, ArrowRight, Printer 
} from 'lucide-react';
import clsx from 'clsx';

export const TijdregistratieDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { timeLogs, shifts, employees, updateTimeLog } = useStore();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const log = timeLogs.find(l => l.id === id);
  const shift = shifts.find(s => s.id === log?.shiftId);
  const employee = employees.find(e => e.id === log?.employeeId);

  // Mock Audit Log (since it's not in the main seed yet, we generate it or read if available)
  const auditTrail = useMemo(() => {
      if (!log) return [];
      
      const trail: { ts: string; action: string; actor: string; note?: string }[] = [
          { ts: log.clockIn, action: 'Ingeklokt', actor: employee?.name || 'Agent' },
      ];
      if (log.clockOut) {
          trail.push({ ts: log.clockOut, action: 'Uitgeklokt', actor: employee?.name || 'Agent' });
      }
      if (log.status === 'EDITED') {
          trail.push({ ts: new Date().toISOString(), action: 'Correctie Toegepast', actor: 'Planner', note: log.correctionReason });
      }
      if (log.approvalStatus === 'APPROVED') {
          trail.push({ ts: new Date().toISOString(), action: 'Goedgekeurd', actor: 'Manager' });
      }
      if (log.approvalStatus === 'REJECTED') {
          trail.push({ ts: new Date().toISOString(), action: 'Afgekeurd', actor: 'Manager', note: log.correctionReason });
      }
      return trail.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  }, [log, employee]);

  if (!log || !shift || !employee) {
      return (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <p>Registratie niet gevonden.</p>
              <button onClick={() => navigate('/tijdregistraties')} className="mt-4 text-apex-gold underline">Terug naar overzicht</button>
          </div>
      );
  }

  const handleApprove = () => {
      updateTimeLog(log.id, { approvalStatus: 'APPROVED' });
  };

  const handleReject = () => {
      if (rejectReason.length >= 10) {
          updateTimeLog(log.id, { approvalStatus: 'REJECTED', correctionReason: `Afgekeurd: ${rejectReason}` });
          setShowRejectModal(false);
          setRejectReason('');
      }
  };

  const handleExport = () => {
      navigate(`/tijdregistraties/print?id=${log.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in slide-in-from-right-4 duration-300">
        <BackButton />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
            <div>
                <h1 className="text-3xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                    <User className="w-8 h-8 text-zinc-500" />
                    {employee.name}
                </h1>
                <div className="flex items-center gap-2 text-zinc-400 mt-2 text-lg">
                    <Shield className="w-5 h-5 text-apex-gold" />
                    <span className="font-bold text-white">{shift.clientName}</span>
                    <span className="text-zinc-600">•</span>
                    <span>{shift.location}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleExport}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 transition-all mr-2"
                >
                    <Printer className="w-4 h-4" /> Export
                </button>

                <div className={clsx(
                    "px-4 py-2 rounded-lg border font-bold uppercase tracking-wider text-sm flex items-center gap-2 shadow-lg",
                    log.approvalStatus === 'APPROVED' ? "bg-green-900/20 border-green-500/50 text-green-400" :
                    log.approvalStatus === 'REJECTED' ? "bg-red-900/20 border-red-500/50 text-red-400" :
                    "bg-blue-900/20 border-blue-500/50 text-blue-400"
                )}>
                    {log.approvalStatus === 'APPROVED' ? <CheckCircle className="w-5 h-5" /> : 
                     log.approvalStatus === 'REJECTED' ? <XCircle className="w-5 h-5" /> : 
                     <Clock className="w-5 h-5" />}
                    {log.approvalStatus === 'SUBMITTED' ? 'Ingediend' : log.approvalStatus === 'APPROVED' ? 'Goedgekeurd' : 'Afgekeurd'}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Time Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="w-32 h-32" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-12 relative z-10">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Ingeklokt</label>
                            <div className="text-4xl font-mono text-white font-bold tracking-tighter">
                                {new Date(log.clockIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </div>
                            <div className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {new Date(log.clockIn).toLocaleDateString()}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Uitgeklokt</label>
                            <div className={clsx("text-4xl font-mono font-bold tracking-tighter", log.clockOut ? "text-white" : "text-zinc-600 italic")}>
                                {log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                            </div>
                            {log.clockOut && (
                                <div className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {new Date(log.clockOut).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center">
                        <div className="text-sm text-zinc-400">
                            Gepland: <span className="text-white font-mono">{new Date(shift.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(shift.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        {log.deviationMinutes !== 0 && (
                            <div className={clsx("text-xs font-bold px-2 py-1 rounded", log.deviationMinutes > 0 ? "bg-red-900/30 text-red-400" : "bg-green-900/30 text-green-400")}>
                                {log.deviationMinutes > 0 ? `+${log.deviationMinutes} min laat` : `${Math.abs(log.deviationMinutes)} min vroeg`}
                            </div>
                        )}
                    </div>
                </div>

                {/* Map / Location */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-between hover:border-zinc-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center border border-zinc-800 text-zinc-500">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Locatie Verificatie</h3>
                            <p className="text-zinc-400 text-sm">
                                {log.geoLat ? `GPS: ${log.geoLat}, ${log.geoLng}` : 'Geen GPS data beschikbaar'}
                            </p>
                        </div>
                    </div>
                    {log.geoLat ? <CheckCircle className="w-6 h-6 text-green-500" /> : <AlertTriangle className="w-6 h-6 text-orange-500" />}
                </div>

                {/* Audit Log / Timeline */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-apex-gold" /> Audit Trail
                    </h3>
                    <div className="space-y-4 relative pl-4 border-l border-zinc-800 ml-2">
                        {auditTrail.map((entry, idx) => (
                            <div key={idx} className="relative pl-6">
                                <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-zinc-900 border-2 border-zinc-600 rounded-full" />
                                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg hover:border-zinc-700 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-white text-sm">{entry.action}</span>
                                        <span className="text-xs text-zinc-500 font-mono">{new Date(entry.ts).toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-zinc-400">Door: <span className="text-zinc-300 font-bold">{entry.actor}</span></div>
                                    {entry.note && (
                                        <div className="mt-2 text-xs text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800 italic">
                                            "{entry.note}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Acties</h3>
                    
                    <div className="space-y-3">
                        {log.approvalStatus === 'SUBMITTED' && (
                            <>
                                <button 
                                    onClick={handleApprove}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all"
                                >
                                    <CheckCircle className="w-5 h-5" /> Goedkeuren
                                </button>
                                <button 
                                    onClick={() => setShowRejectModal(true)}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-700 transition-all"
                                >
                                    <XCircle className="w-5 h-5" /> Afkeuren
                                </button>
                            </>
                        )}
                        <button className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-800 hover:border-zinc-600 transition-all">
                            <Edit2 className="w-4 h-4" /> Correctie Invoeren
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-800">
                        <div className="flex justify-between items-center text-sm text-zinc-400 mb-2">
                            <span>Contract</span>
                            <span className="text-white">{employee.contractType}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-zinc-400">
                            <span>Uurloon</span>
                            <span className="text-white">€ {employee.hourlyRate?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <div className="bg-zinc-900 border border-red-900 p-6 rounded-lg w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                    <h3 className="text-xl font-bold text-white mb-4">Afkeuren</h3>
                    <textarea 
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-32 mb-4 focus:border-red-500 outline-none"
                        placeholder="Reden van afkeuring (min. 10 tekens)..."
                    />
                    <div className="flex gap-3">
                        <button 
                            onClick={handleReject}
                            disabled={rejectReason.length < 10}
                            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2 rounded"
                        >
                            Bevestigen
                        </button>
                        <button 
                            onClick={() => setShowRejectModal(false)}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded"
                        >
                            Annuleren
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};