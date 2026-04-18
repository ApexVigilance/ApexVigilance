import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock, MapPin, Play, Square, Coffee, AlertTriangle,
  CheckCircle2, XCircle, Camera, X, History, CalendarDays,
  ChevronRight, Shield, Navigation, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import { useStore, TimeEvent, TimeEventType, TimeLog, GeofenceStatus, ReviewStatus } from '../../../data/store';
import { calculateDistance } from '../../../utils/geofence';
import clsx from 'clsx';



export const AgentTijdregistratiePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const CURRENT_AGENT_ID = user?.employeeId ?? '';
  const { timeLogs, shifts, logTimeEvent, createTimeLog } = useStore();

  // -- STATE --
  const [activeTab, setActiveTab] = useState<'TODAY' | 'HISTORY'>('TODAY');
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Exception flow state
  const [pendingAction, setPendingAction] = useState<TimeEventType | null>(null);
  const [geofenceStatus, setGeofenceStatus] = useState<GeofenceStatus>('LOCATIE_NIET_BESCHIKBAAR');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [reasonType, setReasonType] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [capturedCoords, setCapturedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- COMPUTED DATA --
  const today = new Date().toISOString().split('T')[0];

  const activeLog = useMemo(
    () => timeLogs.find(l => l.employeeId === CURRENT_AGENT_ID && l.date === today),
    [timeLogs, today]
  );

  const historyLogs = useMemo(
    () =>
      timeLogs
        .filter(l => l.employeeId === CURRENT_AGENT_ID && l.date !== today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [timeLogs, today]
  );

  const activeShift = useMemo(() => {
    if (activeLog?.shiftId) return shifts.find(s => s.id === activeLog.shiftId);
    const now = new Date();
    return shifts.find(
      s =>
        s.employeeId === CURRENT_AGENT_ID &&
        now >= new Date(s.startTime) &&
        now <= new Date(s.endTime)
    );
  }, [shifts, activeLog]);

  const currentStatus = activeLog?.currentStatus || 'NIET_INGEKLOKT';
  const isClockedIn = currentStatus === 'IN_DIENST' || currentStatus === 'PAUZE';
  const isOnBreak = currentStatus === 'PAUZE';
  const isFinished = currentStatus === 'AFGEROND';

  // -- LIVE TIMER --
  const [elapsed, setElapsed] = useState('00:00:00');
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeLog && !activeLog.clockOut) {
        const start = new Date(activeLog.clockIn).getTime();
        const now = Date.now();
        const diff = now - start;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setElapsed(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeLog]);

  // -- GPS HELPERS --
  const getLocation = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS niet beschikbaar'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

  const checkGeofence = (
    position: GeolocationPosition
  ): GeofenceStatus => {
    if (!activeShift?.geoLat || !activeShift?.geoLng) return 'LOCATIE_NIET_BESCHIKBAAR';
    const dist = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      activeShift.geoLat,
      activeShift.geoLng
    );
    const radius = activeShift.geoRadius || 200;
    return dist <= radius ? 'BINNEN_ZONE' : 'BUITEN_ZONE';
  };

  // -- MAIN CLOCK ACTION --
  const handleClockAction = async (type: TimeEventType) => {
    setLoadingLoc(true);
    setErrorMsg(null);

    try {
      const position = await getLocation();
      const geo = checkGeofence(position);
      setCapturedCoords({ lat: position.coords.latitude, lng: position.coords.longitude });

      if (geo === 'BUITEN_ZONE') {
        // Need exception form
        setGeofenceStatus('BUITEN_ZONE');
        setPendingAction(type);
        setShowModal(true);
        setLoadingLoc(false);
        return;
      }

      // Within zone – log directly
      commitEvent(type, geo, position.coords.latitude, position.coords.longitude, null, null);
    } catch {
      // GPS not available
      setCapturedCoords(null);
      setGeofenceStatus('LOCATIE_NIET_BESCHIKBAAR');
      setPendingAction(type);
      setShowModal(true);
    }
    setLoadingLoc(false);
  };

  const commitEvent = (
    type: TimeEventType,
    geo: GeofenceStatus,
    lat: number | null,
    lng: number | null,
    photo: string | null,
    reason: string | null
  ) => {
    const now = new Date().toISOString();
    const eventId = `EV-${Date.now()}`;

    const event: TimeEvent = {
      id: eventId,
      timeLogId: activeLog?.id || `LOG-${Date.now()}`,
      agentId: CURRENT_AGENT_ID,
      type,
      timestamp: now,
      gpsLat: lat || undefined,
      gpsLng: lng || undefined,
      geofenceStatus: geo,
      bewijsFotoUrl: photo || undefined,
      redenAfwijking: reason || undefined,
      reviewStatus: geo === 'BUITEN_ZONE' || geo === 'LOCATIE_NIET_BESCHIKBAAR' ? 'NAZICHT' : 'OK'
    };

    if (!activeLog && type === 'INKLOK') {
      // Create new log
      const newLog: TimeLog = {
        id: event.timeLogId,
        shiftId: activeShift?.id || '',
        employeeId: CURRENT_AGENT_ID,
        date: today,
        clockIn: now,
        status: 'OK',
        approvalStatus: 'SUBMITTED',
        deviationMinutes: 0,
        geoLat: lat || 0,
        geoLng: lng || 0,
        events: [event],
        currentStatus: 'IN_DIENST'
      };
      createTimeLog(newLog);
    } else if (activeLog) {
      logTimeEvent(activeLog.id, event);
    }
  };

  const handleExceptionConfirm = () => {
    if (!pendingAction) return;
    const reason = reasonType === 'other' ? customReason : reasonType;
    if (!reason) {
      setErrorMsg('Geef een reden op.');
      return;
    }
    commitEvent(
      pendingAction,
      geofenceStatus,
      capturedCoords?.lat || null,
      capturedCoords?.lng || null,
      capturedPhoto,
      reason
    );
    // Reset
    setShowModal(false);
    setPendingAction(null);
    setCapturedPhoto(null);
    setReasonType('');
    setCustomReason('');
    setErrorMsg(null);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => setCapturedPhoto(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // -- STATUS UI HELPERS --
  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
    NIET_INGEKLOKT: {
      label: t('tijd.agent.status.NIET_INGEKLOKT'),
      color: 'text-zinc-400',
      bg: 'bg-zinc-800/50',
      border: 'border-zinc-700',
      dot: 'bg-zinc-500'
    },
    IN_DIENST: {
      label: t('tijd.agent.status.IN_DIENST'),
      color: 'text-green-400',
      bg: 'bg-green-900/10',
      border: 'border-green-500/30',
      dot: 'bg-green-500'
    },
    PAUZE: {
      label: t('tijd.agent.status.PAUZE'),
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/10',
      border: 'border-yellow-500/30',
      dot: 'bg-yellow-500'
    },
    AFGEROND: {
      label: t('tijd.agent.status.AFGEROND'),
      color: 'text-blue-400',
      bg: 'bg-blue-900/10',
      border: 'border-blue-500/30',
      dot: 'bg-blue-400'
    }
  };

  const sc = statusConfig[currentStatus] || statusConfig.NIET_INGEKLOKT;

  const formatTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--:--';

  const formatDuration = (clockIn: string, clockOut?: string) => {
    const start = new Date(clockIn).getTime();
    const end = clockOut ? new Date(clockOut).getTime() : Date.now();
    const diff = end - start;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}u ${m}m`;
  };

  const geoBadge = (status: GeofenceStatus) => {
    if (status === 'BINNEN_ZONE') return <span className="text-green-500 text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{t('tijd.agent.gps.withinZone')}</span>;
    if (status === 'BUITEN_ZONE') return <span className="text-red-500 text-[10px] font-bold flex items-center gap-1"><XCircle className="w-3 h-3" />{t('tijd.agent.gps.outsideZone')}</span>;
    return <span className="text-zinc-500 text-[10px] font-bold">{t('tijd.agent.gps.unavailable')}</span>;
  };

  return (
    <div className="pb-32 animate-in fade-in duration-300 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-apex-gold" /> {t('tijd.title')}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900 p-1 rounded-xl mb-6 border border-zinc-800">
        <button
          onClick={() => setActiveTab('TODAY')}
          className={clsx(
            'flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all',
            activeTab === 'TODAY'
              ? 'bg-zinc-800 text-white shadow border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          {t('tijd.agent.today')}
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={clsx(
            'flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all',
            activeTab === 'HISTORY'
              ? 'bg-zinc-800 text-white shadow border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          {t('tijd.agent.history')}
        </button>
      </div>

      {/* ---- TODAY TAB ---- */}
      {activeTab === 'TODAY' && (
        <div className="space-y-6">

          {/* Status Card */}
          <div className={clsx('rounded-2xl border p-5 transition-all', sc.bg, sc.border)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className={clsx('relative flex h-3 w-3')}>
                    <span className={clsx('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', sc.dot)} />
                    <span className={clsx('relative inline-flex rounded-full h-3 w-3', sc.dot)} />
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</div>
                  <div className={clsx('font-black text-lg uppercase tracking-tight', sc.color)}>
                    {sc.label}
                  </div>
                </div>
              </div>
              {activeShift && (
                <div className="text-right">
                  <div className="text-xs font-bold text-zinc-400 truncate max-w-[140px]">{activeShift.clientName}</div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1 justify-end">
                    <MapPin className="w-3 h-3" /> {activeShift.location}
                  </div>
                </div>
              )}
            </div>

            {/* Timer */}
            {isClockedIn && !isFinished && (
              <div className="text-center py-4">
                <div className={clsx('font-mono text-5xl font-black tracking-tighter', sc.color)}>
                  {elapsed}
                </div>
                <div className="text-xs text-zinc-500 mt-2 uppercase tracking-widest">
                  {t('tijd.agent.elapsed')}
                </div>
              </div>
            )}

            {/* Clock in/out times */}
            {activeLog && (
              <div className="flex gap-4 mt-3 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                <div className="flex-1">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Inklok</div>
                  <div className="font-mono text-xl text-white font-bold">{formatTime(activeLog.clockIn)}</div>
                </div>
                <div className="w-px bg-zinc-800" />
                <div className="flex-1">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Uitklok</div>
                  <div className={clsx('font-mono text-xl font-bold', activeLog.clockOut ? 'text-white' : 'text-zinc-600 italic')}>
                    {formatTime(activeLog.clockOut)}
                  </div>
                </div>
                {activeLog.clockOut && (
                  <>
                    <div className="w-px bg-zinc-800" />
                    <div className="flex-1">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Totaal</div>
                      <div className="font-mono text-xl text-apex-gold font-bold">
                        {formatDuration(activeLog.clockIn, activeLog.clockOut)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* No shift warning */}
            {!activeShift && !isClockedIn && (
              <div className="flex items-center gap-2 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 mt-3">
                <AlertTriangle className="w-4 h-4 text-zinc-500 shrink-0" />
                <p className="text-xs text-zinc-500">{t('tijd.agent.noShiftSub')}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isFinished && (
            <div className="space-y-3">
              {/* INKLOK */}
              {!isClockedIn && (
                <button
                  onClick={() => handleClockAction('INKLOK')}
                  disabled={loadingLoc}
                  className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 disabled:opacity-50 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-900/20 active:scale-[0.98] text-lg uppercase tracking-wide border border-green-500/30"
                >
                  {loadingLoc ? (
                    <>
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      {t('tijd.agent.gps.checking')}
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 fill-current" />
                      {t('tijd.agent.clockIn')}
                    </>
                  )}
                </button>
              )}

              {/* PAUZE & UITKLOK */}
              {isClockedIn && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Pauze toggle */}
                  {!isOnBreak ? (
                    <button
                      onClick={() => handleClockAction('PAUZE_START')}
                      disabled={loadingLoc}
                      className="bg-yellow-900/30 hover:bg-yellow-900/50 disabled:opacity-50 text-yellow-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-yellow-900/50 active:scale-[0.98]"
                    >
                      <Coffee className="w-5 h-5" />
                      {t('tijd.agent.pauseStart')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleClockAction('PAUZE_STOP')}
                      disabled={loadingLoc}
                      className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <Coffee className="w-5 h-5" />
                      {t('tijd.agent.pauseStop')}
                    </button>
                  )}

                  {/* Uitklok */}
                  <button
                    onClick={() => handleClockAction('UITKLOK')}
                    disabled={loadingLoc}
                    className="bg-red-900/30 hover:bg-red-800/50 disabled:opacity-50 text-red-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-red-900/50 active:scale-[0.98]"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    {t('tijd.agent.clockOut')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Finished summary */}
          {isFinished && (
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-5 text-center">
              <CheckCircle2 className="w-10 h-10 text-blue-400 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-1">Dienst Afgerond</h3>
              <p className="text-zinc-400 text-sm">
                Totale duur: <strong className="text-white">{formatDuration(activeLog!.clockIn, activeLog!.clockOut)}</strong>
              </p>
            </div>
          )}

          {/* Events timeline */}
          {activeLog && activeLog.events.length > 0 && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Tijdlijn</h3>
              <div className="space-y-3">
                {activeLog.events.map((ev, idx) => {
                  const typeLabels: Record<string, string> = {
                    INKLOK: 'Ingeklokt',
                    UITKLOK: 'Uitgeklokt',
                    PAUZE_START: 'Pauze gestart',
                    PAUZE_STOP: 'Pauze beëindigd'
                  };
                  const typeColors: Record<string, string> = {
                    INKLOK: 'text-green-400',
                    UITKLOK: 'text-red-400',
                    PAUZE_START: 'text-yellow-400',
                    PAUZE_STOP: 'text-blue-400'
                  };
                  return (
                    <div key={ev.id} className="flex items-center gap-3">
                      <div className={clsx('w-2 h-2 rounded-full shrink-0 mt-1', typeColors[ev.type]?.replace('text-', 'bg-') || 'bg-zinc-500')} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={clsx('text-sm font-bold', typeColors[ev.type] || 'text-zinc-300')}>
                            {typeLabels[ev.type] || ev.type}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">{formatTime(ev.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {geoBadge(ev.geofenceStatus)}
                          {ev.redenAfwijking && (
                            <span className="text-[10px] text-orange-400 italic">"{ev.redenAfwijking}"</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No log today */}
          {!activeLog && !loadingLoc && (
            <div className="text-center py-8 text-zinc-600 text-sm italic">
              Nog geen registratie vandaag.
            </div>
          )}
        </div>
      )}

      {/* ---- HISTORY TAB ---- */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-3">
          {historyLogs.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
              <History className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm italic">Geen historiek gevonden.</p>
            </div>
          ) : (
            historyLogs.map(log => {
              const shift = shifts.find(s => s.id === log.shiftId);
              return (
                <div
                  key={log.id}
                  className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 relative overflow-hidden"
                >
                  <div className={clsx(
                    'absolute left-0 top-0 bottom-0 w-1',
                    log.approvalStatus === 'APPROVED' ? 'bg-green-500' :
                    log.approvalStatus === 'REJECTED' ? 'bg-red-500' : 'bg-zinc-600'
                  )} />
                  <div className="pl-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-zinc-500" />
                        <span className="font-bold text-white">
                          {new Date(log.date).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <span className={clsx(
                        'text-[10px] font-bold uppercase px-2 py-0.5 rounded border',
                        log.approvalStatus === 'APPROVED' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
                        log.approvalStatus === 'REJECTED' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                      )}>
                        {log.approvalStatus === 'APPROVED' ? 'Goedgekeurd' : log.approvalStatus === 'REJECTED' ? 'Afgekeurd' : 'In behandeling'}
                      </span>
                    </div>

                    {shift && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
                        <Shield className="w-3 h-3 text-zinc-500" />
                        <span>{shift.clientName}</span>
                        <span className="text-zinc-600">•</span>
                        <span>{shift.location}</span>
                      </div>
                    )}

                    <div className="flex gap-6 bg-zinc-950/50 px-4 py-2 rounded-lg border border-zinc-800/50">
                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-0.5">In</div>
                        <div className="font-mono text-lg text-white font-bold">{formatTime(log.clockIn)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-0.5">Uit</div>
                        <div className={clsx('font-mono text-lg font-bold', log.clockOut ? 'text-white' : 'text-zinc-600 italic')}>
                          {formatTime(log.clockOut)}
                        </div>
                      </div>
                      {log.clockOut && (
                        <div>
                          <div className="text-[10px] text-zinc-500 uppercase font-bold mb-0.5">Totaal</div>
                          <div className="font-mono text-lg text-apex-gold font-bold">
                            {formatDuration(log.clockIn, log.clockOut)}
                          </div>
                        </div>
                      )}
                    </div>

                    {log.status === 'LATE' && (
                      <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Te laat (+{log.deviationMinutes} min)
                      </div>
                    )}
                    {log.status === 'EDITED' && log.correctionReason && (
                      <div className="mt-2 text-xs text-orange-400 italic">
                        Gecorrigeerd: "{log.correctionReason}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ---- EXCEPTION MODAL ---- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 flex items-end sm:items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-orange-500/30 rounded-2xl w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-8 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="p-2 bg-orange-900/20 rounded-xl border border-orange-900/30 shrink-0">
                  <Navigation className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t('tijd.agent.exception.title')}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{t('tijd.agent.exception.subtitle')}</p>
                </div>
                <button onClick={() => { setShowModal(false); setPendingAction(null); }} className="ml-auto text-zinc-500 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reason selection */}
              <div className="mb-4">
                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">
                  {t('tijd.agent.exception.reasonLabel')}
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'other_entrance', label: t('tijd.agent.exception.reasons.other_entrance') },
                    { key: 'vehicle', label: t('tijd.agent.exception.reasons.vehicle') },
                    { key: 'patrol', label: t('tijd.agent.exception.reasons.patrol') },
                    { key: 'technical', label: t('tijd.agent.exception.reasons.technical') },
                    { key: 'other', label: t('tijd.agent.exception.reasons.other') }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setReasonType(opt.key)}
                      className={clsx(
                        'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                        reasonType === opt.key
                          ? 'bg-orange-900/20 border-orange-500/50 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {reasonType === 'other' && (
                  <textarea
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder={t('tijd.agent.exception.reasonPlaceholder')}
                    className="mt-3 w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white text-sm outline-none focus:border-orange-500 min-h-[80px]"
                  />
                )}
              </div>

              {/* Photo */}
              <div className="mb-5">
                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">
                  {t('tijd.agent.exception.photoLabel')}
                </label>
                {capturedPhoto ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-700">
                    <img src={capturedPhoto} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setCapturedPhoto(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" /> Foto toevoegen
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </div>

              {errorMsg && (
                <div className="mb-4 bg-red-900/20 border border-red-900/50 rounded-xl p-3 text-xs text-red-400">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleExceptionConfirm}
                disabled={!reasonType || (reasonType === 'other' && !customReason)}
                className="w-full bg-apex-gold hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all shadow-lg"
              >
                {t('tijd.agent.exception.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
