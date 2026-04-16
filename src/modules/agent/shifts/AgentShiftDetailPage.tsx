import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../../data/store';
import { MapPin, Clock, Calendar, ChevronLeft, Shield, Info, CheckCircle, XCircle, FileQuestion, RotateCcw, FileText } from 'lucide-react';
import clsx from 'clsx';

const CURRENT_AGENT_ID = '2'; // Mock

export const AgentShiftDetailPage: React.FC = () => {
  const { id } = useParams(); // Group Key (Base64)
  const navigate = useNavigate();
  const { shifts, applications, applyForShift, withdrawApplication, unclaimShift } = useStore();
  const [loading, setLoading] = useState(false);

  const criteria = useMemo(() => {
    try {
      return id ? JSON.parse(atob(id)) : null;
    } catch { return null; }
  }, [id]);

  const groupShifts = useMemo(() => {
    if (!criteria) return [];
    return shifts.filter(s => 
      s.clientName === criteria.c &&
      s.location === criteria.l &&
      s.startTime === criteria.s &&
      s.endTime === criteria.e
    );
  }, [shifts, criteria]);

  // Find my application
  const myApplication = useMemo(() => {
      if (!id) return null;
      // We look for active applications (not withdrawn) or the most recent one
      return applications.find(a => a.shiftGroupHash === id && a.agentId === CURRENT_AGENT_ID && a.status !== 'WITHDRAWN');
  }, [applications, id]);

  if (groupShifts.length === 0) return <div className="p-8 text-white">Shift niet gevonden.</div>;

  const first = groupShifts[0];
  const total = groupShifts.length;
  const assignedCount = groupShifts.filter(s => s.employeeId).length;
  const mySlot = groupShifts.find(s => s.employeeId === CURRENT_AGENT_ID);
  const openCount = total - assignedCount;
  const start = new Date(first.startTime);
  const end = new Date(first.endTime);

  const handleApply = () => {
    setLoading(true);
    setTimeout(() => {
      if (criteria) applyForShift(criteria, CURRENT_AGENT_ID);
      setLoading(false);
    }, 500);
  };

  const handleWithdraw = () => {
      if (!myApplication) return;
      if (!confirm('Wil je deze aanvraag intrekken?')) return;
      setLoading(true);
      setTimeout(() => {
          withdrawApplication(myApplication.id);
          setLoading(false);
      }, 500);
  };

  // Only if ALREADY ASSIGNED (skip app flow if somehow directly assigned)
  const handleUnclaim = () => {
    if (!confirm('Ben je zeker dat je je wilt afmelden? Dit kan gevolgen hebben voor je score.')) return;
    setLoading(true);
    setTimeout(() => {
      unclaimShift(criteria, CURRENT_AGENT_ID);
      setLoading(false);
    }, 500);
  };

  const handleCreateReport = () => {
      if (mySlot) {
          navigate('/agent/rapporten', { state: { shiftId: mySlot.id } });
      }
  };

  return (
    <div className="pb-24 animate-in slide-in-from-right-8 duration-300">
      {/* Top Bar */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-lg text-white">Details</span>
      </div>

      {/* Main Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <h1 className="text-2xl font-black text-white uppercase leading-tight mb-1">{first.clientName}</h1>
        <div className="flex items-center gap-1.5 text-zinc-400 text-sm mb-6">
          <MapPin className="w-4 h-4" /> {first.location}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
            <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Datum</div>
            <div className="flex items-center gap-2 text-white font-bold">
              <Calendar className="w-4 h-4 text-blue-500" />
              {start.toLocaleDateString()}
            </div>
          </div>
          <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
            <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Uur</div>
            <div className="flex items-center gap-2 text-white font-bold">
              <Clock className="w-4 h-4 text-blue-500" />
              {start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>

        {/* Status Box */}
        <div className={clsx("p-4 rounded-xl border flex items-center justify-between",
           mySlot ? "bg-green-900/10 border-green-900/30" : 
           myApplication?.status === 'PENDING' ? "bg-yellow-900/10 border-yellow-900/30" :
           myApplication?.status === 'REJECTED' ? "bg-red-900/10 border-red-900/30" :
           "bg-zinc-950 border-zinc-800"
        )}>
           <div className="flex items-center gap-3">
              {mySlot ? <CheckCircle className="w-6 h-6 text-green-500" /> : 
               myApplication?.status === 'PENDING' ? <FileQuestion className="w-6 h-6 text-yellow-500" /> :
               myApplication?.status === 'REJECTED' ? <XCircle className="w-6 h-6 text-red-500" /> :
               <Info className="w-6 h-6 text-zinc-500" />}
              
              <div>
                 <div className={clsx("font-bold", 
                    mySlot ? "text-green-400" : 
                    myApplication?.status === 'PENDING' ? "text-yellow-500" :
                    myApplication?.status === 'REJECTED' ? "text-red-500" :
                    "text-white"
                 )}>
                    {mySlot ? "Je bent ingepland" : 
                     myApplication?.status === 'PENDING' ? "Aanvraag verstuurd – wacht op goedkeuring" :
                     myApplication?.status === 'REJECTED' ? "Aanvraag geweigerd" :
                     "Beschikbaar"}
                 </div>
                 {myApplication?.status === 'REJECTED' && myApplication.note && (
                     <div className="text-xs text-red-400 mt-1 italic">"{myApplication.note}"</div>
                 )}
                 {!mySlot && !myApplication && (
                    <div className="text-xs text-zinc-500">
                       Nog <strong className="text-white">{openCount}</strong> van {total} plaatsen vrij
                    </div>
                 )}
              </div>
           </div>
        </div>
        
        {/* Report Action Button (Only if assigned) */}
        {mySlot && (
            <button 
                onClick={handleCreateReport}
                className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
            >
                <FileText className="w-4 h-4" /> Rapport Opstellen
            </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-24">
         <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" /> Instructies
         </h3>
         <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
            {/* Hardcoded instruction for demo, usually from shift.details */}
            Meld je aan bij de receptie voor aanvang dienst. Draag correct uniform en zichtbare badge. 
            Zorg dat je 15 minuten op voorhand aanwezig bent.
         </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent backdrop-blur-sm">
         <div className="max-w-lg mx-auto">
            
            {mySlot ? (
               <button 
                  onClick={handleUnclaim}
                  disabled={loading}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                  {loading ? "Bezig..." : <><XCircle className="w-5 h-5" /> Afmelden voor shift</>}
               </button>
            ) : myApplication?.status === 'PENDING' ? (
                <button 
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-zinc-700"
               >
                  {loading ? "Bezig..." : <><RotateCcw className="w-5 h-5" /> Aanvraag intrekken</>}
               </button>
            ) : myApplication?.status === 'REJECTED' ? (
                <button disabled className="w-full bg-zinc-900 text-zinc-500 font-bold py-4 rounded-xl border border-zinc-800 cursor-not-allowed">
                    Niet mogelijk om opnieuw aan te vragen
                </button>
            ) : (
               <button 
                  onClick={handleApply}
                  disabled={loading || openCount === 0}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500"
               >
                  {loading ? "Bezig..." : openCount === 0 ? "Shift is volzet" : "Opgeven voor deze shift"}
               </button>
            )}
         </div>
      </div>
    </div>
  );
};