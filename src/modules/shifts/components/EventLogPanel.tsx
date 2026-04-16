import React from 'react';
import { Activity } from 'lucide-react';

export interface ShiftEvent {
  id: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  message: string;
  timestamp: string;
  user: string;
}

interface EventLogPanelProps {
  logs: ShiftEvent[];
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({ logs }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-apex-gold" /> Logboek
      </h3>

      <div className="space-y-4 relative pl-2">
         {/* Vertical Line */}
         <div className="absolute left-[9px] top-2 bottom-2 w-[1px] bg-zinc-800" />
         
         {logs.length === 0 ? (
            <div className="text-sm text-zinc-500 italic pl-6">Nog geen activiteiten.</div>
         ) : (
            logs.map((log) => (
               <div key={log.id} className="relative pl-8">
                  <div className={`absolute left-0 top-1.5 w-[19px] h-[19px] -ml-[0px] bg-zinc-900 border-2 rounded-full z-10 flex items-center justify-center ${
                     log.type === 'SUCCESS' ? 'border-green-500' :
                     log.type === 'WARNING' ? 'border-orange-500' : 'border-zinc-600'
                  }`}>
                     <div className={`w-1.5 h-1.5 rounded-full ${
                        log.type === 'SUCCESS' ? 'bg-green-500' :
                        log.type === 'WARNING' ? 'bg-orange-500' : 'bg-zinc-400'
                     }`} />
                  </div>
                  
                  <div className="text-sm text-zinc-300">
                     <span className="font-bold text-white">{log.message}</span>
                  </div>
                  <div className="text-xs text-zinc-500 flex gap-2 mt-0.5">
                     <span>{new Date(log.timestamp).toLocaleString()}</span>
                     <span>•</span>
                     <span>{log.user}</span>
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
};