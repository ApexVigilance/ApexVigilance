import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../data/store';
import { Printer, User, Phone, Mail, MapPin, ArrowLeft, Shield, Clock } from 'lucide-react';
import clsx from 'clsx';

export const PersoneelPrintPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { employees } = useStore();
  const emp = employees.find(e => e.id === id);

  if (!emp) return <div className="p-8 text-black bg-white">Medewerker niet gevonden.</div>;

  const now = new Date();
  const expiryDate = emp.badgeExpiry ? new Date(emp.badgeExpiry) : null;
  const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;

  let badgeLabel = 'GELDIG';
  if (daysToExpiry < 0) badgeLabel = 'VERLOPEN';
  else if (daysToExpiry < 15) badgeLabel = 'DRINGEND';
  else if (daysToExpiry < 60) badgeLabel = 'BINNENKORT';

  return (
    <div className="bg-white text-black min-h-screen font-sans flex flex-col">
      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; }
          .footer-print { position: fixed; bottom: 0; left: 0; right: 0; }
        }
      `}</style>
      
      {/* Manual Controls */}
      <div className="print-hidden bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
        <button 
          onClick={() => navigate(-1)}
          className="text-zinc-400 hover:text-white flex items-center gap-2 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Terug
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-yellow-500 transition-colors shadow-lg"
        >
          <Printer className="w-4 h-4" /> Afdrukken
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight mb-2">{emp.name}</h1>
            <div className="text-xl font-bold text-gray-700">{emp.role}</div>
            <div className="text-sm font-mono text-gray-500 mt-2">Medewerker ID: {emp.id}</div>
          </div>
          <div className="text-right">
             <div className="bg-gray-100 px-3 py-1 rounded border border-gray-300 font-bold mb-2">
                STATUS: {emp.status === 'Active' ? 'ACTIEF' : 'INACTIEF'}
             </div>
             <div className="text-xs text-gray-500">Export datum: {new Date().toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Section: Personal */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-sm font-bold mb-4 border-b border-gray-300 pb-1 flex items-center gap-2 uppercase tracking-wider text-gray-600">
              <User className="w-4 h-4" /> Persoonsgegevens
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 font-bold">Email:</span><span>{emp.email || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-bold">Telefoon:</span><span>{emp.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-bold">Adres:</span><span className="text-right max-w-[180px]">{emp.address || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-bold">RR-Nummer:</span><span className="font-mono">{emp.nationalRegisterNr || '-'}</span></div>
            </div>
          </div>

          {/* Section: Badge */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-sm font-bold mb-4 border-b border-gray-300 pb-1 flex items-center gap-2 uppercase tracking-wider text-gray-600">
              <Shield className="w-4 h-4" /> Identificatie & Badge
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 font-bold">Badge Nr:</span><span className="font-mono font-bold">{emp.badgeNr || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 font-bold">Vervaldatum:</span><span>{emp.badgeExpiry || '-'}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold">Verloop Status:</span>
                <span className={clsx("font-black px-2 rounded", 
                  badgeLabel === 'VERLOPEN' ? "bg-red-100 text-red-600" : 
                  badgeLabel === 'DRINGEND' ? "bg-orange-100 text-orange-600" :
                  "bg-green-100 text-green-600"
                )}>{badgeLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Onboarding status */}
        <div className="mb-8">
           <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-gray-600 border-b border-gray-300 pb-1">Dossier Validatie</h3>
           <div className="grid grid-cols-3 gap-4">
              <div className="border border-gray-200 p-2 rounded text-center">
                 <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Persoonsgeg.</div>
                 <div className="text-xs font-bold">{emp.personalInfoStatus}</div>
              </div>
              <div className="border border-gray-200 p-2 rounded text-center">
                 <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">ID Kaart</div>
                 <div className="text-xs font-bold">{emp.idCardStatus}</div>
              </div>
              <div className="border border-gray-200 p-2 rounded text-center">
                 <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Badge Data</div>
                 <div className="text-xs font-bold">{emp.badgeDataStatus}</div>
              </div>
           </div>
        </div>

        {/* Audit Log - NO TRUNCATE */}
        <div className="mb-8 break-inside-avoid">
          <h3 className="text-sm font-bold mb-4 border-b border-gray-300 pb-1 flex items-center gap-2 uppercase tracking-wider text-gray-600">
            <Clock className="w-4 h-4" /> Audit Trail (Laatste logs)
          </h3>
          <div className="space-y-4">
            {emp.auditLog && emp.auditLog.length > 0 ? (
              emp.auditLog.slice(-10).reverse().map((log, i) => (
                <div key={i} className="text-xs border-l-2 border-gray-200 pl-4 py-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-900 uppercase">{log.action}</span>
                    <span className="text-gray-500 font-mono">{new Date(log.date).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-600">Door: {log.user}</div>
                  {log.reason && (
                    <div className="mt-1 p-2 bg-gray-100 rounded border border-gray-200 italic text-gray-800 whitespace-pre-wrap">
                      "{log.reason}"
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 italic">Geen audit logs gevonden.</div>
            )}
          </div>
        </div>
      </div>

      {/* PROFESSIONAL FOOTER (EXACT TEXT) */}
      <div className="footer-print border-t-2 border-black p-8 bg-white">
        <div className="max-w-4xl mx-auto text-center text-[10px] leading-relaxed text-gray-700">
           <p className="font-bold text-sm mb-1">Apex Vigilance Group (Apex VG BV)</p>
           <p>Dorp 65 bus B, 2275 Poederlee (Lille), België</p>
           <p>T: 0488 60 16 86  |  E: info@apexsecurity.be  |  W: apexsecurity.be</p>
           <p>KBO/Verg. Nummer IBZ: BE 1007.737.354  |  Verzekerd: Vivium (P&V) – polis 3200235321</p>
        </div>
      </div>
    </div>
  );
};