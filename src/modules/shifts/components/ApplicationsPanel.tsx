import React from 'react';
import { User, Check, X, Clock, History, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { ShiftApplication } from '../../../data/types';
import clsx from 'clsx';

interface ApplicationsPanelProps {
  applications: ShiftApplication[]; // Pending applications
  history: ShiftApplication[]; // Approved, Rejected, Withdrawn
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
}

export const ApplicationsPanel: React.FC<ApplicationsPanelProps> = ({
  applications,
  history,
  onApprove,
  onReject
}) => {
  const handleRejectClick = (appId: string) => {
      const reason = prompt("Reden van weigering (optioneel):");
      if (reason !== null) {
          onReject(appId, reason);
      }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="flex items-center gap-1 text-[10px] bg-green-900/20 text-green-500 px-2 py-0.5 rounded border border-green-900/30 font-bold"><CheckCircle2 className="w-3 h-3" /> GOEDGEKEURD</span>;
      case 'REJECTED': return <span className="flex items-center gap-1 text-[10px] bg-red-900/20 text-red-500 px-2 py-0.5 rounded border border-red-900/30 font-bold"><XCircle className="w-3 h-3" /> GEWEIGERD</span>;
      case 'WITHDRAWN': return <span className="flex items-center gap-1 text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 font-bold"><Ban className="w-3 h-3" /> INGETROKKEN</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* PENDING SECTION */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-apex-gold" /> Openstaande Aanvragen
          </h3>
          <span className="bg-zinc-800 text-white text-xs font-bold px-2 py-1 rounded-full border border-zinc-700">
            {applications.length}
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded bg-zinc-950/50">
             <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
             <p className="text-sm">Geen openstaande aanmeldingen.</p>
          </div>
        ) : (
          <div className="space-y-3">
             {applications.map(app => (
                <div key={app.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex justify-between items-center group hover:border-apex-gold/30 transition-colors shadow-sm">
                   <div>
                      <div className="font-bold text-white text-base">{app.agentName}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                         <Clock className="w-3 h-3" /> {new Date(app.createdAt).toLocaleDateString()} {new Date(app.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <button 
                         onClick={() => onApprove(app.id)}
                         className="p-2 bg-green-900/20 text-green-500 rounded hover:bg-green-900/40 border border-transparent hover:border-green-900/50 transition-colors"
                         title="Goedkeuren"
                      >
                         <Check className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => handleRejectClick(app.id)}
                         className="p-2 bg-red-900/20 text-red-500 rounded hover:bg-red-900/40 border border-transparent hover:border-red-900/50 transition-colors"
                         title="Afwijzen"
                      >
                         <X className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* HISTORY SECTION */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 opacity-75 hover:opacity-100 transition-opacity">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-wide">
            <History className="w-4 h-4" /> Historiek
          </h3>
        </div>

        {history.length === 0 ? (
          <div className="text-sm text-zinc-600 italic">Geen historiek beschikbaar.</div>
        ) : (
          <div className="space-y-2">
             {history.map(app => (
                <div key={app.id} className="bg-zinc-950/50 border border-zinc-800 p-3 rounded flex justify-between items-center">
                   <div>
                      <div className="font-bold text-zinc-300 text-sm">{app.agentName}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                         Beslist op: {app.decidedAt ? new Date(app.decidedAt).toLocaleDateString() : '-'}
                         {app.decidedBy && ` door ${app.decidedBy}`}
                      </div>
                      {app.note && (
                        <div className="text-[10px] text-zinc-500 italic mt-1">"{app.note}"</div>
                      )}
                   </div>
                   <div>
                      {getStatusBadge(app.status)}
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};