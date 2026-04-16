import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../../ui/BackButton';
import { useStore, OnboardingStatus } from '../../data/store';
import { Employee } from '../../data/types';
import {
  User, Shield, FileText, AlertTriangle,
  ToggleLeft, ToggleRight, CheckCircle, XCircle, Download, Printer,
  KeyRound, Eye, EyeOff, Save
} from 'lucide-react';
import clsx from 'clsx';
import { generatePersoneelDetailPdf } from './utils/generatePersoneelPdf';
import { downloadPdf } from '../../utils/pdf/pdfCore';
import { printPdfBlob } from '../../utils/pdf/printPdf';

// ── Portal credentials component ───────────────────────
const PortalCredentials: React.FC<{ employee: Employee; updateEmployee: (id: string, u: Partial<Employee>) => void }> = ({ employee, updateEmployee }) => {
  const [username, setUsername] = useState(employee.portalUsername || employee.email || '');
  const [password, setPassword] = useState(employee.portalPassword || '');
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateEmployee(employee.id, { portalUsername: username.trim(), portalPassword: password.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-sm font-bold text-zinc-500 uppercase mb-1 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-apex-gold" /> App Toegang (Agent Portaal)
      </h3>
      <p className="text-xs text-zinc-600 mb-4">Stel de inloggegevens in waarmee deze medewerker kan inloggen in de agent-sectie.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Gebruikersnaam</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            placeholder={employee.email || 'gebruikersnaam'}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:border-apex-gold outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Wachtwoord</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Wachtwoord instellen"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 pr-9 text-white text-sm focus:border-apex-gold outline-none" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
      <button onClick={handleSave} disabled={!username || !password}
        className="mt-3 bg-apex-gold hover:bg-yellow-500 disabled:opacity-40 text-black font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
        <Save className="w-3.5 h-3.5" /> {saved ? 'Opgeslagen ✓' : 'Opslaan'}
      </button>
      {employee.portalUsername && (
        <p className="text-xs text-emerald-500 mt-2">✓ Toegang actief — inloggen als: <span className="font-mono font-bold">{employee.portalUsername}</span></p>
      )}
    </div>
  );
};

export const PersoneelDetailPage: React.FC = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { employees, updateEmployee, reviewSection } = useStore();
  
  const employee = employees.find(e => e.id === id);

  const [rejectReason, setRejectReason] = useState('');
  const [rejectSection, setRejectSection] = useState<'personal' | 'id' | 'badge' | null>(null);

  if (!employee) return <div className="p-8 text-white">Medewerker niet gevonden.</div>;

  const handleStatusToggle = () => {
     const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active';
     updateEmployee(employee.id, { status: newStatus });
  };

  const handleDownload = () => {
    const { blob, filename } = generatePersoneelDetailPdf(employee);
    downloadPdf(blob, filename);
  };

  const handlePrint = () => {
    const { blob } = generatePersoneelDetailPdf(employee);
    printPdfBlob(blob);
  };

  const handleReview = (section: 'personal' | 'id' | 'badge', status: OnboardingStatus, reason?: string) => {
      reviewSection('Admin', employee.id, section, status, reason);
      if (status === 'REJECTED') {
          setRejectSection(null);
          setRejectReason('');
      }
  };

  const ReviewControls = ({ section, status }: { section: 'personal' | 'id' | 'badge', status: OnboardingStatus }) => {
      if (status !== 'PENDING') return (
          <div className={clsx("text-xs font-bold uppercase px-2 py-1 rounded border inline-block mt-2", 
              status === 'APPROVED' ? "bg-green-900/20 text-green-500 border-green-900/50" : 
              status === 'REJECTED' ? "bg-red-900/20 text-red-500 border-red-900/50" : 
              "bg-zinc-800 text-zinc-500 border-zinc-700")}>
              {status === 'MISSING' ? 'Ontbrekend' : status === 'APPROVED' ? 'Goedgekeurd' : status === 'REJECTED' ? 'Afgekeurd' : 'Wacht op review'}
          </div>
      );

      if (rejectSection === section) {
          return (
              <div className="mt-3 bg-red-900/10 p-3 rounded border border-red-900/30">
                  <p className="text-xs text-red-400 font-bold mb-1">Reden van afkeuring:</p>
                  <input 
                      type="text" 
                      value={rejectReason} 
                      onChange={e => setRejectReason(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm mb-2"
                      placeholder="Typ reden..."
                  />
                  <div className="flex gap-2">
                      <button onClick={() => handleReview(section, 'REJECTED', rejectReason)} disabled={!rejectReason} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1 rounded">Bevestig</button>
                      <button onClick={() => setRejectSection(null)} className="bg-zinc-800 text-white text-xs font-bold px-3 py-1 rounded">Annuleer</button>
                  </div>
              </div>
          );
      }

      return (
          <div className="mt-3 flex gap-2">
              <button onClick={() => handleReview(section, 'APPROVED')} className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow-lg shadow-green-900/20">
                  <CheckCircle className="w-3 h-3" /> Goedkeuren
              </button>
              <button onClick={() => setRejectSection(section)} className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow-lg shadow-red-900/20">
                  <XCircle className="w-3 h-3" /> Afkeuren
              </button>
          </div>
      );
  };

  const daysToExpiry = employee.badgeExpiry ? Math.ceil((new Date(employee.badgeExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="pb-12 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-4">
        <BackButton />
        <div className="flex gap-2">
            <button onClick={handleDownload} className="bg-zinc-800 text-white px-4 py-2 rounded font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700">
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button onClick={handlePrint} className="bg-zinc-800 text-white px-4 py-2 rounded font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700">
              <Printer className="w-4 h-4" /> Afdrukken
            </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
           <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-apex-gold font-bold text-3xl border-2 border-zinc-700 shadow-xl overflow-hidden relative">
                 {employee.badgePhotoUrl ? <img src={employee.badgePhotoUrl} className="w-full h-full object-cover" /> : employee.name.charAt(0)}
              </div>
              <div>
                 <h1 className="text-3xl font-bold text-white tracking-tight">{employee.name}</h1>
                 <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 mt-2">
                    <span className="uppercase font-bold tracking-wider text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">{employee.role}</span>
                    <span className="font-mono text-zinc-500">{employee.id}</span>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button 
                 onClick={handleStatusToggle}
                 className={clsx(
                    "flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg border",
                    employee.status === 'Active' ? "bg-red-900/10 text-red-500 border-red-900/30" : "bg-green-900/10 text-green-500 border-green-900/30"
                 )}
              >
                 {employee.status === 'Active' ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                 {employee.status === 'Active' ? 'Deactiveren' : 'Activeren'}
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* SECTION 1: PERSONAL INFO */}
         <div className="lg:col-span-2 space-y-6">
            <div className={clsx("bg-zinc-900 border rounded-lg p-6", employee.personalInfoStatus === 'PENDING' ? "border-orange-500" : "border-zinc-800")}>
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <User className="w-5 h-5 text-apex-gold" /> Persoonsgegevens
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                  <div><span className="text-zinc-500 font-bold block uppercase text-[10px]">Voornaam</span>{employee.firstName || '-'}</div>
                  <div><span className="text-zinc-500 font-bold block uppercase text-[10px]">Achternaam</span>{employee.lastName || '-'}</div>
                  <div><span className="text-zinc-500 font-bold block uppercase text-[10px]">Adres</span>{employee.address || '-'}</div>
                  <div><span className="text-zinc-500 font-bold block uppercase text-[10px]">Geboortedatum</span>{employee.birthDate || '-'}</div>
                  <div><span className="text-zinc-500 font-bold block uppercase text-[10px]">Telefoon</span>{employee.phone || '-'}</div>
                  <div><span className="text-zinc-500 font-bold block uppercase text-[10px]">Email</span>{employee.email || '-'}</div>
                  <div><span className="text-zinc-500 font-bold block uppercase text-[10px]">Noodcontact</span>{employee.emergencyContact || '-'}</div>
               </div>
               <ReviewControls section="personal" status={employee.personalInfoStatus} />
            </div>

            <div className={clsx("bg-zinc-900 border rounded-lg p-6", employee.idCardStatus === 'PENDING' ? "border-orange-500" : "border-zinc-800")}>
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <FileText className="w-5 h-5 text-apex-gold" /> Identiteitskaart
               </h3>
               <div className="grid grid-cols-2 gap-4">
                   <div className="aspect-video bg-black rounded border border-zinc-800 flex items-center justify-center">
                       {employee.idCardRectoUrl ? <img src={employee.idCardRectoUrl} className="max-h-full max-w-full" /> : <span className="text-zinc-600 text-xs">Geen Recto</span>}
                   </div>
                   <div className="aspect-video bg-black rounded border border-zinc-800 flex items-center justify-center">
                       {employee.idCardVersoUrl ? <img src={employee.idCardVersoUrl} className="max-h-full max-w-full" /> : <span className="text-zinc-600 text-xs">Geen Verso</span>}
                   </div>
               </div>
               <ReviewControls section="id" status={employee.idCardStatus} />
            </div>
         </div>

         {/* SECTION 2: BADGE & AUDIT */}
         <div className="space-y-6">
            <div className={clsx("bg-zinc-900 border rounded-lg p-6", employee.badgeDataStatus === 'PENDING' ? "border-orange-500" : "border-zinc-800")}>
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-apex-gold" /> Badge Gegevens
               </h3>
               
               <div className="flex gap-4 mb-4">
                   <div className="w-20 h-24 bg-black rounded border border-zinc-800 flex items-center justify-center overflow-hidden">
                       {employee.badgePhotoUrl ? <img src={employee.badgePhotoUrl} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-zinc-600" />}
                   </div>
                   <div className="flex-1">
                       <div className="mb-2"><span className="text-xs text-zinc-500 font-bold block">Badge Nr</span><span className="font-mono text-white">{employee.badgeNr || '-'}</span></div>
                       <div><span className="text-xs text-zinc-500 font-bold block">Vervalt</span><span className="text-white">{employee.badgeExpiry || '-'}</span></div>
                   </div>
               </div>
               
               {daysToExpiry > 0 && daysToExpiry < 60 && (
                   <div className="text-xs text-orange-500 bg-orange-900/10 p-2 rounded border border-orange-900/20 mb-2 font-bold flex items-center gap-2">
                       <AlertTriangle className="w-4 h-4" /> Vervalt binnen {daysToExpiry} dagen!
                   </div>
               )}

               <ReviewControls section="badge" status={employee.badgeDataStatus} />
            </div>

            {/* ── App Toegang ── */}
            <PortalCredentials employee={employee} updateEmployee={updateEmployee} />

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Audit Log</h3>
                <div className="space-y-4 relative pl-2">
                    <div className="absolute left-[9px] top-2 bottom-2 w-[1px] bg-zinc-800" />
                    {employee.auditLog?.slice().reverse().map((log, i) => (
                        <div key={i} className="relative pl-6 text-xs">
                            <div className="absolute left-0 top-1 w-[19px] h-[19px] -ml-[0px] bg-zinc-900 border-2 border-zinc-700 rounded-full z-10 flex items-center justify-center">
                                <div className="w-1 h-1 bg-apex-gold rounded-full" />
                            </div>
                            <div className="text-zinc-300 font-bold uppercase tracking-wide">{log.action}</div>
                            <div className="text-zinc-500 mt-0.5">{new Date(log.date).toLocaleDateString()} door {log.user}</div>
                            {log.reason && <div className="text-zinc-400 italic mt-1 bg-zinc-950 p-2 rounded border border-zinc-800 break-words">"{log.reason}"</div>}
                        </div>
                    ))}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};