
import React, { useState } from 'react';
import { useStore } from '../../data/store';
import { ServiceType, DayType } from '../../data/types';
import { Save, Settings, Mail, DollarSign, FileText, Upload, Image as ImageIcon, Trash2, AlertTriangle, RefreshCw, KeyRound, Eye, EyeOff } from 'lucide-react';

const ADMIN_CREDS_KEY = 'apex_admin_credentials';
const getAdminCreds = () => {
  try { return JSON.parse(localStorage.getItem(ADMIN_CREDS_KEY) || '{"username":"admin","password":"admin"}'); }
  catch { return { username: 'admin', password: 'admin' }; }
};

export const SettingsPage: React.FC = () => {
  const { pricingConfig, savePricingConfig, saveSmtpConfig, brandLogoBase64, saveBrandLogo, invoiceTemplateBase64, saveInvoiceTemplate } = useStore();

  const [matrix, setMatrix] = useState(pricingConfig.matrix);
  const [factors, setFactors] = useState({
    night: pricingConfig.nightFactor,
    vat: pricingConfig.vatRate,
    minHours: pricingConfig.minHours,
    lastMinute: pricingConfig.lastMinuteFactor
  });
  const [smtp, setSmtp] = useState(pricingConfig.smtp);

  // Admin credentials state
  const [adminCreds, setAdminCreds] = useState(getAdminCreds());
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);

  const handleSaveAdminCreds = () => {
    if (!adminCreds.username || !adminCreds.password) return;
    localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(adminCreds));
    setAdminSaved(true);
    setTimeout(() => setAdminSaved(false), 2500);
  };

  const handleMatrixChange = (service: ServiceType, day: DayType, val: string) => {
    setMatrix(prev => ({
      ...prev,
      [service]: { ...prev[service], [day]: parseFloat(val) || 0 }
    }));
  };

  const handleSavePricing = () => {
    savePricingConfig({
      matrix,
      nightFactor: factors.night,
      vatRate: factors.vat,
      minHours: factors.minHours,
      lastMinuteFactor: factors.lastMinute
    });
    alert('Tarieven opgeslagen.');
  };

  const handleSaveSmtp = () => {
    saveSmtpConfig(smtp);
    alert('SMTP opgeslagen.');
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
          alert("PDF wordt niet ondersteund als achtergrond. Converteer je template naar een afbeelding (JPG/PNG).");
          return;
      }
      const reader = new FileReader();
      reader.onload = () => {
          if (reader.result) {
              saveInvoiceTemplate(reader.result as string);
              alert("Template afbeelding opgeslagen.");
          }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = () => saveBrandLogo(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const days: DayType[] = ['Week', 'Zaterdag', 'Zondag', 'Feestdag'];
  const services: ServiceType[] = ['Statisch', 'Winkel', 'Werf', 'Event', 'Haven', 'Overig'];

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in">
      <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-2">
        <Settings className="w-8 h-8 text-apex-gold" /> Instellingen
      </h2>

      {/* BRANDING */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-apex-gold" /> Branding & Templates
          </h3>
          
          <div className="flex flex-col md:flex-row gap-8">
              {/* Logo */}
              <div className="flex-1">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase mb-2">Bedrijfslogo</h4>
                  <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-black border border-zinc-700 rounded flex items-center justify-center overflow-hidden">
                          {brandLogoBase64 ? <img src={brandLogoBase64} className="max-w-full max-h-full" /> : <span className="text-zinc-600 text-xs">Geen</span>}
                      </div>
                      <div>
                          <label className="cursor-pointer bg-zinc-800 px-3 py-1.5 rounded text-xs font-bold text-white hover:bg-zinc-700 flex items-center gap-2 mb-2">
                              <Upload className="w-3 h-3" /> Upload Logo
                              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          </label>
                          {brandLogoBase64 && <button onClick={() => saveBrandLogo(null)} className="text-red-500 text-xs hover:underline">Verwijderen</button>}
                      </div>
                  </div>
              </div>

              {/* Template */}
              <div className="flex-1">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase mb-2">Factuur Achtergrond</h4>
                  <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded mb-3">
                      <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-300">Upload een A4 afbeelding (JPG/PNG). PDF wordt niet ondersteund.</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="w-20 h-28 bg-white border border-zinc-700 rounded flex items-center justify-center overflow-hidden relative">
                          {invoiceTemplateBase64 ? <img src={invoiceTemplateBase64} className="w-full h-full object-cover opacity-50" /> : <span className="text-zinc-400 text-xs">Leeg</span>}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-black font-bold text-[8px] opacity-20">A4 PREVIEW</div>
                      </div>
                      <div>
                          <label className="cursor-pointer bg-zinc-800 px-3 py-1.5 rounded text-xs font-bold text-white hover:bg-zinc-700 flex items-center gap-2 mb-2">
                              <Upload className="w-3 h-3" /> Upload Image
                              <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleTemplateUpload} />
                          </label>
                          {invoiceTemplateBase64 && <button onClick={() => saveInvoiceTemplate(null)} className="text-red-500 text-xs hover:underline">Verwijderen</button>}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* PRICING */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-apex-gold" /> Tarieven</h3>
        <div className="grid grid-cols-4 gap-4 mb-6">
           <div><label className="text-xs text-zinc-500 block">Nachtfactor</label><input type="number" step="0.1" value={factors.night} onChange={e=>setFactors({...factors, night: parseFloat(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white" /></div>
           <div><label className="text-xs text-zinc-500 block">BTW %</label><input type="number" value={factors.vat} onChange={e=>setFactors({...factors, vat: parseFloat(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white" /></div>
           <div><label className="text-xs text-zinc-500 block">Min Uren</label><input type="number" value={factors.minHours} onChange={e=>setFactors({...factors, minHours: parseFloat(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white" /></div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead><tr><th className="p-2 text-zinc-500">Service</th>{days.map(d=><th key={d} className="p-2 text-zinc-500">{d}</th>)}</tr></thead>
                <tbody>
                    {services.map(s => (
                        <tr key={s} className="border-b border-zinc-800">
                            <td className="p-2 font-bold text-white">{s}</td>
                            {days.map(d => (
                                <td key={d} className="p-2"><input type="number" value={matrix[s]?.[d]||0} onChange={e=>handleMatrixChange(s,d,e.target.value)} className="w-20 bg-zinc-950 border border-zinc-800 p-1 text-right text-apex-gold" /></td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <button onClick={handleSavePricing} className="mt-4 bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2"><Save className="w-4 h-4"/> Opslaan</button>
      </div>

      {/* Admin credentials */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><KeyRound className="w-5 h-5 text-apex-gold" /> Admin inloggegevens</h3>
        <p className="text-zinc-500 text-xs mb-4">Wijzig de gebruikersnaam en het wachtwoord van het admin-account.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Gebruikersnaam</label>
            <input type="text" value={adminCreds.username}
              onChange={e => setAdminCreds({ ...adminCreds, username: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-white text-sm focus:border-apex-gold outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Wachtwoord</label>
            <div className="relative">
              <input type={showAdminPass ? 'text' : 'password'} value={adminCreds.password}
                onChange={e => setAdminCreds({ ...adminCreds, password: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 pr-9 rounded text-white text-sm focus:border-apex-gold outline-none" />
              <button type="button" onClick={() => setShowAdminPass(!showAdminPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <button onClick={handleSaveAdminCreds} disabled={!adminCreds.username || !adminCreds.password}
          className="bg-apex-gold hover:bg-yellow-500 disabled:opacity-40 text-black font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
          <Save className="w-4 h-4" /> {adminSaved ? 'Opgeslagen ✓' : 'Wachtwoord opslaan'}
        </button>
      </div>

      {/* SMTP */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Mail className="w-5 h-5 text-apex-gold" /> E-mail (SMTP)</h3>
          <p className="text-zinc-500 text-xs mb-4">Ingesteld voor one.com. Vul enkel uw wachtwoord in en klik Opslaan.</p>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="text-xs text-zinc-500 block mb-1">SMTP Host</label>
                  <input type="text" value={smtp.host} onChange={e=>setSmtp({...smtp, host:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-sm" />
              </div>
              <div>
                  <label className="text-xs text-zinc-500 block mb-1">Poort (465 = SSL)</label>
                  <input type="number" value={smtp.port} onChange={e=>setSmtp({...smtp, port:parseInt(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-sm" />
              </div>
              <div>
                  <label className="text-xs text-zinc-500 block mb-1">E-mailadres (afzender)</label>
                  <input type="email" value={smtp.user} onChange={e=>setSmtp({...smtp, user:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-sm" />
              </div>
              <div>
                  <label className="text-xs text-zinc-500 block mb-1">Wachtwoord <span className="text-apex-gold">*</span></label>
                  <input type="password" placeholder="Uw one.com wachtwoord" value={smtp.pass} onChange={e=>setSmtp({...smtp, pass:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white text-sm" />
              </div>
          </div>
          <button onClick={handleSaveSmtp} className="mt-4 bg-apex-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2"><Save className="w-4 h-4"/> Opslaan</button>
      </div>

      {/* RESET */}
      <div className="bg-zinc-900 border border-red-900/40 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" /> Alle Data Wissen
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
              Verwijdert alle lokale data: medewerkers, shifts, klanten, incidenten, rapporten en tijdregistraties. De app start opnieuw leeg op. Dit kan niet ongedaan worden gemaakt.
          </p>
          <button
              onClick={() => {
                  if (confirm('Ben je zeker? Alle data wordt permanent gewist en de pagina wordt herladen.')) {
                      const keysToRemove = [
                          'apex_employees', 'apex_shifts_v2', 'apex_applications_v2',
                          'apex_incidents', 'apex_clients', 'apex_locations',
                          'apex_reports', 'apex_timelogs_v2', 'apex_system_updates',
                          'apex_billing_invoices_v2', 'apex_billing_overrides_v2',
                          'apex_billing_config_v2'
                      ];
                      keysToRemove.forEach(k => localStorage.removeItem(k));
                      window.location.reload();
                  }
              }}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded font-bold flex items-center gap-2 transition-colors"
          >
              <RefreshCw className="w-4 h-4" /> Reset & Herlaad
          </button>
      </div>

      {/* RESET */}
      <div className="bg-zinc-900 border border-red-900/40 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" /> Alle Data Wissen
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
              Verwijdert alle lokale data: medewerkers, shifts, klanten, incidenten, rapporten en tijdregistraties. De app start opnieuw leeg op. Dit kan niet ongedaan worden gemaakt.
          </p>
          <button
              onClick={() => {
                  if (confirm('Ben je zeker? Alle data wordt permanent gewist en de pagina wordt herladen.')) {
                      const keysToRemove = [
                          'apex_employees', 'apex_shifts_v2', 'apex_applications_v2',
                          'apex_incidents', 'apex_clients', 'apex_locations',
                          'apex_reports', 'apex_timelogs_v2', 'apex_system_updates',
                          'apex_billing_invoices_v2', 'apex_billing_overrides_v2',
                          'apex_billing_config_v2'
                      ];
                      keysToRemove.forEach(k => localStorage.removeItem(k));
                      window.location.reload();
                  }
              }}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded font-bold flex items-center gap-2 transition-colors"
          >
              <RefreshCw className="w-4 h-4" /> Reset & Herlaad
          </button>
      </div>
    </div>
  );
};
