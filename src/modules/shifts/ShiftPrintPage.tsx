
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { Printer, ArrowLeft, MapPin, Clock, Users, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ShiftPrintPage: React.FC = () => {
  const { id } = useParams(); // Group ID
  const navigate = useNavigate();
  const { shifts, employees, clients } = useStore();
  const { t } = useTranslation();

  const targetShifts = shifts.filter(s => s.groupId === id);
  if (targetShifts.length === 0) return <div className="p-8 bg-white text-black">Shift groep niet gevonden.</div>;
  
  const first = targetShifts[0];
  const client = clients.find(c => c.name === first.clientName);
  
  // Reference generation: AV-YYYYMMDD-CLI-HHMM
  const dateStr = first.startTime.split('T')[0].replace(/-/g, '');
  const timeStr = first.startTime.split('T')[1].replace(':', '').substring(0, 4);
  const clientShort = first.clientName.substring(0, 3).toUpperCase();
  const reference = `AV-${dateStr}-${clientShort}-${timeStr}`;

  return (
    <div className="bg-white text-black min-h-screen font-sans">
        <style>{`
            @media print { 
                .print-hidden { display: none !important; } 
                body { background-color: #ffffff !important; color: #000000 !important; }
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @page { margin: 1cm; }
                .footer { position: fixed; bottom: 0; left: 0; right: 0; }
            }
        `}</style>
        
        {/* Controls */}
        <div className="print-hidden bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold"><ArrowLeft className="w-4 h-4" /> Terug</button>
            <button onClick={() => window.print()} className="bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-yellow-500 shadow-lg"><Printer className="w-4 h-4" /> Afdrukken</button>
        </div>

        <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2 text-black">Opdrachtfiche</h1>
                    <div className="text-xl font-bold text-gray-800">{first.clientName}</div>
                    <div className="text-sm font-mono text-gray-500">Ref: {reference}</div>
                </div>
                <div className="text-right text-black">
                    <div className="text-sm font-bold">{new Date().toLocaleDateString()}</div>
                    <div className="text-xs uppercase tracking-widest mt-1">Apex Vigilance Group</div>
                </div>
            </div>

            {/* Client & Location Block (Top) */}
            <div className="mb-8 p-4 border border-gray-300 bg-gray-50 rounded">
                <h3 className="font-bold border-b border-gray-300 pb-2 mb-2 uppercase text-xs text-gray-500">Klant & Locatie</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="font-bold text-lg">{first.clientName}</div>
                        <div>{client?.address || "Adres niet opgegeven"}</div>
                        <div>{client?.vat || ""}</div>
                    </div>
                    <div>
                        <div className="font-bold text-lg flex items-center gap-1"><MapPin className="w-4 h-4" /> {first.location}</div>
                        <div>Contact: {client?.contact || "Niet opgegeven"}</div>
                        <div>Tel/Email: {client?.phone || client?.email || "Niet opgegeven"}</div>
                    </div>
                </div>
            </div>

            {/* Assignment Details */}
            <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded border border-gray-200">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tijdstip</label>
                    <div className="flex items-center gap-2 font-mono text-black font-medium text-lg">
                        <Clock className="w-5 h-5" /> 
                        {new Date(first.startTime).toLocaleDateString()} <br/>
                        {new Date(first.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(first.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Capaciteit</label>
                    <div className="text-black font-bold text-lg">{targetShifts.length} Agenten</div>
                </div>
                {first.exeCode && (
                    <div className="col-span-2">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Functiecode</label>
                        <div className="text-black font-bold">{first.exeCode}</div>
                    </div>
                )}
            </div>

            {/* Personnel */}
            <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2 flex items-center gap-2 text-black">
                    <Users className="w-5 h-5" /> Toegewezen Personeel
                </h3>
                <table className="w-full text-sm text-left border-collapse text-black">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="py-2 px-3 font-bold uppercase text-xs">Slot</th>
                            <th className="py-2 px-3 font-bold uppercase text-xs">Naam</th>
                            <th className="py-2 px-3 font-bold uppercase text-xs">Rol</th>
                            <th className="py-2 px-3 font-bold uppercase text-xs">Badge Nr</th>
                        </tr>
                    </thead>
                    <tbody>
                        {targetShifts.map((s, idx) => {
                            const emp = employees.find(e => e.id === s.employeeId);
                            return (
                                <tr key={s.id} className="border-b border-gray-200">
                                    <td className="py-3 px-3 font-mono text-gray-600">#{idx+1}</td>
                                    <td className="py-3 px-3 font-bold text-lg">{emp ? emp.name : <span className="text-gray-400 italic">Open positie</span>}</td>
                                    <td className="py-3 px-3">{emp ? (emp.role === 'Guard' ? t('roles.guard') : t('roles.senior')) : '-'}</td>
                                    <td className="py-3 px-3 font-mono">{emp?.badgeNr || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Briefing */}
            <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2 flex items-center gap-2 text-black">
                    <FileText className="w-5 h-5" /> Briefing & Instructies
                </h3>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded min-h-[100px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {first.briefing || "Geen briefing opgegeven."}
                </div>
            </div>

            {/* Footer */}
            <div className="footer mt-auto pt-6 border-t-2 border-black text-[10px] leading-relaxed text-gray-700 text-center bg-white">
                <p className="font-bold text-sm mb-1">Apex Vigilance Group (Apex VG BV)</p>
                <p>Dorp 65 bus B, 2275 Poederlee (Lille), België</p>
                <p>T: 0488 60 16 86  |  E: info@apexsecurity.be  |  W: apexsecurity.be</p>
                <p>KBO/Verg. Nummer IBZ: BE 1007.737.354  |  Verzekerd: Vivium (P&V) – polis 3200235321</p>
            </div>
        </div>
    </div>
  );
};
