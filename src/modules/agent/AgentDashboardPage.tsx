import React from 'react';
import { Clock, MapPin, CheckCircle } from 'lucide-react';

export const AgentDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-2xl font-black text-white mb-2">Welkom, Agent</h2>
        <p className="text-zinc-400 text-sm">Hieronder vindt u uw actieve taken en planning.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" /> Huidige Dienst
        </h3>
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-zinc-500 italic">
          Geen actieve dienst gestart.
        </div>
        <button className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors">
          Start Dienst
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-yellow-600/50 transition-colors cursor-pointer">
          <MapPin className="w-8 h-8 text-yellow-500" />
          <span className="text-sm font-bold text-zinc-300">Mijn Locaties</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-green-600/50 transition-colors cursor-pointer">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <span className="text-sm font-bold text-zinc-300">Taken</span>
        </div>
      </div>
    </div>
  );
};