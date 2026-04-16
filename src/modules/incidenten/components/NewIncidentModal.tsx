
import React, { useState, useRef } from 'react';
import { X, Save, Camera, AlertTriangle, AlertOctagon, MapPin, Calendar, Trash2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore, FullIncident, IncidentType, IncidentSeverity } from '../../../data/store';
import { useAuthStore } from '../../auth/store';
import { makeRef } from '../../../utils/pdf/ref';
import { compressImage } from '../../../utils/imageCompression';
import clsx from 'clsx';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { createIncident, clients, locations, shifts } = useStore();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    severity: IncidentSeverity;
    type: IncidentType;
    photos: string[];
    date: string;
    time: string;
  }>({
    title: '',
    description: '',
    severity: 'Medium',
    type: 'Incident',
    photos: [],
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search State
  const [clientSearch, setClientSearch] = useState('');
  const [shiftSearch, setShiftSearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
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
         setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
      setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const handleSubmit = () => {
      if (!formData.title || !formData.description) {
          alert(t('incidenten.validation.required'));
          return;
      }

      setIsSubmitting(true);

      const dateTime = `${formData.date}T${formData.time}:00`;

      const newIncident: FullIncident = {
          id: makeRef('INC'),
          title: formData.title,
          type: formData.type,
          description: formData.description,
          severity: formData.severity,
          date: dateTime,
          status: 'Submitted', // Admins submit directly
          photos: formData.photos,
          comments: [],
          auditLog: [{ 
              action: 'Created (Admin)', 
              user: user?.username || 'Admin', 
              date: new Date().toISOString() 
          }],
          clientId: selectedClientId || undefined,
          locationId: selectedLocationId || undefined,
          shiftId: selectedShiftId || undefined,
          authorId: 'ADMIN', // Marker for admin creation
          emailStatus: 'NONE'
      };

      createIncident(newIncident);

      setTimeout(() => {
          setIsSubmitting(false);
          onClose();
          // Reset form handled by unmount, but good practice if reused
      }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-apex-gold" /> {t('incidenten.newTitle')}
        </h3>

        <div className="space-y-6">
            
            {/* Context Section */}
            <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Context
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Klant</label>
                        <div className="relative mb-1">
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                            <input 
                                type="text" 
                                placeholder="Zoek klant..." 
                                value={clientSearch} 
                                onChange={(e) => setClientSearch(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2 py-1.5 text-xs text-white focus:border-apex-gold outline-none"
                            />
                        </div>
                        <select 
                            value={selectedClientId}
                            onChange={e => { setSelectedClientId(e.target.value); setSelectedLocationId(''); setSelectedShiftId(''); }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white text-sm focus:border-apex-gold outline-none"
                        >
                            <option value="">Selecteer Klant...</option>
                            {clients
                                .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Locatie</label>
                        <div className="h-[34px] mb-1"></div> {/* Spacer to align with search input height */}
                        <select 
                            value={selectedLocationId}
                            onChange={e => setSelectedLocationId(e.target.value)}
                            disabled={!selectedClientId}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white text-sm focus:border-apex-gold outline-none disabled:opacity-50"
                        >
                            <option value="">Selecteer Locatie...</option>
                            {locations.filter(l => l.clientId === selectedClientId).map(l => (
                                <option key={l.id} value={l.id}>{l.name} - {l.city}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Gekoppelde Shift (Optioneel)</label>
                        <div className="relative mb-1">
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                            <input 
                                type="text" 
                                placeholder="Zoek shift..." 
                                value={shiftSearch} 
                                onChange={(e) => setShiftSearch(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2 py-1.5 text-xs text-white focus:border-apex-gold outline-none"
                            />
                        </div>
                        <select 
                            value={selectedShiftId}
                            onChange={e => setSelectedShiftId(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white text-sm focus:border-apex-gold outline-none"
                        >
                            <option value="">Geen specifieke shift</option>
                            {shifts.filter(s => {
                                const matchClient = !selectedClientId || clients.find(c => c.id === selectedClientId)?.name === s.clientName;
                                const matchSearch = !shiftSearch || s.clientName.toLowerCase().includes(shiftSearch.toLowerCase()) || s.location.toLowerCase().includes(shiftSearch.toLowerCase());
                                return matchClient && matchSearch;
                            }).slice(0, 20).map(s => (
                                <option key={s.id} value={s.id}>
                                    {new Date(s.startTime).toLocaleDateString()} - {s.clientName} ({s.location})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Type & Severity */}
            <div className="grid grid-cols-2 gap-4">
                <div 
                    onClick={() => setFormData({...formData, type: 'Incident'})}
                    className={clsx("p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center gap-2", 
                        formData.type === 'Incident' ? "border-red-500 bg-red-900/10 text-white" : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700"
                    )}
                >
                    <AlertTriangle className={clsx("w-4 h-4", formData.type === 'Incident' ? "text-red-500" : "text-zinc-500")} />
                    <span className="font-bold text-sm">{t('incidenten.types.incident')}</span>
                </div>
                <div 
                    onClick={() => setFormData({...formData, type: 'Complaint'})}
                    className={clsx("p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center gap-2", 
                        formData.type === 'Complaint' ? "border-orange-500 bg-orange-900/10 text-white" : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700"
                    )}
                >
                    <AlertOctagon className={clsx("w-4 h-4", formData.type === 'Complaint' ? "text-orange-500" : "text-zinc-500")} />
                    <span className="font-bold text-sm">{t('incidenten.types.complaint')}</span>
                </div>
            </div>

            {/* Severity Select */}
            <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">{t('incidenten.fields.severity')}</label>
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

            {/* Main Content */}
            <div className="space-y-4">
                <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">{t('incidenten.fields.title')} *</label>
                    <input 
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-apex-gold outline-none"
                        placeholder="Korte omschrijving..."
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">{t('incidenten.fields.description')} *</label>
                    <textarea 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-apex-gold outline-none h-24 resize-none"
                        placeholder="Wat is er gebeurd? Wie was betrokken?"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">{t('common.date')}</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                            <input 
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded pl-10 pr-3 py-2 text-white focus:border-apex-gold outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Tijdstip</label>
                        <input 
                            type="time"
                            value={formData.time}
                            onChange={e => setFormData({...formData, time: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:border-apex-gold outline-none text-center"
                        />
                    </div>
                </div>
            </div>

            {/* Photos */}
            <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-2">{t('incidenten.fields.photos')}</label>
                <div className="flex gap-2 overflow-x-auto">
                    {formData.photos.length < 3 && (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 flex flex-col items-center justify-center bg-zinc-950 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors shrink-0"
                        >
                            <Camera className="w-6 h-6 mb-1" />
                            <span className="text-[9px] font-bold uppercase">Upload</span>
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple className="hidden" />
                    
                    {formData.photos.map((src, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-zinc-800 group">
                            <img src={src} className="w-full h-full object-cover" />
                            <button 
                                onClick={() => removePhoto(i)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-apex-gold hover:bg-yellow-500 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                >
                    {isSubmitting ? "Bezig..." : <><Save className="w-4 h-4" /> {t('common.save')}</>}
                </button>
                <button 
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg transition-colors border border-zinc-700"
                >
                    {t('common.cancel')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
