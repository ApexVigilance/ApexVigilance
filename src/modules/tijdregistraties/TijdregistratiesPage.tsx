import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { Clock, AlertTriangle, CheckCircle, XCircle, Edit2, Shield, User, Filter, AlertOctagon, Download, Check, X, FileText } from 'lucide-react';
import { TimeLog, TimeEvent } from '../../data/types';
import clsx from 'clsx';
import { TerminalRegistrerenModal } from './components/TerminalRegistrerenModal';
import { filterTimeLogs } from './utils/filterLogs';
import { generateTimeLogsPdf } from './utils/generateTimeLogsPdf';

export const TijdregistratiesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { timeLogs, shifts, employees, updateTimeLog, reviewTimeEvent } = useStore();

  // Filters
  const [activeTab, setActiveTab] = useState<'LIST' | 'NAZICHT'>('LIST');
  const [filterDate, setFilterDate] = useState<string>(''); 
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action States
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [editReason, setEditReason] = useState('');
  const [newClockTime, setNewClockTime] = useState('');
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [rejectLogId, setRejectLogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Nazicht State
  const [selectedNazichtEvent, setSelectedNazichtEvent] = useState<{ logId: string, event: TimeEvent } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
      setFilterDate(new Date().toISOString().split('T')[0]);
  }, []);

  // --- DATA PROCESSING ---

  // Nazicht Items
  const nazichtItems = useMemo(() => {
      const items: { logId: string, event: TimeEvent, empName: string, shiftName: string }[] = [];
      timeLogs.forEach(log => {
          log.events.forEach(ev => {
              if (ev.reviewStatus === 'NAZICHT') {
                  const emp = employees.find(e => e.id === log.employeeId);
                  const shift = shifts.find(s => s.id === log.shiftId);
                  items.push({
                      logId: log.id,
                      event: ev,
                      empName: emp?.name || 'Onbekend',
                      shiftName: shift ? shift.clientName : (shift === undefined ? 'Onbekend' : t('tijd.shiftCancelled'))
                  });
              }
          });
      });
      return items.sort((a, b) => new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime());
  }, [timeLogs, employees, shifts, t]);

  // Standard List (Using Helper)
  const filteredLogs = useMemo(() => {
    return filterTimeLogs(timeLogs, employees, {
        date: filterDate,
        status: filterStatus,
        search: searchQuery
    });
  }, [timeLogs, employees, filterDate, filterStatus, searchQuery]);

  // Helpers
  const formatTime = (iso: string | undefined) => iso ? new Date(iso).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--';
  const getEmployee = (id: string) => employees.find(e => e.id === id);
  const getShift = (id: string) => shifts.find(s => s.id === id);

  // --- HANDLERS ---

  const handleReviewSubmit = (status: 'GOEDGEKEURD' | 'GEWEIGERD') => {
      if (selectedNazichtEvent) {
          if (status === 'GEWEIGERD' && !reviewNote) {
              alert('Opmerking verplicht bij weigering.');
              return;
          }
          reviewTimeEvent(selectedNazichtEvent.event.id, status, 'Admin', reviewNote);
          setSelectedNazichtEvent(null);
          setReviewNote('');
      }
  };

  const handleEditSubmit = () => {
    if (editingLog && editReason.length >= 10 && newClockTime) {
      const isOut = !!editingLog.clockOut && new Date(editingLog.clockIn).getHours() < 12 && parseInt(newClockTime.split(':')[0]) > 12;
      
      const datePart = (isOut && editingLog.clockOut ? editingLog.clockOut : editingLog.clockIn).split('T')[0];
      const newIso = `${datePart}T${newClockTime}:00`;

      const updates: Partial<TimeLog> = {
        status: 'EDITED',
        correctionReason: editReason,
        clockIn: !isOut ? newIso : editingLog.clockIn,
        clockOut: isOut ? newIso : editingLog.clockOut,
        approvalStatus: 'SUBMITTED' 
      };

      updateTimeLog(editingLog.id, updates);
      setEditingLog(null);
      setEditReason('');
      setNewClockTime('');
    }
  };

  const handleApprove = (log: TimeLog, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!log.clockOut) {
          alert("Kan niet goedkeuren: Uitkloktijd ontbreekt.");
          return;
      }
      updateTimeLog(log.id, { approvalStatus: 'APPROVED' });
  };

  const handleRejectSubmit = () => {
      if (rejectLogId && rejectReason.length >= 10) {
          updateTimeLog(rejectLogId, { 
              approvalStatus: 'REJECTED',
              correctionReason: `Afgekeurd: ${rejectReason}`
          });
          setRejectLogId(null);
          setRejectReason('');
      }
  };

  // PDF Generation
  const handleDownloadPdf = () => {
      const blob = generateTimeLogsPdf(filteredLogs, employees, shifts, {
          date: filterDate,
          status: filterStatus,
          search: searchQuery
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tijdsregistraties_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleOpenPdf = () => {
      const blob = generateTimeLogsPdf(filteredLogs, employees, shifts, {
          date: filterDate,
          status: filterStatus,
          search: searchQuery
      });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">{t('tijd.title')}</h2>
          <p className="text-zinc-400 mt-1">{t('tijd.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadPdf}
            className="bg-zinc-800 text-white px-3 py-2 rounded-lg font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700 text-sm"
          >
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download </span>PDF
          </button>
          <button
            onClick={handleOpenPdf}
            className="bg-zinc-800 text-white px-3 py-2 rounded-lg font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"
            title="Open PDF in nieuwe tab"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsTerminalModalOpen(true)}
            className="bg-apex-gold text-black px-3 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors flex items-center gap-2 shadow-lg shadow-apex-gold/20 text-sm"
          >
            <Clock className="w-4 h-4" /> {t('tijd.manualReg')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-6">
          <button 
             onClick={() => setActiveTab('LIST')}
             className={clsx(
                 "px-6 py-3 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors",
                 activeTab === 'LIST' ? "border-apex-gold text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
             )}
          >
             Overzicht
          </button>
          <button 
             onClick={() => setActiveTab('NAZICHT')}
             className={clsx(
                 "px-6 py-3 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2",
                 activeTab === 'NAZICHT' ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
             )}
          >
             {t('tijd.admin.nazicht')}
             {nazichtItems.length > 0 && (
                 <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{nazichtItems.length}</span>
             )}
          </button>
      </div>

      {/* --- NAZICHT VIEW --- */}
      {activeTab === 'NAZICHT' && (
          <div className="space-y-4">
              {nazichtItems.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      {t('tijd.admin.emptyNazicht')}
                  </div>
              ) : (
                  <div className="grid gap-4">
                      {nazichtItems.map(item => (
                          <div key={item.event.id} className="bg-zinc-900 border border-l-4 border-l-purple-500 border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start">
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-900/50">
                                          {item.event.geofenceStatus === 'BUITEN_ZONE' ? t('tijd.agent.outside') : t('tijd.agent.unavailable')}
                                      </span>
                                      <span className="text-zinc-500 text-xs font-mono">{new Date(item.event.timestamp).toLocaleString()}</span>
                                  </div>
                                  <h4 className="font-bold text-white text-lg">{item.empName}</h4>
                                  <div className="text-sm text-zinc-400 mb-2">{item.shiftName} • {item.event.type}</div>
                                  
                                  <div className="flex gap-4 mt-3 bg-zinc-950 p-3 rounded border border-zinc-800">
                                      {item.event.bewijsFotoUrl && (
                                          <img 
                                              src={item.event.bewijsFotoUrl} 
                                              className="w-16 h-16 rounded object-cover cursor-pointer border border-zinc-700 hover:border-white transition-colors" 
                                              onClick={() => setSelectedNazichtEvent({ logId: item.logId, event: item.event })}
                                          />
                                      )}
                                      <div>
                                          <div className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('tijd.agent.reason')}</div>
                                          <p className="text-sm text-zinc-300 italic">"{item.event.redenAfwijking}"</p>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex flex-col gap-2 min-w-[120px]">
                                  <button 
                                      onClick={() => setSelectedNazichtEvent({ logId: item.logId, event: item.event })}
                                      className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold py-2 rounded border border-zinc-700"
                                  >
                                      Beoordelen
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* --- LIST VIEW --- */}
      {activeTab === 'LIST' && (
          <>
            {/* Filters */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Datum</label>
                    <input 
                    type="date" 
                    value={filterDate} 
                    onChange={e => setFilterDate(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-apex-gold outline-none" 
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Status</label>
                    <div className="relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <select 
                        value={filterStatus} 
                        onChange={e => setFilterStatus(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded pl-9 pr-4 py-2 text-white focus:border-apex-gold outline-none appearance-none min-w-[140px]"
                        >
                            <option value="">Alles</option>
                            <option value="OK">OK</option>
                            <option value="LATE">Te Laat</option>
                            <option value="EDITED">Aangepast</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Zoek Agent</label>
                    <input 
                    type="text" 
                    placeholder="Naam..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-apex-gold outline-none" 
                    />
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-16 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        Geen registraties gevonden voor deze filters.
                    </div>
                ) : (
                    filteredLogs.map(log => {
                        const shift = getShift(log.shiftId);
                        const emp = getEmployee(log.employeeId);
                        const isCancelled = shift?.status === 'Cancelled';
                        
                        return (
                            <div 
                                id={`log-${log.id}`}
                                key={log.id} 
                                onClick={() => navigate(`/tijdregistraties/${log.id}`)}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-apex-gold hover:shadow-lg hover:shadow-apex-gold/5 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                                    
                                    {/* Left: Agent & Shift */}
                                    <div className="flex items-start gap-4">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner transition-colors",
                                            log.status === 'LATE' ? "bg-red-900/20 text-red-500 border border-red-900/50" :
                                            log.status === 'EDITED' ? "bg-orange-900/20 text-orange-500 border border-orange-900/50" :
                                            "bg-green-900/20 text-green-500 border border-green-900/50"
                                        )}>
                                            {log.status === 'LATE' ? '!' : log.status === 'EDITED' ? '✎' : '✓'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white flex items-center gap-2 text-lg group-hover:text-apex-gold transition-colors">
                                                {emp?.name || 'Onbekend'}
                                                {log.status === 'LATE' && <span className="text-[10px] font-bold bg-red-900/40 text-red-200 px-2 py-0.5 rounded border border-red-800">TE LAAT (+{log.deviationMinutes}m)</span>}
                                                {log.status === 'EDITED' && <span className="text-[10px] font-bold bg-orange-900/40 text-orange-200 px-2 py-0.5 rounded border border-orange-800">AANGEPAST</span>}
                                            </h4>
                                            
                                            {isCancelled ? (
                                                <div className="text-sm text-red-400 flex items-center gap-2 mt-1 italic">
                                                    <AlertOctagon className="w-3 h-3" /> 
                                                    <span className="font-bold">{t('tijd.shiftCancelled')}</span> 
                                                    <span className="text-zinc-600">•</span>
                                                    <span>{shift?.clientName}</span>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                                                    <Shield className="w-3 h-3 text-zinc-500" /> 
                                                    <span className="font-medium text-zinc-300">{shift?.clientName || 'Onbekend'}</span> 
                                                    <span className="text-zinc-600">•</span>
                                                    <span>{shift?.location}</span>
                                                </div>
                                            )}
                                            
                                            <div className="text-xs text-zinc-500 mt-1 font-mono">
                                                Gepland: {shift ? `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}` : '--:--'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Times */}
                                    <div className="flex gap-12 text-sm bg-zinc-950/50 px-6 py-2 rounded-lg border border-zinc-800/50">
                                        <div>
                                            <label className="block text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">In</label>
                                            <span className={clsx("font-mono text-xl", log.status === 'LATE' ? "text-red-400 font-bold" : "text-white")}>
                                                {formatTime(log.clockIn)}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Uit</label>
                                            <span className={clsx("font-mono text-xl", !log.clockOut ? "text-zinc-600 italic" : "text-white")}>
                                                {formatTime(log.clockOut)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 border-t lg:border-t-0 border-zinc-800 pt-3 lg:pt-0 w-full lg:w-auto justify-end" onClick={e => e.stopPropagation()}>
                                        {log.approvalStatus === 'SUBMITTED' ? (
                                            <>
                                                <button 
                                                    onClick={(e) => handleApprove(log, e)}
                                                    className="p-2 bg-green-900/10 hover:bg-green-900/30 text-green-600 hover:text-green-400 border border-green-900/30 hover:border-green-500 rounded transition-all shadow-sm"
                                                    title="Goedkeuren"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setRejectLogId(log.id); }}
                                                    className="p-2 bg-red-900/10 hover:bg-red-900/30 text-red-600 hover:text-red-400 border border-red-900/30 hover:border-red-500 rounded transition-all shadow-sm"
                                                    title="Afkeuren"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : (
                                            <span className={clsx("text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider border", 
                                                log.approvalStatus === 'APPROVED' ? "text-green-400 bg-green-900/20 border-green-900/30" : "text-red-400 bg-red-900/20 border-red-900/30"
                                            )}>
                                                {log.approvalStatus === 'APPROVED' ? 'Goedgekeurd' : 'Afgekeurd'}
                                            </span>
                                        )}
                                        
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingLog(log);
                                                const timeToEdit = log.clockOut || log.clockIn;
                                                setNewClockTime(timeToEdit.split('T')[1].slice(0, 5));
                                            }}
                                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded ml-2 transition-all shadow-sm"
                                            title="Corrigeren"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {log.correctionReason && (
                                    <div className="mt-3 text-xs text-orange-400/90 bg-orange-900/10 p-2.5 rounded border border-orange-900/20 flex items-start gap-2">
                                        <span className="font-bold">✎ Correctie:</span> {log.correctionReason}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
          </>
      )}

      {/* Modals */}
      <TerminalRegistrerenModal 
         isOpen={isTerminalModalOpen} 
         onClose={() => setIsTerminalModalOpen(false)} 
      />

      {/* Review Modal */}
      {selectedNazichtEvent && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-zinc-900 border border-purple-500/50 p-6 rounded-lg w-full max-w-lg shadow-2xl relative">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-purple-500" /> Nazicht Afwijking
                  </h3>
                  
                  <div className="mb-6 flex gap-4">
                      {selectedNazichtEvent.event.bewijsFotoUrl ? (
                          <img src={selectedNazichtEvent.event.bewijsFotoUrl} className="w-1/2 rounded-lg border border-zinc-700" />
                      ) : <div className="w-1/2 bg-zinc-950 rounded flex items-center justify-center text-zinc-500 text-xs">Geen foto</div>}
                      
                      <div className="flex-1 space-y-4">
                          <div>
                              <div className="text-xs font-bold text-zinc-500 uppercase mb-1">Reden</div>
                              <p className="text-white text-sm bg-zinc-950 p-2 rounded border border-zinc-800">
                                  {selectedNazichtEvent.event.redenAfwijking}
                              </p>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-zinc-500 uppercase mb-1">Opmerking Reviewer</label>
                              <textarea 
                                  value={reviewNote}
                                  onChange={e => setReviewNote(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-20 outline-none focus:border-purple-500"
                                  placeholder="Typ opmerking..."
                              />
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button 
                          onClick={() => handleReviewSubmit('GOEDGEKEURD')}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
                      >
                          <Check className="w-4 h-4" /> Goedkeuren
                      </button>
                      <button 
                          onClick={() => handleReviewSubmit('GEWEIGERD')}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
                      >
                          <X className="w-4 h-4" /> Weigeren
                      </button>
                  </div>
                  <button onClick={() => setSelectedNazichtEvent(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
          </div>
      )}

      {/* Legacy Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-white mb-4">Correctie Invoeren</h3>
                <div className="mb-4">
                    <label className="block text-sm text-zinc-400 mb-1">Nieuwe Tijd (UU:MM)</label>
                    <input 
                        type="time" 
                        value={newClockTime}
                        onChange={e => setNewClockTime(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white font-mono text-lg focus:border-apex-gold outline-none"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm text-zinc-400 mb-1">Reden van wijziging (min. 10 tekens)</label>
                    <textarea 
                        value={editReason}
                        onChange={e => setEditReason(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-24 focus:border-apex-gold outline-none"
                        placeholder="Bv. Systeemstoring, vergeten in te klokken..."
                    />
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleEditSubmit}
                        disabled={editReason.length < 10 || !newClockTime}
                        className="flex-1 bg-apex-gold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2 rounded shadow-lg"
                    >
                        Opslaan
                    </button>
                    <button 
                        onClick={() => setEditingLog(null)}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded"
                    >
                        Annuleren
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Reject Confirm Modal */}
      {rejectLogId && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-zinc-900 border border-red-900 p-6 rounded-lg w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <XCircle className="w-6 h-6 text-red-500" /> Afkeuren
                  </h3>
                  <div className="mb-6">
                      <label className="block text-sm text-zinc-400 mb-1">Reden van afkeuring (min. 10 tekens)</label>
                      <textarea 
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white h-24 focus:border-red-500 outline-none"
                          placeholder="Waarom wordt deze registratie afgekeurd?"
                      />
                  </div>
                  <div className="flex gap-3">
                      <button 
                          onClick={handleRejectSubmit}
                          disabled={rejectReason.length < 10}
                          className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded shadow-lg"
                      >
                          Bevestigen
                      </button>
                      <button 
                          onClick={() => { setRejectLogId(null); setRejectReason(''); }}
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