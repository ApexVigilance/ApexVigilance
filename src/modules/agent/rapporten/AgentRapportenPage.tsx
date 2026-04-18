
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../auth/store';
import { useStore, FullReport, ReportType, ReportCategory, IncidentSeverity } from '../../../data/store';
import { 
  FileText, Plus, Search, ChevronRight, MapPin, Camera, AlertTriangle, 
  CheckCircle2, Clock, X, Upload, Save, Send, Filter, AlertOctagon, Lock, Shield, Edit 
} from 'lucide-react';
import { generateReportPdf } from '../../../services/reporting';
import clsx from 'clsx';



export const AgentRapportenPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const CURRENT_AGENT_ID = user?.employeeId ?? '';
  const navigate = useNavigate();
  const location = useLocation();
  const { reports, createReport, updateReport, shifts, clients, locations, employees } = useStore();
  
  // Tabs: NEW | MINE | TEMPLATES
  const [activeTab, setActiveTab] = useState<'NEW' | 'MINE'>('NEW');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'SUBMITTED'>('ALL');

  // New Report State
  const [reportType, setReportType] = useState<ReportType>('Daily');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<FullReport>>({
      title: '',
      summary: '',
      details: '',
      category: 'Overig',
      severity: 'Low',
      actionsTaken: [],
      involvedParties: '',
      vehicleInfo: '',
      supervisorFollowUp: false,
      images: []
  });
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get Current Agent Name for fallback
  const currentAgent = employees.find(e => e.id === CURRENT_AGENT_ID);
  const agentName = currentAgent?.name || 'Huidige Gebruiker';

  // --- CONTEXT RESOLUTION LOGIC ---
  
  const contextShift = useMemo(() => {
      // 1. Check Navigation State
      const stateShiftId = location.state?.shiftId;
      if (stateShiftId) {
          return shifts.find(s => s.id === stateShiftId);
      }

      // 2. Check Active Shift (IN_DIENST)
      const active = shifts.find(s => s.employeeId === CURRENT_AGENT_ID && s.status === 'Active');
      if (active) return active;

      // 3. Check Upcoming/Recent Shift (within 24h)
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const past12h = new Date(now.getTime() - 12 * 60 * 60 * 1000); // Allow reporting for recently finished shifts

      // Filter relevant shifts
      const candidates = shifts.filter(s => 
          s.employeeId === CURRENT_AGENT_ID && 
          (s.status === 'Scheduled' || s.status === 'Completed') &&
          new Date(s.startTime) < next24h &&
          new Date(s.endTime) > past12h
      );

      // Sort by closeness to NOW
      return candidates.sort((a, b) => {
          const diffA = Math.abs(new Date(a.startTime).getTime() - now.getTime());
          const diffB = Math.abs(new Date(b.startTime).getTime() - now.getTime());
          return diffA - diffB;
      })[0];
  }, [shifts, location.state]);

  // Apply Context Effect (Only if NOT editing an existing report)
  useEffect(() => {
      if (contextShift && !editingReportId) {
          setSelectedShiftId(contextShift.id);
          // Find client
          const client = clients.find(c => c.name === contextShift.clientName);
          if (client) setSelectedClientId(client.id);
          
          // Try to match location name if possible, else leave empty but context is set via shiftId
          const loc = locations.find(l => l.clientId === client?.id && contextShift.location.includes(l.name));
          if (loc) setSelectedLocationId(loc.id);
      }
  }, [contextShift, clients, locations, editingReportId]);

  // Filter My Reports by ID
  const myReports = useMemo(() => 
      reports.filter(r => r.authorId === CURRENT_AGENT_ID || r.author === agentName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [reports, agentName]);

  const filteredReports = myReports.filter(r => {
      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'DRAFT') return r.status === 'Draft' || r.status === 'Rejected';
      if (filterStatus === 'SUBMITTED') return r.status === 'Submitted' || r.status === 'Approved';
      return true;
  });

  // --- ACTIONS ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
         Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
               if (reader.result) {
                  setFormData(prev => ({ ...prev, images: [...(prev.images || []), reader.result as string] }));
               }
            };
            reader.readAsDataURL(file as Blob);
         });
      }
  };

  const removeImage = (idx: number) => {
      setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }));
  };

  const toggleAction = (action: string) => {
      setFormData(prev => {
          const current = prev.actionsTaken || [];
          if (current.includes(action)) return { ...prev, actionsTaken: current.filter(a => a !== action) };
          return { ...prev, actionsTaken: [...current, action] };
      });
  };

  const handleSubmit = (asDraft: boolean) => {
      if (!formData.summary && !asDraft) {
          alert("Samenvatting is verplicht.");
          return;
      }
      if (reportType === 'Incident' && formData.severity === 'High' && (!formData.images || formData.images.length === 0) && !asDraft) {
          alert("Bij Hoge ernst is minstens 1 foto verplicht.");
          return;
      }

      setIsSubmitting(true);
      
      const payload: Partial<FullReport> = {
          type: reportType,
          author: agentName,
          authorId: CURRENT_AGENT_ID,
          date: new Date().toISOString().split('T')[0],
          title: formData.title || `${reportType === 'Daily' ? 'Dagrapport' : 'Incident'} - ${new Date().toLocaleDateString()}`,
          summary: formData.summary,
          details: formData.details,
          shiftId: selectedShiftId || undefined,
          locationId: selectedLocationId || undefined,
          status: asDraft ? 'Draft' : 'Submitted',
          images: formData.images || [],
          category: formData.category as ReportCategory,
          severity: formData.severity as IncidentSeverity,
          actionsTaken: formData.actionsTaken,
          involvedParties: formData.involvedParties,
          vehicleInfo: formData.vehicleInfo,
          supervisorFollowUp: formData.supervisorFollowUp,
          activities: formData.activities,
          gpsLat: 0, 
          gpsLng: 0,
      };

      if (editingReportId) {
          // Update existing
          updateReport(editingReportId, {
              ...payload,
              auditLog: [...(reports.find(r => r.id === editingReportId)?.auditLog || []), { action: asDraft ? 'Draft Updated' : 'Resubmitted', user: agentName, date: new Date().toISOString() }]
          });
      } else {
          // Create new
          const newReport: FullReport = {
              id: `R-AG-${Date.now()}`,
              ...payload as any,
              emailStatus: 'NONE',
              auditLog: [{ action: asDraft ? 'Created Draft' : 'Submitted', user: agentName, date: new Date().toISOString() }]
          };
          createReport(newReport);
      }
      
      setTimeout(() => {
          setIsSubmitting(false);
          setActiveTab('MINE');
          setEditingReportId(null);
          // Reset Form
          setFormData({
              title: '', summary: '', details: '', category: 'Overig', severity: 'Low',
              actionsTaken: [], involvedParties: '', vehicleInfo: '', supervisorFollowUp: false, images: []
          });
          setSelectedShiftId('');
          setSelectedLocationId('');
      }, 500);
  };

  const handleEdit = (report: FullReport) => {
      setEditingReportId(report.id);
      setReportType(report.type);
      setFormData({
          title: report.title,
          summary: report.summary,
          details: report.details,
          category: report.category,
          severity: report.severity,
          actionsTaken: report.actionsTaken,
          involvedParties: report.involvedParties,
          vehicleInfo: report.vehicleInfo,
          supervisorFollowUp: report.supervisorFollowUp,
          images: report.images || []
      });
      setSelectedShiftId(report.shiftId || '');
      setSelectedLocationId(report.locationId || '');
      // If we have a client linked to shift/location, select it
      if (report.shiftId) {
          const shift = shifts.find(s => s.id === report.shiftId);
          const client = clients.find(c => c.name === shift?.clientName);
          if (client) setSelectedClientId(client.id);
      }
      setActiveTab('NEW');
  };

  const handleDownloadPdf = (report: FullReport) => {
      const client = clients.find(c => {
          const shift = shifts.find(s => s.id === report.shiftId);
          return c.name === shift?.clientName; // loose match
      });
      const blob = generateReportPdf(report, client);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rapport_${report.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- RENDER HELPERS ---

  return (
    <div className="pb-24 animate-in fade-in duration-300">
      <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
        <FileText className="w-6 h-6 text-apex-gold" /> {t('reports.title')}
      </h1>

      {/* TABS */}
      <div className="flex bg-zinc-900 p-1 rounded-xl mb-6 border border-zinc-800">
          <button 
             onClick={() => { setActiveTab('NEW'); setEditingReportId(null); setFormData({title:'', summary:''}); }}
             className={clsx("flex-1 py-3 text-xs font-bold uppercase rounded-lg transition-all", activeTab === 'NEW' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300")}
          >
             {editingReportId ? 'Bewerken' : t('reports.new')}
          </button>
          <button 
             onClick={() => setActiveTab('MINE')}
             className={clsx("flex-1 py-3 text-xs font-bold uppercase rounded-lg transition-all", activeTab === 'MINE' ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300")}
          >
             {t('reports.mine')}
          </button>
      </div>

      {/* --- NEW/EDIT REPORT FORM --- */}
      {activeTab === 'NEW' && (
          <div className="space-y-6">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                  <div 
                      onClick={() => setReportType('Daily')}
                      className={clsx("p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2", 
                          reportType === 'Daily' ? "border-apex-gold bg-apex-gold/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      )}
                  >
                      <Clock className={clsx("w-8 h-8", reportType === 'Daily' ? "text-apex-gold" : "text-zinc-500")} />
                      <span className={clsx("font-bold text-sm", reportType === 'Daily' ? "text-white" : "text-zinc-400")}>{t('reports.types.Daily')}</span>
                  </div>
                  <div 
                      onClick={() => setReportType('Incident')}
                      className={clsx("p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2", 
                          reportType === 'Incident' ? "border-red-500 bg-red-900/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      )}
                  >
                      <AlertTriangle className={clsx("w-8 h-8", reportType === 'Incident' ? "text-red-500" : "text-zinc-500")} />
                      <span className={clsx("font-bold text-sm", reportType === 'Incident' ? "text-white" : "text-zinc-400")}>{t('reports.types.Incident')}</span>
                  </div>
              </div>

              {/* Context (Location/Shift) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> Context</h3>
                      {contextShift && !editingReportId && <Lock className="w-3 h-3 text-zinc-500" />}
                  </div>
                  
                  {(contextShift && !editingReportId) ? (
                      <div className="flex items-center gap-3 bg-blue-900/20 p-3 rounded border border-blue-900/50">
                          <Shield className="w-8 h-8 text-blue-400 shrink-0 p-1.5 bg-blue-900/40 rounded-lg" />
                          <div>
                              <div className="text-xs text-blue-300 font-bold uppercase">Gekoppeld aan Shift</div>
                              <div className="text-white font-bold">{contextShift.clientName}</div>
                              <div className="text-xs text-zinc-400">{contextShift.location}</div>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          <select 
                              value={selectedClientId}
                              onChange={e => setSelectedClientId(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white text-sm outline-none focus:border-apex-gold"
                          >
                              <option value="">Selecteer Klant...</option>
                              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          {selectedClientId && (
                              <select 
                                  value={selectedLocationId}
                                  onChange={e => setSelectedLocationId(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white text-sm outline-none focus:border-apex-gold"
                              >
                                  <option value="">Selecteer Locatie...</option>
                                  {locations.filter(l => l.clientId === selectedClientId).map(l => (
                                      <option key={l.id} value={l.id}>{l.name} - {l.city}</option>
                                  ))}
                              </select>
                          )}
                          <select 
                              value={selectedShiftId}
                              onChange={e => setSelectedShiftId(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white text-sm outline-none focus:border-apex-gold"
                          >
                              <option value="">Selecteer Shift (Optioneel)...</option>
                              {shifts.filter(s => s.employeeId === CURRENT_AGENT_ID).map(s => (
                                  <option key={s.id} value={s.id}>{s.clientName} - {s.location} ({new Date(s.startTime).toLocaleDateString()})</option>
                              ))}
                          </select>
                      </div>
                  )}
              </div>

              {/* Dynamic Fields */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
                  
                  {reportType === 'Incident' && (
                      <>
                          <div>
                              <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">{t('reports.fields.category')}</label>
                              <select 
                                  value={formData.category}
                                  onChange={e => setFormData({...formData, category: e.target.value as any})}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white outline-none focus:border-apex-gold"
                              >
                                  <option value="Overig">Overig</option>
                                  <option value="Diefstal">Diefstal</option>
                                  <option value="Vandalisme">Vandalisme</option>
                                  <option value="Agressie">Agressie</option>
                                  <option value="Ongeval">Ongeval</option>
                                  <option value="Brand">Brand</option>
                                  <option value="Verdachte_Persoon">Verdachte Persoon</option>
                                  <option value="Toegang_Geweigerd">Toegang Geweigerd</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">{t('reports.fields.severity')}</label>
                              <div className="flex gap-2">
                                  {['Low', 'Medium', 'High'].map(lev => (
                                      <button 
                                          key={lev}
                                          onClick={() => setFormData({...formData, severity: lev as any})}
                                          className={clsx(
                                              "flex-1 py-2 rounded text-xs font-bold border transition-all",
                                              formData.severity === lev 
                                                  ? (lev === 'High' ? "bg-red-600 text-white border-red-600" : lev === 'Medium' ? "bg-orange-600 text-white border-orange-600" : "bg-blue-600 text-white border-blue-600")
                                                  : "bg-zinc-950 text-zinc-400 border-zinc-800"
                                          )}
                                      >
                                          {t(`reports.severity.${lev}`)}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </>
                  )}

                  <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">{t('reports.fields.summary')} *</label>
                      <input 
                          type="text"
                          value={formData.summary}
                          onChange={e => setFormData({...formData, summary: e.target.value})}
                          placeholder="Korte samenvatting..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white outline-none focus:border-apex-gold"
                      />
                  </div>

                  <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">{t('reports.fields.details')}</label>
                      <textarea 
                          value={formData.details}
                          onChange={e => setFormData({...formData, details: e.target.value})}
                          placeholder="Volledige beschrijving..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white outline-none focus:border-apex-gold min-h-[120px]"
                      />
                  </div>

                  {reportType === 'Incident' && (
                      <>
                          <div>
                              <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">{t('reports.fields.actions')}</label>
                              <div className="flex flex-wrap gap-2">
                                  {['Politie', 'Ambulance', 'Brandweer', 'Klant', 'Supervisor'].map(act => (
                                      <button 
                                          key={act}
                                          onClick={() => toggleAction(act)}
                                          className={clsx(
                                              "px-3 py-1.5 rounded text-xs border transition-all",
                                              formData.actionsTaken?.includes(act) 
                                                  ? "bg-apex-gold text-black border-apex-gold font-bold" 
                                                  : "bg-zinc-950 text-zinc-400 border-zinc-800"
                                          )}
                                      >
                                          {act}
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <div>
                              <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">{t('reports.fields.involved')}</label>
                              <input 
                                  type="text"
                                  value={formData.involvedParties}
                                  onChange={e => setFormData({...formData, involvedParties: e.target.value})}
                                  placeholder="Namen, contactgegevens..."
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white outline-none focus:border-apex-gold"
                              />
                          </div>
                      </>
                  )}

                  {/* Photos */}
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <label className="text-xs text-zinc-500 uppercase font-bold">{t('reports.fields.photos')}</label>
                          {formData.severity === 'High' && reportType === 'Incident' && (
                              <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertOctagon className="w-3 h-3" /> Verplicht</span>
                          )}
                      </div>
                      
                      <div className="flex gap-2 overflow-x-auto pb-2">
                          <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-20 h-20 flex flex-col items-center justify-center bg-zinc-950 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors shrink-0"
                          >
                              <Camera className="w-6 h-6 mb-1" />
                              <span className="text-[10px] uppercase font-bold">Add</span>
                          </button>
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple className="hidden" />
                          
                          {formData.images?.map((src, i) => (
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
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                  <button 
                      onClick={() => handleSubmit(true)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                  >
                      <Save className="w-5 h-5" /> Opslaan (Concept)
                  </button>
                  <button 
                      onClick={() => handleSubmit(false)}
                      disabled={isSubmitting}
                      className="flex-1 bg-apex-gold hover:bg-yellow-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-apex-gold/10"
                  >
                      {isSubmitting ? "..." : <><Send className="w-5 h-5" /> Indienen</>}
                  </button>
              </div>
          </div>
      )}

      {/* --- MY REPORTS LIST --- */}
      {activeTab === 'MINE' && (
          <div className="space-y-4">
              {/* Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                  {['ALL', 'DRAFT', 'SUBMITTED'].map(status => (
                      <button 
                          key={status}
                          onClick={() => setFilterStatus(status as any)}
                          className={clsx(
                              "px-3 py-1 text-[10px] font-bold uppercase rounded-full border whitespace-nowrap",
                              filterStatus === status ? "bg-white text-black border-white" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                          )}
                      >
                          {status === 'ALL' ? 'Alles' : status === 'DRAFT' ? 'Concepten' : 'Ingediend'}
                      </button>
                  ))}
              </div>

              {filteredReports.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500 italic">
                      Geen rapporten gevonden.
                  </div>
              ) : (
                  filteredReports.map(report => (
                      <div key={report.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden group">
                          {/* Status Strip */}
                          <div className={clsx(
                              "absolute left-0 top-0 bottom-0 w-1",
                              report.status === 'Draft' ? "bg-zinc-600" :
                              report.status === 'Submitted' ? "bg-blue-500" :
                              report.status === 'Approved' ? "bg-green-500" : "bg-red-500"
                          )} />

                          <div className="pl-3">
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
                                              report.type === 'Incident' ? "bg-red-900/20 text-red-400 border-red-900/30" : "bg-blue-900/20 text-blue-400 border-blue-900/30"
                                          )}>
                                              {report.type === 'Incident' ? 'Incident' : 'Dagverslag'}
                                          </span>
                                          <span className="text-xs text-zinc-500">{new Date(report.date).toLocaleDateString()}</span>
                                      </div>
                                      <h3 className="text-white font-bold text-lg">{report.title}</h3>
                                  </div>
                                  <span className={clsx("text-[10px] font-bold uppercase px-2 py-1 rounded",
                                      report.status === 'Draft' ? "bg-zinc-800 text-zinc-400" :
                                      report.status === 'Submitted' ? "bg-blue-900/20 text-blue-400" :
                                      report.status === 'Approved' ? "bg-green-900/20 text-green-400" :
                                      "bg-red-900/20 text-red-400"
                                  )}>
                                      {t(`reports.status.${report.status}`)}
                                  </span>
                              </div>

                              <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                                  {report.summary || 'Geen samenvatting.'}
                              </p>

                              {report.status === 'Rejected' && (
                                  <div className="bg-red-900/10 border border-red-900/30 p-2 rounded mb-3 text-xs text-red-300">
                                      <strong>Reden weigering:</strong> "{report.lastRejectedReason || report.auditLog.find(l => l.action === 'Rejected')?.reason || 'Geen reden'}"
                                  </div>
                              )}

                              <div className="flex justify-end gap-2">
                                  {(report.status === 'Draft' || report.status === 'Rejected') ? (
                                      <button 
                                          onClick={() => handleEdit(report)}
                                          className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-2"
                                      >
                                          <Edit className="w-3 h-3" /> Bewerken & Indienen
                                      </button>
                                  ) : (
                                      <button 
                                          onClick={() => handleDownloadPdf(report)}
                                          className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-2"
                                      >
                                          <FileText className="w-3 h-3" /> PDF
                                      </button>
                                  )}
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      )}
    </div>
  );
};