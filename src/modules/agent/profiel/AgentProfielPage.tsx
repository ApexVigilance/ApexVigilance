import React, { useState, useRef, useMemo } from 'react';
import { UserCircle, Shield, Camera, Upload, Save, AlertTriangle, CheckCircle2, Calendar, FileText, Send, Clock, XCircle, Lock } from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import { useStore, Employee } from '../../../data/store';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';



export const AgentProfielPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const CURRENT_AGENT_ID = user?.employeeId ?? '';
  const { employees, updateEmployee, updateBadge } = useStore();
  
  const currentAgent = employees.find(e => e.id === CURRENT_AGENT_ID);
  
  // Local States
  const [personalData, setPersonalData] = useState({
      firstName: currentAgent?.firstName || currentAgent?.name?.split(' ')[0] || '',
      lastName: currentAgent?.lastName || currentAgent?.name?.split(' ').slice(1).join(' ') || '',
      birthDate: currentAgent?.birthDate || '',
      address: currentAgent?.address || '',
      phone: currentAgent?.phone || '',
      email: currentAgent?.email || '',
      emergencyContact: currentAgent?.emergencyContact || ''
  });

  const [idCardData, setIdCardData] = useState({
      recto: currentAgent?.idCardRectoUrl || '',
      verso: currentAgent?.idCardVersoUrl || ''
  });

  const [badgeData, setBadgeData] = useState({
      nr: currentAgent?.badgeNr || '',
      expiry: currentAgent?.badgeExpiry || '',
      photo: currentAgent?.badgePhotoUrl || ''
  });

  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingId, setIsSavingId] = useState(false);
  const [isSavingBadge, setIsSavingBadge] = useState(false);

  const fileInputRefRecto = useRef<HTMLInputElement>(null);
  const fileInputRefVerso = useRef<HTMLInputElement>(null);
  const fileInputRefBadge = useRef<HTMLInputElement>(null);

  // Status Computations
  const personalStatus = currentAgent?.personalInfoStatus || 'MISSING';
  const idStatus = currentAgent?.idCardStatus || 'MISSING';
  const badgeDataStatus = currentAgent?.badgeDataStatus || 'MISSING';

  const isPersonalLocked = personalStatus === 'APPROVED' || personalStatus === 'PENDING';
  const isIdLocked = idStatus === 'APPROVED' || idStatus === 'PENDING';
  
  // Badge expiry computation
  const badgeExpiryStatus = useMemo(() => {
      if (!badgeData.expiry) return 'UNKNOWN';
      const now = new Date();
      const exp = new Date(badgeData.expiry);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'EXPIRED';
      if (diffDays < 15) return 'CRITICAL';
      if (diffDays < 60) return 'WARNING';
      return 'VALID';
  }, [badgeData.expiry]);

  // Actions - REMOVED setTimeout for production stability
  const handlePersonalSubmit = () => {
      if (isSavingPersonal) return; // Dubbelklik guard
      if (!personalData.firstName || !personalData.lastName || !personalData.address || !personalData.phone) {
          alert('Vul alle verplichte velden in.');
          return;
      }
      setIsSavingPersonal(true);
      updateEmployee(CURRENT_AGENT_ID, {
          ...personalData,
          name: `${personalData.firstName} ${personalData.lastName}`, 
          personalInfoStatus: 'PENDING'
      });
      setIsSavingPersonal(false);
  };

  const handleIdSubmit = () => {
      if (isSavingId) return; // Dubbelklik guard
      if (!idCardData.recto || !idCardData.verso) {
          alert('Upload zowel voor- als achterkant.');
          return;
      }
      setIsSavingId(true);
      updateEmployee(CURRENT_AGENT_ID, {
          idCardRectoUrl: idCardData.recto,
          idCardVersoUrl: idCardData.verso,
          idCardStatus: 'PENDING'
      });
      setIsSavingId(false);
  };

  const handleBadgeSubmit = () => {
      if (isSavingBadge) return; // Dubbelklik guard
      if (!badgeData.nr || !badgeData.expiry) {
          alert('Badge gegevens zijn onvolledig.');
          return;
      }
      setIsSavingBadge(true);
      updateBadge(CURRENT_AGENT_ID, {
          badgeNr: badgeData.nr,
          badgeExpiry: badgeData.expiry,
          badgePhotoUrl: badgeData.photo
      }, currentAgent?.name || 'Agent');
      setIsSavingBadge(false);
  };

  // Generic File Handler
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
      if (e.target.files?.[0]) {
          const reader = new FileReader();
          reader.onload = () => setter(reader.result as string);
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  // Status Chip Component
  const StatusChip = ({ status, reason }: { status: string, reason?: string }) => (
      <div className="flex flex-col items-end">
          <div className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1",
              status === 'APPROVED' ? "bg-green-900/20 text-green-500 border-green-900/50" :
              status === 'PENDING' ? "bg-yellow-900/20 text-yellow-500 border-yellow-900/50" :
              status === 'REJECTED' ? "bg-red-900/20 text-red-500 border-red-900/50" :
              "bg-zinc-800 text-zinc-500 border-zinc-700"
          )}>
              {status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
              {status === 'PENDING' && <Clock className="w-3 h-3" />}
              {status === 'REJECTED' && <XCircle className="w-3 h-3" />}
              {status === 'MISSING' ? 'ONTBREKEND' : status === 'PENDING' ? 'IN AFWACHTING' : status === 'APPROVED' ? 'GOEDGEKEURD' : 'AFGEKEURD'}
          </div>
          {status === 'REJECTED' && reason && (
              <span className="text-[10px] text-red-400 mt-1 max-w-[200px] text-right">Reden: {reason}</span>
          )}
      </div>
  );

  return (
    <div className="animate-in fade-in duration-500 pb-24">
      {/* 1. Header (Compact) */}
      <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-yellow-500 font-bold text-lg border-2 border-zinc-700">
             {currentAgent?.name?.charAt(0) || 'A'}
          </div>
          <div>
             <h1 className="text-lg font-black text-white uppercase tracking-tight">{currentAgent?.name || 'Agent'}</h1>
             <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold bg-zinc-900 px-2 py-0.5 rounded">{currentAgent?.role || 'Agent'}</span>
          </div>
      </div>

      {/* 2. Action Needed Card */}
      {(personalStatus !== 'APPROVED' || idStatus !== 'APPROVED' || badgeExpiryStatus !== 'VALID' || badgeDataStatus !== 'APPROVED') && (
          <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-900/30 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                  <h3 className="text-sm font-bold text-white mb-1">Actie vereist</h3>
                  <ul className="text-xs text-zinc-400 space-y-1">
                      {personalStatus === 'MISSING' && <li>• Persoonsgegevens invullen</li>}
                      {personalStatus === 'REJECTED' && <li>• Persoonsgegevens corrigeren (afgekeurd)</li>}
                      {idStatus === 'MISSING' && <li>• Identiteitskaart uploaden</li>}
                      {idStatus === 'REJECTED' && <li>• Identiteitskaart opnieuw uploaden</li>}
                      {(badgeDataStatus === 'MISSING' || badgeDataStatus === 'REJECTED') && <li>• Badge gegevens invullen/corrigeren</li>}
                      {(badgeExpiryStatus === 'CRITICAL' || badgeExpiryStatus === 'EXPIRED') && <li className="text-red-400 font-bold">• Badge verloopt binnenkort of is verlopen!</li>}
                  </ul>
              </div>
          </div>
      )}

      {/* 3. Cards Grid */}
      <div className="space-y-6">
          
          {/* CARD A: Persoonsgegevens */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-apex-gold" /> Persoonsgegevens
                  </h3>
                  <StatusChip status={personalStatus} reason={currentAgent?.personalInfoReason} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Voornaam *</label>
                      <input 
                          type="text" 
                          value={personalData.firstName} 
                          onChange={e => setPersonalData({...personalData, firstName: e.target.value})}
                          disabled={isPersonalLocked}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white disabled:opacity-50"
                      />
                  </div>
                  <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Achternaam *</label>
                      <input 
                          type="text" 
                          value={personalData.lastName} 
                          onChange={e => setPersonalData({...personalData, lastName: e.target.value})}
                          disabled={isPersonalLocked}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white disabled:opacity-50"
                      />
                  </div>
                  <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Geboortedatum *</label>
                      <input 
                          type="date" 
                          value={personalData.birthDate} 
                          onChange={e => setPersonalData({...personalData, birthDate: e.target.value})}
                          disabled={isPersonalLocked}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white disabled:opacity-50"
                      />
                  </div>
                  <div className="md:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Adres (Straat, Nr, Bus, Postcode, Stad) *</label>
                      <input 
                          type="text" 
                          value={personalData.address} 
                          onChange={e => setPersonalData({...personalData, address: e.target.value})}
                          disabled={isPersonalLocked}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white disabled:opacity-50"
                      />
                  </div>
                  
                  {/* Always Editable Fields */}
                  <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1 flex justify-between">
                          <span>Telefoon *</span>
                          {isPersonalLocked && <span className="text-[9px] text-green-500">Aanpasbaar</span>}
                      </label>
                      <input 
                          type="text" 
                          value={personalData.phone} 
                          onChange={e => setPersonalData({...personalData, phone: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-apex-gold outline-none"
                      />
                  </div>
                  <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1 flex justify-between">
                          <span>E-mail *</span>
                          {isPersonalLocked && <span className="text-[9px] text-green-500">Aanpasbaar</span>}
                      </label>
                      <input 
                          type="email" 
                          value={personalData.email} 
                          onChange={e => setPersonalData({...personalData, email: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-apex-gold outline-none"
                      />
                  </div>
                  <div className="md:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1 flex justify-between">
                          <span>Noodcontact (Naam + Tel) *</span>
                          {isPersonalLocked && <span className="text-[9px] text-green-500">Aanpasbaar</span>}
                      </label>
                      <input 
                          type="text" 
                          value={personalData.emergencyContact} 
                          onChange={e => setPersonalData({...personalData, emergencyContact: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-apex-gold outline-none"
                      />
                  </div>
              </div>

              {!isPersonalLocked ? (
                  <button 
                      onClick={handlePersonalSubmit}
                      disabled={isSavingPersonal}
                      className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded text-sm transition-colors"
                  >
                      {isSavingPersonal ? "Bezig..." : "Opslaan & Indienen"}
                  </button>
              ) : (
                  <div className="mt-4 text-center text-xs text-zinc-500 italic border-t border-zinc-800 pt-2">
                      Persoonsgegevens vergrendeld. Contactgegevens blijven wijzigbaar.
                  </div>
              )}
          </div>

          {/* CARD B: Identiteit */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-apex-gold" /> Identiteitskaart
                  </h3>
                  <StatusChip status={idStatus} reason={currentAgent?.idCardReason} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  {/* Recto */}
                  <div 
                      onClick={() => !isIdLocked && fileInputRefRecto.current?.click()}
                      className={clsx(
                          "aspect-video rounded border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-colors",
                          idCardData.recto ? "border-green-500/30 bg-black" : "border-zinc-700 bg-zinc-950",
                          !isIdLocked && "cursor-pointer hover:border-zinc-500"
                      )}
                  >
                      {idCardData.recto ? (
                          <img src={idCardData.recto} className="w-full h-full object-contain" />
                      ) : (
                          <div className="text-center p-2">
                              <Upload className="w-6 h-6 mx-auto mb-1 text-zinc-500" />
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">Recto</span>
                          </div>
                      )}
                      {!isIdLocked && <input type="file" ref={fileInputRefRecto} className="hidden" accept="image/*" onChange={(e) => handleFile(e, (url) => setIdCardData(p => ({...p, recto: url})))} />}
                  </div>

                  {/* Verso */}
                  <div 
                      onClick={() => !isIdLocked && fileInputRefVerso.current?.click()}
                      className={clsx(
                          "aspect-video rounded border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-colors",
                          idCardData.verso ? "border-green-500/30 bg-black" : "border-zinc-700 bg-zinc-950",
                          !isIdLocked && "cursor-pointer hover:border-zinc-500"
                      )}
                  >
                      {idCardData.verso ? (
                          <img src={idCardData.verso} className="w-full h-full object-contain" />
                      ) : (
                          <div className="text-center p-2">
                              <Upload className="w-6 h-6 mx-auto mb-1 text-zinc-500" />
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">Verso</span>
                          </div>
                      )}
                      {!isIdLocked && <input type="file" ref={fileInputRefVerso} className="hidden" accept="image/*" onChange={(e) => handleFile(e, (url) => setIdCardData(p => ({...p, verso: url})))} />}
                  </div>
              </div>

              {!isIdLocked && (
                  <button 
                      onClick={handleIdSubmit}
                      disabled={isSavingId}
                      className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded text-sm transition-colors"
                  >
                      {isSavingId ? "Bezig..." : "Indienen ter goedkeuring"}
                  </button>
              )}
          </div>

          {/* CARD C: Badge */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-apex-gold" /> Badge Identificatie
                  </h3>
                  <div className="flex flex-col items-end gap-1">
                      <StatusChip status={badgeDataStatus} reason={currentAgent?.badgeReason} />
                      {/* Expiry Chip */}
                      <span className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded border",
                          badgeExpiryStatus === 'VALID' ? "bg-green-900/20 text-green-500 border-green-900/50" :
                          badgeExpiryStatus === 'WARNING' ? "bg-orange-900/20 text-orange-500 border-orange-900/50" :
                          badgeExpiryStatus === 'CRITICAL' ? "bg-red-900/20 text-red-500 border-red-900/50 animate-pulse" :
                          "bg-red-900 text-white border-red-900"
                      )}>
                          {badgeExpiryStatus === 'VALID' ? 'GELDIG' : badgeExpiryStatus === 'WARNING' ? 'BINNENKORT' : badgeExpiryStatus === 'CRITICAL' ? 'DRINGEND' : 'VERLOPEN'}
                      </span>
                  </div>
              </div>

              <div className="flex gap-4">
                  {/* Photo */}
                  <div className="w-24 shrink-0">
                      <div 
                          onClick={() => fileInputRefBadge.current?.click()}
                          className="aspect-[3/4] bg-black border border-zinc-700 rounded-lg overflow-hidden relative cursor-pointer group"
                      >
                          {badgeData.photo ? (
                              <img src={badgeData.photo} className="w-full h-full object-cover" />
                          ) : (
                              <div className="flex items-center justify-center h-full text-zinc-600">
                                  <Camera className="w-6 h-6" />
                              </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Camera className="w-5 h-5 text-white" />
                          </div>
                      </div>
                      <input type="file" ref={fileInputRefBadge} className="hidden" accept="image/*" onChange={(e) => handleFile(e, (url) => setBadgeData(p => ({...p, photo: url})))} />
                  </div>

                  {/* Form */}
                  <div className="flex-1 space-y-3">
                      <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Badge Nummer *</label>
                          <input 
                              type="text" 
                              value={badgeData.nr} 
                              onChange={e => setBadgeData({...badgeData, nr: e.target.value})}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-apex-gold outline-none font-mono"
                          />
                      </div>
                      <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Vervaldatum *</label>
                          <input 
                              type="date" 
                              value={badgeData.expiry} 
                              onChange={e => setBadgeData({...badgeData, expiry: e.target.value})}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:border-apex-gold outline-none"
                          />
                      </div>
                  </div>
              </div>

              <div className="mt-4">
                  <button 
                      onClick={handleBadgeSubmit}
                      disabled={isSavingBadge}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                  >
                      {isSavingBadge ? "Bezig..." : <><Save className="w-4 h-4" /> Opslaan (Vereist goedkeuring)</>}
                  </button>
                  <p className="text-[10px] text-zinc-500 text-center mt-2 italic">
                      Wijzigingen worden gecontroleerd door HR alvorens actief te worden.
                  </p>
              </div>
          </div>

      </div>
    </div>
  );
};