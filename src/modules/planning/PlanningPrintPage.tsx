import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { Printer, ArrowLeft, Calendar, Clock, MapPin, Users, Tag } from 'lucide-react';

export const PlanningPrintPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { shifts, employees } = useStore();

  const period = searchParams.get('period'); // Today, Week, Month
  const groupId = searchParams.get('id');

  const Footer = () => (
    <div className="mt-12 pt-6 border-t-2 border-black text-[10px] leading-relaxed text-gray-700 text-center">
        <p className="font-bold text-sm mb-1">Apex Vigilance Group (Apex VG BV)</p>
        <p>Dorp 65 bus B, 2275 Poederlee (Lille), België</p>
        <p>T: 0488 60 16 86  |  E: info@apexsecurity.be  |  W: apexsecurity.be</p>
        <p>KBO/Verg. Nummer IBZ: BE 1007.737.354  |  Verzekerd: Vivium (P&V) – polis 3200235321</p>
    </div>
  );

  // -- SINGLE GROUP PRINT --
  if (groupId) {
    const targetShifts = shifts.filter(s => s.groupId === groupId);
    if (targetShifts.length === 0) return <div className="p-8 text-black bg-white">Groep niet gevonden of verwijderd.</div>;
    const first = targetShifts[0];

    return (
        <div className="bg-white text-black min-h-screen font-sans print-page">
            <style>{`
                @media print { 
                    .print-hidden { display: none !important; } 
                    body, .print-page { background-color: #ffffff !important; color: #000000 !important; }
                    table, th, td { color: #000000 !important; border-color: #cccccc !important; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
            <div className="print-hidden bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold"><ArrowLeft className="w-4 h-4" /> Terug</button>
                <button onClick={() => window.print()} className="bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-yellow-500 shadow-lg"><Printer className="w-4 h-4" /> Afdrukken</button>
            </div>
            <div className="max-w-4xl mx-auto p-8 bg-white">
                <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight mb-2 text-black">Planning Detail</h1>
                        <div className="text-lg font-bold text-gray-700">{first.clientName}</div>
                        <div className="text-sm font-mono text-gray-500">Ref: {first.groupId}</div>
                    </div>
                    <div className="text-right text-black">
                        <div className="text-sm font-bold">{new Date().toLocaleDateString()}</div>
                        {first.exeCode && <div className="mt-2 bg-gray-100 px-2 py-1 border border-gray-300 rounded font-bold text-xs text-black">EXE CODE: {first.exeCode}</div>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded border border-gray-200">
                    <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Locatie</label><div className="flex items-center gap-2 text-black"><MapPin className="w-4 h-4" /> {first.location}</div></div>
                    <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tijdstip</label><div className="flex items-center gap-2 font-mono text-black"><Clock className="w-4 h-4" /> {new Date(first.startTime).toLocaleDateString()} | {new Date(first.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(first.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></div>
                </div>
                <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-1 flex items-center gap-2 text-black"><Users className="w-5 h-5" /> Toegewezen Personeel</h3>
                <table className="w-full text-sm text-left border-collapse mb-8 text-black">
                    <thead><tr className="bg-gray-100 border-b border-gray-300"><th className="py-2 px-3 text-black font-bold">Slot</th><th className="py-2 px-3 text-black font-bold">Naam</th><th className="py-2 px-3 text-black font-bold">Rol</th><th className="py-2 px-3 text-black font-bold">Badge</th></tr></thead>
                    <tbody>
                        {targetShifts.map((s, idx) => {
                            const emp = employees.find(e => e.id === s.employeeId);
                            return (
                                <tr key={s.id} className="border-b border-gray-200 text-black">
                                    <td className="py-2 px-3 font-mono text-gray-600">#{idx+1}</td>
                                    <td className="py-2 px-3 font-bold">{emp ? emp.name : <span className="text-gray-400 italic">Open positie</span>}</td>
                                    <td className="py-2 px-3">{emp?.role || '-'}</td>
                                    <td className="py-2 px-3 font-mono">{emp?.badgeNr || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <Footer />
            </div>
        </div>
    );
  }

  // -- SUMMARY LIST PRINT --
  const filteredData = useMemo(() => {
    let result = [...shifts];
    const now = new Date();

    if (period === 'Today') {
        result = result.filter(s => new Date(s.startTime).toDateString() === now.toDateString());
    } else if (period === 'Week') {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        result = result.filter(s => { const d = new Date(s.startTime); return d >= startOfWeek && d < endOfWeek; });
    } else if (period === 'Month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        result = result.filter(s => { const d = new Date(s.startTime); return d >= startOfMonth && d <= endOfMonth; });
    }
    
    // Group them for summary
    const groups: Record<string, any> = {};
    result.forEach(s => {
        if (!groups[s.groupId]) {
            groups[s.groupId] = {
                client: s.clientName,
                location: s.location,
                start: s.startTime,
                end: s.endTime,
                exe: s.exeCode,
                total: 0,
                filled: 0
            };
        }
        groups[s.groupId].total++;
        if (s.employeeId) groups[s.groupId].filled++;
    });

    return Object.values(groups).sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [shifts, period]);

  return (
    <div className="bg-white text-black min-h-screen font-sans print-page">
        <style>{` 
            @media print { 
                .print-hidden { display: none !important; } 
                body, .print-page { background-color: #ffffff !important; color: #000000 !important; }
                table, th, td { color: #000000 !important; border-color: #cccccc !important; }
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            } 
        `}</style>
        <div className="print-hidden bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold"><ArrowLeft className="w-4 h-4" /> Terug</button>
            <button onClick={() => window.print()} className="bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-yellow-500 shadow-lg"><Printer className="w-4 h-4" /> Afdrukken</button>
        </div>
        <div className="max-w-4xl mx-auto p-8 bg-white">
            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
                <div>
                  <h1 className="text-2xl font-black uppercase text-black">Planning Export — {period === 'Today' ? 'Vandaag' : period === 'Week' ? 'Deze Week' : 'Deze Maand'}</h1>
                  <div className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Apex Vigilance Group</div>
                </div>
                <div className="text-right text-xs text-gray-500">{new Date().toLocaleString()}</div>
            </div>
            <table className="w-full text-xs text-left border-collapse text-black">
                <thead><tr className="bg-gray-50 border-b-2 border-black">
                    <th className="py-2 px-2 text-black font-bold">Datum</th><th className="py-2 px-2 text-black font-bold">Klant</th><th className="py-2 px-2 text-black font-bold">Locatie</th><th className="py-2 px-2 text-black font-bold">Tijd</th><th className="py-2 px-2 text-center text-black font-bold">Slots</th><th className="py-2 px-2 text-center text-black font-bold">Open</th><th className="py-2 px-2 text-black font-bold">EXE</th>
                </tr></thead>
                <tbody>
                    {filteredData.map((g, i) => (
                        <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-2 px-2 text-black">{new Date(g.start).toLocaleDateString()}</td>
                            <td className="py-2 px-2 font-bold text-black">{g.client}</td>
                            <td className="py-2 px-2 text-black">{g.location}</td>
                            <td className="py-2 px-2 font-mono whitespace-nowrap text-black">{new Date(g.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(g.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                            <td className="py-2 px-2 text-center font-bold text-black">{g.filled} / {g.total}</td>
                            <td className="py-2 px-2 text-center text-red-600 font-bold">{g.total - g.filled}</td>
                            <td className="py-2 px-2 font-mono text-black">{g.exe || '-'}</td>
                        </tr>
                    ))}
                    {filteredData.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-400 italic">Geen geplande shifts gevonden voor deze periode.</td></tr>
                    )}
                </tbody>
            </table>
            <Footer />
        </div>
    </div>
  );
};