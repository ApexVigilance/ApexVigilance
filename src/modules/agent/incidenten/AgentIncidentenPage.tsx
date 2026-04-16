
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore, FullIncident, IncidentType, IncidentSeverity } from '../../../data/store';
import { useAuthStore } from '../../auth/store';
import { 
  AlertTriangle, Save, Send, MapPin, Camera, X, Shield, Lock, AlertOctagon, Edit, CheckCircle, Clock, Search 
} from 'lucide-react';
import clsx from 'clsx';
import { makeRef } from '../../../utils/pdf/ref';
import { compressImage } from '../../../utils/imageCompression';

export const AgentIncidentenPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('fr') ? 'fr-BE' : 'nl-BE';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { createIncident, updateIncident, incidents, shifts, clients, locations, employees } = useStore();
  const { user } = useAuthStore(); 

  const [activeTab, setActiveTab] = useState<'NEW' | 'MINE'>('NEW');

  // Form State
  const [incidentType, setIncidentType] = useState<IncidentType>('Incident');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FullIncident>>({
      title: '',
      description: '',
      severity: 'Medium',
      photos: []
  });
  
  // Context State
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search State
  const [clientSearch, setClientSearch] = useState('');
  const [shiftSearch, setShiftSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- IDENTITY LOGIC ---
  const currentUser = employees.find(e => e.name === user?.username); // Match based on username for now (since auth mock uses names)
  const authorId = currentUser?.id || user?.username || 'Unknown';
  const authorName = currentUser?.name || user?.username || 'Agent';

  // --- CONTEXT RESOLUTION LOGIC ---
  // Sync location.state to URL params to survive refresh
  useEffect(() => {
      if (location.state?.shiftId && !searchParams.get('shiftId')) {
          setSearchParams({ shiftId: location.state.shiftId });
      }
  }, [location.state, setSearchParams, searchParams]);

  const contextShift = useMemo(() => {
      const paramShiftId = searchParams.get('shiftId');
      if (paramShiftId) return shifts.find(s => s.id === paramShiftId);
      return null; 
  }, [shifts, searchParams]);

  // Apply Context Effect
  useEffect(() => {
      if (contextShift && !editingId) {
          setSelectedShiftId(contextShift.id);
          const client = clients.find(c => c.name === contextShift.clientName);
          if (client) setSelectedClientId(client.id);
          
          const loc = locations.find(l => l.clientId === client?.id && contextShift.location.includes(l.name));
          if (loc) setSelectedLocationId(loc.id);
      }
  }, [contextShift, clients, locations, editingId]);

  // --- DATA: MY INCIDENTS ---
  const myIncidents = useMemo(() => 
      incidents.filter(i => i.authorId === authorId || i.auditLog[0]?.user === authorName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [incidents, authorId, authorName]);

  // --- HANDLERS ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
         // Limit photo count (Policy A)
         if ((formData.photos?.length || 0) + e.target.files.length > 3) {
             alert(t('incidenten.photoLimit'));
             return;
         }

         const newPhotos: string[] = [];
         for (const file of Array.from(e.target.files) as File[]) {
             try {
                 const compressed = await compressImage(file, 1280, 0.7);
                 newPhotos.push(compressed);
             } catch (err) {
                 console.error("Compression failed", err);
                 alert(t('incidenten.agent.photoError'));
             }
         }
         setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), ...newPhotos] }));
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
      setFormData(prev => ({ ...prev, photos: prev.photos?.filter((_, i) => i !== idx) }));
  };

  const handleEdit = (incident: FullIncident) => {
      setEditingId(incident.id);
      setIncidentType(incident.type || 'Incident');
      setFormData({
          title: incident.title,
          description: incident.description,
          severity: incident.severity,
          photos: incident.photos || []
      });
      setSelectedShiftId(incident.shiftId || '');
      setSelectedClientId(incident.clientId || '');
      setSelectedLocationId(incident.locationId || '');
      setActiveTab('NEW');
  };

  const handleSubmit = (asDraft: boolean) => {
      if (!formData.title || !formData.description) {
          alert(t('incidenten.validation.required'));
          return;
      }
      
      setIsSubmitting(true);

      const payload: Partial<FullIncident> = {
          title: formData.title,
          type: incidentType,
          description: formData.description,
          severity: formData.severity as IncidentSeverity,
          date: new Date().toISOString(),
          status: asDraft ? 'Draft' : 'Submitted',
          
          // Context Linking
          shiftId: selectedShiftId || undefined,
          clientId: selectedClientId || undefined,
          locationId: selectedLocationId || undefined,
          
          // Evidence
          photos: formData.photos || [],
          
          authorId: authorId,
      };

      if (editingId) {
          // Update
          updateIncident(editingId, {
              ...payload,
              auditLog: [...(incidents.find(i => i.id === editingId)?.auditLog || []), { 
                  action: asDraft ? 'Draft Updated' : 'Resubmitted', 
                  user: authorName,
                  date: new Date().toISOString() 
              }]
          });
      } else {
          // Create with Safe ID (Policy 4)
          const newIncident: FullIncident = {
              id: makeRef('INC'),
              ...payload as any,
              comments: [],
              auditLog: [{ 
                  action: asDraft ? 'Draft Created' : 'Submitted', 
                  user: authorName, 
                  date: new Date().toISOString() 
              }],
              emailStatus: 'NONE'
          };
          createIncident(newIncident);
      }

      setTimeout(() => {
          setIsSubmitting(false);
          setActiveTab('MINE');
          // Reset
          setEditingId(null);
          setFormData({ title: '', description: '', severity: 'Medium', photos: [] });
      }, 500);
  };

  return (
    <div className="pb-24 animate-in fade-in duration-300">
      <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-apex-gold" /> {t('incidenten.newTitle')}
      </h1>

      {/* Tabs */}
      <div className="flex bg-zinc-900 p-1 rounded-xl mb-6 border border-zinc-800">
          <button 
             onClick={() => { setActiveTab('NEW'); setEditingId(null); setFormData({title:'', description:''}); }}
             className={clsx("flex-1 py-3 text-xs font-bold uppercase rounded-lg transition-all", activeTab === 'NEW' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300")}
          >
             {editingId ? t('common.edit') : t('incidenten.newTab')}
          </button>
          <button 
             onClick={() => setActiveTab('MINE')}
             className={clsx("flex-1 py-3 text-xs font-bold uppercase rounded-lg transition-all", activeTab === 'MINE' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300")}
          >
             {t('incidenten.mineTab')}
          </button>
      </div>

      {/* --- FORM VIEW --- */}
      {activeTab === 'NEW' && (
      <div className="space-y-6">
          
          {/* 1. Context Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> {t('reports.fields.location')}</h3>
                  {contextShift && !editingId && <Lock className="w-3 h-3 text-zinc-500" />}
              </div>
              
              {(contextShift && !editingId) ? (
                  <div className="flex items-center gap-3 bg-blue-900/20 p-3 rounded border border-blue-900/50">
                      <Shield className="w-8 h-8 text-blue-400 shrink-0 p-1.5 bg-blue-900/40 rounded-lg" />
                      <div>
                          <div className="text-xs text-blue-300 font-bold uppercase">{t('incidenten.agent.linkedShift')}</div>
                          <div className="text-white font-bold">{contextShift.clientName}</div>
                          <div className="text-xs text-zinc-400">{contextShift.location}</div>
                      </div>
                  </div>
              ) : (
                  <div className="space-y-3">
                      <div>
                          <div className="relative mb-2">
                              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                              <input 
                                  type="text" 
                                  placeholder={t('common.search')} 
                                  value={clientSearch} 
                                  onChange={(e) => setClientSearch(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-xs text-white focus:border-apex-gold outline-none"
                              />
                          </div>
                          <select 
                              value={selectedClientId}
                              onChange={e => setSelectedClientId(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white text-sm outline-none focus:border-apex-gold"
                          >
                              <option value="">{t('incidenten.agent.selectClient')}</option>
                              {clients
                                .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                                .map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                          </select>
                      </div>
                      
                      {selectedClientId && (
                          <select 
                              value={selectedLocationId}
                              onChange={e => setSelectedLocationId(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white text-sm outline-none focus:border-apex-gold"
                          >
                              <option value="">{t('incidenten.agent.selectLocation')}</option>
                              {locations.filter(l => l.clientId === selectedClientId).map(l => (
                                  <option key={l.id} value={l.id}>{l.name} - {l.city}</option>
                              ))}
                          </select>
                      )}
                  </div>
              )}
          </div>

          {/* Shift Selection (Optional) */}
          {(!contextShift || editingId) && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-blue-500" /> Shift (Optioneel)
                  </h3>
                  <div className="relative mb-2">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <input 
                          type="text" 
                          placeholder="Zoek shift..." 
                          value={shiftSearch} 
                          onChange={(e) => setShiftSearch(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-xs text-white focus:border-apex-gold outline-none"
                      />
                  </div>
                  <select 
                      value={selectedShiftId}
                      onChange={e => setSelectedShiftId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white text-sm outline-none focus:border-apex-gold"
                  >
                      <option value="">{t('incidenten.agent.selectShift')}</option>
                      {shifts.filter(s => {
                          const matchClient = !selectedClientId || clients.find(c => c.id === selectedClientId)?.name === s.clientName;
                          const matchSearch = !shiftSearch || s.clientName.toLowerCase().includes(shiftSearch.toLowerCase()) || s.location.toLowerCase().includes(shiftSearch.toLowerCase());
                          return matchClient && matchSearch;
                      }).slice(0, 20).map(s => (
                          <option key={s.id} value={s.id}>{new Date(s.startTime).toLocaleDateString()} - {s.clientName}</option>
                      ))}
                  </select>
              </div>
          )}

          {/* 2. Type & Severity */}
          <div className="grid grid-cols-2 gap-4">
              <div 
                  onClick={() => setIncidentType('Incident')}
                  className={clsx("p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2", 
                      incidentType === 'Incident' ? "border-red-500 bg-red-900/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  )}
              >
                  <AlertTriangle className={clsx("w-6 h-6", incidentType === 'Incident' ? "text-red-500" : "text-zinc-500")} />
                  <span className={clsx("font-bold text-sm", incidentType === 'Incident' ? "text-white" : "text-zinc-400")}>{t('incidenten.types.incident')}</span>
              </div>
              <div 
                  onClick={() => setIncidentType('Complaint')}
                  className={clsx("p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2", 
                      incidentType === 'Complaint' ? "border-orange-500 bg-orange-900/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  )}
              >
                  <AlertOctagon className={clsx("w-6 h-6", incidentType === 'Complaint' ? "text-orange-500" : "text-zinc-500")} />
                  <span className={clsx("font-bold text-sm", incidentType === 'Complaint' ? "text-white" : "text-zinc-400")}>{t('incidenten.types.complaint')}</span>
              </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block">{t('incidenten.fields.severity')}</label>
              <div className="flex gap-2">
                  {['Low', 'Medium', 'High', 'Critical'].map(lev => (
                      <button 
                          key={lev}
                          onClick={() => setFormData({...formData, severity: lev as any})}
                          className={clsx(
                              "flex-1 py-2 rounded text-xs font-bold border transition-all",
                              formData.severity === lev 
                                  ? (lev === 'Critical' ? "bg-purple-600 text-white border-purple-600" : lev === 'High' ? "bg-red-600 text-white border-red-600" : lev === 'Medium' ? "bg-orange-600 text-white border-orange-600" : "bg-blue-600 text-white border-blue-600")
                                  : "bg-zinc-950 text-zinc-400 border-zinc-800"
                          )}
                      >
                          {t(`incidenten.severity.${lev}`)}
                      </button>
                  ))}
              </div>
          </div>

          {/* 3. Details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
              <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">{t('incidenten.fields.title')} *</label>
                  <input 
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder={t('incidenten.agent.titlePlaceholder')}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white outline-none focus:border-apex-gold"
                  />
              </div>
              <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">{t('incidenten.fields.description')} *</label>
                  <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder={t('incidenten.agent.descPlaceholder')}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white outline-none focus:border-apex-gold min-h-[120px]"
                  />
              </div>
          </div>

          {/* 4. Photos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-zinc-500 uppercase font-bold">{t('incidenten.fields.photos')}</label>
                  <span className="text-xs text-zinc-600">{t('incidenten.agent.maxPhotos')}</span>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                  {(formData.photos?.length || 0) < 3 && (
                      <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-20 h-20 flex flex-col items-center justify-center bg-zinc-950 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors shrink-0"
                      >
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-[10px] uppercase font-bold">{t('incidenten.agent.addPhoto')}</span>
                      </button>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple className="hidden" />
                  
                  {formData.photos?.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-zinc-800 group">
                          <img src={src} className="w-full h-full object-cover" />
                          <button 
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <X className="w-3 h-3" />
                          </button>
                      </div>
                  ))}
              </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
              <button 
                  onClick={() => handleSubmit(true)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                  <Save className="w-5 h-5" /> {t('reports.actions.saveDraft')}
              </button>
              <button 
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-apex-gold hover:bg-yellow-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-apex-gold/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {isSubmitting ? "..." : <><Send className="w-5 h-5" /> {t('reports.actions.submit')}</>}
              </button>
          </div>
      </div>
      )}

      {/* --- MINE VIEW --- */}
      {activeTab === 'MINE' && (
          <div className="space-y-4">
              {myIncidents.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500 italic border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                      {t('incidenten.agent.emptyMine')}
                  </div>
              ) : (
                  myIncidents.map(inc => (
                      <div key={inc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden group">
                          <div className={clsx(
                              "absolute left-0 top-0 bottom-0 w-1",
                              inc.status === 'Draft' ? "bg-zinc-600" :
                              inc.status === 'Submitted' ? "bg-blue-500" :
                              inc.status === 'Approved' ? "bg-green-500" : "bg-red-500"
                          )} />

                          <div className="pl-3">
                              <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                      {inc.type === 'Complaint' ? <AlertOctagon className="w-4 h-4 text-orange-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                                      <span className="font-bold text-white text-lg">{inc.title}</span>
                                  </div>
                                  <span className={clsx("text-[10px] font-bold uppercase px-2 py-1 rounded", 
                                      inc.status === 'Draft' ? "bg-zinc-800 text-zinc-400" :
                                      inc.status === 'Submitted' ? "bg-blue-900/20 text-blue-400" :
                                      inc.status === 'Approved' ? "bg-green-900/20 text-green-400" :
                                      "bg-red-900/20 text-red-400"
                                  )}>
                                      {t(`incidenten.status.${inc.status}`)}
                                  </span>
                              </div>

                              <div className="text-xs text-zinc-500 flex gap-3 mb-3">
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(inc.date).toLocaleDateString(locale)}</span>
                                  <span className={clsx("font-bold", 
                                      inc.severity === 'High' || inc.severity === 'Critical' ? "text-red-400" : "text-zinc-400"
                                  )}>{t(`incidenten.severity.${inc.severity}`)}</span>
                              </div>

                              <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                                  {inc.description}
                              </p>

                              {inc.status === 'Rejected' && inc.rejectedReason && (
                                  <div className="bg-red-900/10 border border-red-900/30 p-2 rounded mb-3 text-xs text-red-300">
                                      <strong>Reden:</strong> "{inc.rejectedReason}"
                                  </div>
                              )}

                              {(inc.status === 'Draft' || inc.status === 'Rejected') && (
                                  <div className="flex justify-end">
                                      <button 
                                          onClick={() => handleEdit(inc)}
                                          className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-2"
                                      >
                                          <Edit className="w-3 h-3" /> {t('common.edit')}
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))
              )}
          </div>
      )}
    </div>
  );
};
