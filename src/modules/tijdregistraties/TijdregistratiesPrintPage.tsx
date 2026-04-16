import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { Printer, ArrowLeft, User, MapPin } from 'lucide-react';

export const TijdsregistratiesPrintPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { timeLogs, employees, shifts } = useStore();

  const singleId = searchParams.get('id');
  const filterDate = searchParams.get('date');
  const filterStatus = searchParams.get('status');
  const filterSearch = searchParams.get('search');

  // -- SINGLE ITEM PRINT VIEW --
  if (singleId) {
    const log = timeLogs.find(l => l.id === singleId);
    const emp = employees.find(e => e.id === log?.employeeId);
    const shift = shifts.find(s => s.id === log?.shiftId);

    if (!log) return <div className="p-8 text-black bg-white">Registratie niet gevonden.</div>;

    return (
      <div className="bg-white text-black min-h-screen font-sans">
        <style>{`
          @media print {
            .print-hidden { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
        
        {/* Manual Controls */}
        <div className="print-hidden bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold">
            <ArrowLeft className="w-4 h-4" /> Terug
          </button>
          <button onClick={() => window.print()} className="bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-yellow-500 shadow-lg">
            <Printer className="w-4 h-4" /> Afdrukken
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-8">
          <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Tijdregistratie Detail</h1>
              <div className="text-sm font-mono text-gray-600">ID: {log.id}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">{new Date().toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">Apex Vigilance Group</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded border border-gray-200">
             <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Agent</label>
                <div className="font-bold text-lg flex items-center gap-2">
                   <User className="w-4 h-4" /> {emp?.name || 'Onbekend'}
                </div>
             </div>
             <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Opdracht / Locatie</label>
                <div className="font-bold flex items-center gap-2">
                   <MapPin className="w-4 h-4" /> {shift?.clientName} - {shift?.location}
                </div>
             </div>
             
             <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Start (In)</label>
                <div className="font-mono text-lg">{new Date(log.clockIn).toLocaleString()}</div>
             </div>
             <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Eind (Uit)</label>
                <div className="font-mono text-lg">{log.clockOut ? new Date(log.clockOut).toLocaleString() : '-'}</div>
             </div>

             <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Status</label>
                <div className="font-bold uppercase flex items-center gap-2">
                   {log.status} {log.deviationMinutes !== 0 && `(${log.deviationMinutes} min)`}
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Goedkeuring</label>
                <div className="font-bold uppercase">{log.approvalStatus}</div>
             </div>
          </div>

          {log.correctionReason && (
             <div className="mb-8 p-4 bg-gray-100 border border-gray-300 rounded">
                <h3 className="font-bold mb-1">Opmerking / Correctie</h3>
                <p className="text-sm italic">{log.correctionReason}</p>
             </div>
          )}

          <div className="mt-12 pt-4 border-t-2 border-black text-center text-xs text-gray-500">
             <p>Gegenereerd door Apex Ops - Vertrouwelijk Document</p>
          </div>
        </div>
      </div>
    );
  }

  // -- LIST PRINT VIEW (Default) --
  const filteredLogs = timeLogs.filter(log => {
    if (filterDate && !log.clockIn.startsWith(filterDate)) return false;
    if (filterStatus && log.status !== filterStatus) return false;
    if (filterSearch) {
      const emp = employees.find(e => e.id === log.employeeId);
      if (!emp?.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime());

  return (
    <div className="bg-white text-black min-h-screen font-sans">
      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      
      {/* Manual Controls */}
      <div className="print-hidden bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Terug
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-yellow-500 shadow-lg"
        >
          <Printer className="w-4 h-4" /> Afdrukken
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-black uppercase">Tijdsregistraties</h1>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Filter: {filterDate || 'Alle data'} {filterStatus ? `| Status: ${filterStatus}` : ''}
        </div>

        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2">Datum</th>
              <th className="py-2">Agent</th>
              <th className="py-2">Shift / Locatie</th>
              <th className="py-2 text-right">In</th>
              <th className="py-2 text-right">Uit</th>
              <th className="py-2 text-center">Status</th>
              <th className="py-2">Opmerking</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => {
              const emp = employees.find(e => e.id === log.employeeId);
              const shift = shifts.find(s => s.id === log.shiftId);
              const inTime = new Date(log.clockIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
              const outTime = log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-';
              const date = new Date(log.clockIn).toLocaleDateString();

              return (
                <tr key={log.id} className="border-b border-gray-200">
                  <td className="py-2">{date}</td>
                  <td className="py-2 font-bold">{emp?.name || 'Onbekend'}</td>
                  <td className="py-2">
                    <div>{shift?.clientName}</div>
                    <div className="text-xs text-gray-500">{shift?.location}</div>
                  </td>
                  <td className="py-2 text-right font-mono">{inTime}</td>
                  <td className="py-2 text-right font-mono">{outTime}</td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      log.status === 'LATE' ? 'bg-red-100 text-red-700' : 
                      log.status === 'EDITED' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 text-xs italic text-gray-600">{log.correctionReason || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};