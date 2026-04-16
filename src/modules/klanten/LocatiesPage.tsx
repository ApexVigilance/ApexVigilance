
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../../ui/BackButton';
import { useStore, ClientLocation } from '../../data/store';
import { Plus, MapPin, Building, ChevronRight, Clock, Shield, X, Map, Building2 } from 'lucide-react';
import clsx from 'clsx';

export const LocatiesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clients, locations, shifts, createLocation } = useStore();

  const clientIdParam = searchParams.get('clientId');
  const [selectedClientId, setSelectedClientId] = useState(clientIdParam || (clients.length > 0 ? clients[0].id : ''));
  const [selectedLocation, setSelectedLocation] = useState<ClientLocation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newLoc, setNewLoc] = useState<Partial<ClientLocation>>({
    name: '',
    address: '',
    city: '',
    type: 'Overig',
  });

  useEffect(() => {
    if (clientIdParam && clientIdParam !== selectedClientId) {
      setSelectedClientId(clientIdParam);
    }
  }, [clientIdParam]);

  const handleClientChange = (id: string) => {
    setSelectedClientId(id);
    setSearchParams({ clientId: id });
    setSelectedLocation(null);
  };

  const filteredLocations = locations.filter(l => l.clientId === selectedClientId);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const relatedShifts = selectedLocation ? shifts.filter(s => {
    const locMatch = s.location.toLowerCase().includes(selectedLocation.name.toLowerCase()) || 
                     s.location.toLowerCase().includes(selectedLocation.city.toLowerCase());
    const clientMatch = s.clientName === selectedClient?.name;
    return clientMatch && locMatch;
  }).slice(0, 10) : [];

  const handleCreate = () => {
    if (newLoc.name && selectedClientId) {
      const loc: ClientLocation = {
        // Fix: Template literal
        id: `LOC-${Date.now()}`,
        clientId: selectedClientId,
        name: newLoc.name || '',
        address: newLoc.address || '',
        city: newLoc.city || '',
        type: newLoc.type as any || 'Overig',
        accessInfo: newLoc.accessInfo || ''
      };
      createLocation(loc);
      setIsModalOpen(false);
      setNewLoc({ name: '', address: '', city: '', type: 'Overig' });
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-300">
      <div className="flex-none pb-6">
        <BackButton />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">{t('klanten.locationCount')}</h2>
                <p className="text-zinc-400 mt-1">{t('klanten.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                <select 
                    value={selectedClientId}
                    onChange={e => handleClientChange(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-apex-gold focus:ring-1 focus:ring-apex-gold/50 outline-none min-w-[240px] appearance-none"
                >
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <button 
                   onClick={() => setIsModalOpen(true)}
                   className="bg-apex-gold text-black px-5 py-2.5 rounded-lg font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-apex-gold/20 flex items-center gap-2 active:scale-95 group flex-shrink-0"
                   disabled={!selectedClientId}
                >
                   <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
                   <span>{t('klanten.newLoc')}</span>
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden pb-4">
         {/* Locations List */}
         <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {filteredLocations.length === 0 ? (
               <div className="py-16 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>{t('klanten.noLocs')}</p>
               </div>
            ) : (
                filteredLocations.map(loc => (
                    <div 
                        key={loc.id} 
                        onClick={() => setSelectedLocation(loc)}
                        className={clsx(
                            "p-5 rounded-xl cursor-pointer transition-all duration-300 border group relative overflow-hidden",
                            selectedLocation?.id === loc.id 
                                ? "bg-zinc-800/80 border-apex-gold shadow-lg shadow-apex-gold/10" 
                                : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/80"
                        )}
                    >
                        {selectedLocation?.id === loc.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-apex-gold" />
                        )}
                        <div className="flex justify-between items-start pl-2">
                            <div>
                                <h4 className={clsx("font-bold text-lg mb-1 transition-colors", selectedLocation?.id === loc.id ? "text-white" : "text-zinc-300 group-hover:text-white")}>
                                    {loc.name}
                                </h4>
                                <div className="text-zinc-500 text-sm flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" /> 
                                    <span className="truncate">{loc.address}, {loc.city}</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase bg-zinc-950/80 text-zinc-400 px-2 py-1 rounded border border-zinc-800 backdrop-blur-sm tracking-wider">
                                {loc.type}
                            </span>
                        </div>
                    </div>
                ))
            )}
         </div>

         {/* Details & Shifts Panel (Desktop: Right Side, Mobile: Conditional or Bottom) */}
         {selectedLocation && (
             <div className="md:w-[400px] w-full bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 overflow-y-auto animate-in slide-in-from-right-4 duration-300 shadow-2xl flex flex-col">
                 <div className="flex justify-between items-start mb-8 border-b border-zinc-800 pb-4">
                     <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{t('common.details')}</h3>
                        <div className="text-xs text-zinc-500 font-mono">{selectedLocation.id}</div>
                     </div>
                     <button onClick={() => setSelectedLocation(null)} className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors">
                         <X className="w-5 h-5" />
                     </button>
                 </div>
                 
                 <div className="space-y-6 mb-8 flex-1">
                     <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">{t('klanten.form.locName')}</label>
                         <div className="text-white font-bold text-lg flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-apex-gold" /> {selectedLocation.name}
                         </div>
                     </div>
                     
                     <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">{t('klanten.form.locAddress')}</label>
                         <div className="text-zinc-300 text-sm leading-relaxed">{selectedLocation.address}<br/>{selectedLocation.city}</div>
                         <div className="flex items-center gap-2 text-apex-gold text-xs font-bold cursor-pointer hover:underline mt-2">
                             <Map className="w-3 h-3" /> {t('klanten.actions.viewMap')}
                         </div>
                     </div>

                     <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">{t('klanten.form.access')}</label>
                         <div className="text-zinc-400 text-sm italic leading-relaxed">{selectedLocation.accessInfo || 'Geen specifieke instructies.'}</div>
                     </div>
                 </div>

                 <div className="pt-6 border-t border-zinc-800">
                     <h4 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                         <Shield className="w-4 h-4 text-apex-gold" /> {t('klanten.recentShifts')}
                     </h4>
                     <div className="space-y-2">
                         {relatedShifts.length === 0 ? (
                             <div className="text-zinc-600 text-xs italic bg-zinc-950/30 p-3 rounded border border-dashed border-zinc-800 text-center">Geen shifts gevonden.</div>
                         ) : (
                             relatedShifts.map(s => (
                                 <Link 
                                    // Fix: Template literal
                                    to={`/shifts/${s.id}`} 
                                    key={s.id}
                                    className="block bg-zinc-950/80 border border-zinc-800 p-3 rounded hover:border-zinc-600 hover:bg-zinc-900 transition-colors group"
                                 >
                                     <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-mono uppercase">
                                         <span>{new Date(s.startTime).toLocaleDateString()}</span>
                                         <span className={clsx("font-bold", s.status === 'Active' ? 'text-green-500 animate-pulse' : '')}>{s.status}</span>
                                     </div>
                                     <div className="text-zinc-300 font-bold text-xs truncate group-hover:text-white">{s.location}</div>
                                 </Link>
                             ))
                         )}
                     </div>
                 </div>
             </div>
         )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-apex-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                 <div className="p-2 bg-apex-gold/10 rounded-lg border border-apex-gold/20">
                    <Plus className="w-6 h-6 text-apex-gold" /> 
                 </div>
                 {t('klanten.newLoc')}
              </h3>
              
              <div className="space-y-5">
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">{t('klanten.form.locName')} <span className="text-apex-gold">*</span></label>
                    <input 
                       type="text" 
                       value={newLoc.name}
                       onChange={e => setNewLoc({...newLoc, name: e.target.value})}
                       className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-apex-gold focus:ring-1 focus:ring-apex-gold/50 outline-none transition-all"
                       placeholder="Hoofdkantoor, Magazijn..."
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">{t('klanten.form.locAddress')}</label>
                    <input 
                       type="text" 
                       value={newLoc.address}
                       onChange={e => setNewLoc({...newLoc, address: e.target.value})}
                       className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-apex-gold focus:ring-1 focus:ring-apex-gold/50 outline-none transition-all"
                       placeholder="Straat & Nummer"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">{t('klanten.form.city')}</label>
                        <input 
                           type="text" 
                           value={newLoc.city}
                           onChange={e => setNewLoc({...newLoc, city: e.target.value})}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-apex-gold focus:ring-1 focus:ring-apex-gold/50 outline-none transition-all"
                           placeholder="Stad / Gemeente"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">{t('klanten.form.type')}</label>
                        <select 
                           value={newLoc.type}
                           onChange={e => setNewLoc({...newLoc, type: e.target.value as any})}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-apex-gold focus:ring-1 focus:ring-apex-gold/50 outline-none transition-all appearance-none"
                        >
                            <option value="Werf">Werf</option>
                            <option value="Winkel">Winkel</option>
                            <option value="Haven">Haven</option>
                            <option value="Ziekenhuis">Ziekenhuis</option>
                            <option value="Event">Event</option>
                            <option value="Overig">Overig</option>
                        </select>
                     </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">{t('klanten.form.access')}</label>
                    <textarea 
                       value={newLoc.accessInfo}
                       onChange={e => setNewLoc({...newLoc, accessInfo: e.target.value})}
                       className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-apex-gold focus:ring-1 focus:ring-apex-gold/50 outline-none transition-all h-24 resize-none"
                       placeholder="Codes, contactpersoon ter plaatse, etc..."
                    />
                 </div>

                 <div className="flex gap-4 mt-8 pt-4 border-t border-zinc-800">
                    <button 
                       onClick={handleCreate}
                       disabled={!newLoc.name}
                       className="flex-1 bg-apex-gold hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-apex-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {t('klanten.form.create')}
                    </button>
                    <button 
                       onClick={() => setIsModalOpen(false)}
                       className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-lg transition-colors border border-zinc-700"
                    >
                       {t('klanten.form.cancel')}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
