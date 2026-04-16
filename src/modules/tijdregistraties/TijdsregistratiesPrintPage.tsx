import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { ArrowLeft, User, MapPin, Info, Download } from 'lucide-react';
import { filterTimeLogs } from './utils/filterLogs';
import { generateTimeLogsPdf } from './utils/generateTimeLogsPdf';

export const TijdsregistratiesPrintPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { timeLogs, employees, shifts } = useStore();
  
  const singleId = searchParams.get('id');
  const filterDate = searchParams.get('date'); 
  const filterStatus = searchParams.get('status');
  const filterSearch = searchParams.get('search');

  const uniqueRef = useMemo(() => {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14); 
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TR-${dateStr}-${random}`;
  }, []);

  const filteredLogs = filterTimeLogs(timeLogs, employees, {
      date: filterDate,
      status: filterStatus,
      search: filterSearch
  });

  const handleDownloadPdf = () => {
      // Use filtered logs if listing, or specific log if singleId is present
      const logsToPrint = singleId ? timeLogs.filter(l => l.id === singleId) : filteredLogs;
      
      const blob = generateTimeLogsPdf(logsToPrint, employees, shifts, {
          date: filterDate,
          status: filterStatus,
          search: filterSearch
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tijdsregistratie_Export_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // -- SINGLE ITEM PRINT VIEW --
  if (singleId) {
    const log = timeLogs.find(l => l.id === singleId);
    const emp = employees.find(e => e.id === log?.employeeId);
    const shift = shifts.find(s => s.id === log?.shiftId);

    if (!log) return <div className="p-8 text-black bg-white">Registratie niet gevonden.</div>;

    return (
      <div className="bg-white text-black min-h-screen font-sans">
        
        {/* Controls */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex justify-between items-center mb-2">
             <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold">
               <ArrowLeft className="w-4 h-4" /> Terug
             </button>
             <div className="ml-4 text-xs font-mono text-yellow-500 bg-zinc-800 px-2 py-1 rounded border border-yellow-600/30 flex items-center gap-2">
                <Info className="w-3 h-3"/> PREVIEW MODUS
             </div>
          </div>
          <button onClick={handleDownloadPdf} className="bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-yellow-500 shadow-lg">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-8">
          <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight mb-2 text-black">Tijdregistratie Detail</h1>
              <div className="text-sm font-mono text-gray-600">ID: {log.id}</div>
              <div className="text-sm font-mono text-gray-600 font-bold mt-1">Ref: {uniqueRef}</div>
            </div>
            <div className="text-right text-black">
              <div className="text-sm font-bold">{new Date().toLocaleDateString()}</div>
              <div className="text-xs uppercase tracking-widest mt-1">Apex Vigilance Group</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded border border-gray-200 text-black">
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
             <div className="mb-8 p-4 bg-gray-100 border border-gray-300 rounded text-black">
                <h3 className="font-bold mb-1">Opmerking / Correctie</h3>
                <p className="text-sm italic">{log.correctionReason}</p>
             </div>
          )}
        </div>
      </div>
    );
  }

  // -- LIST PREVIEW --
  return (
    <div className="bg-white text-black min-h-screen font-sans">
      
      {/* Controls */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold">
             <ArrowLeft className="w-4 h-4" /> Terug
           </button>
           <div className="text-xs font-mono text-yellow-500 bg-zinc-800 px-2 py-1 rounded border border-yellow-600/30 flex items-center gap-2">
                <Info className="w-3 h-3"/> PREVIEW
           </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="text-xs text-zinc-500 font-mono">
               Records: {filteredLogs.length}
            </div>
            <button onClick={handleDownloadPdf} className="bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-yellow-500 shadow-lg">
              <Download className="w-4 h-4" /> Download PDF
            </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase text-black">Tijdsregistraties</h1>
            <div className="text-xs font-mono text-gray-600 font-bold mt-1">Ref: {uniqueRef}</div>
          </div>
          <div className="text-right text-xs text-gray-500">
             {new Date().toLocaleString()}
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Filter: {filterDate || 'Alle data'} {filterStatus ? `| Status: ${filterStatus}` : ''}
        </div>

        <table className="w-full text-sm text-left border-collapse text-black">
          <thead>
            <tr className="border-b-2 border-black bg-gray-50">
              <th className="py-2 px-2 text-black font-bold">Datum</th>
              <th className="py-2 px-2 text-black font-bold">Agent</th>
              <th className="py-2 px-2 text-black font-bold">Shift / Locatie</th>
              <th className="py-2 px-2 text-right text-black font-bold">In</th>
              <th className="py-2 px-2 text-right text-black font-bold">Uit</th>
              <th className="py-2 px-2 text-center text-black font-bold">Status</th>
              <th className="py-2 px-2 text-black font-bold">Opmerking</th>
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
                <tr key={log.id} className="border-b border-gray-300">
                  <td className="py-2 px-2 text-black">{date}</td>
                  <td className="py-2 px-2 font-bold text-black">{emp?.name || 'Onbekend'}</td>
                  <td className="py-2 px-2 text-black">
                    <div className="font-bold">{shift?.clientName}</div>
                    <div className="text-xs text-gray-600">{shift?.location}</div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-black">{inTime}</td>
                  <td className="py-2 px-2 text-right font-mono text-black">{outTime}</td>
                  <td className="py-2 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border border-gray-400 ${
                      log.status === 'LATE' ? 'text-red-700' : 
                      log.status === 'EDITED' ? 'text-orange-700' : 'text-black'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs italic text-gray-600 max-w-[150px] truncate">{log.correctionReason || '-'}</td>
                </tr>
              );
            })}
            {filteredLogs.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-500 italic">
                    Geen registraties gevonden voor deze selectie.
                </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};