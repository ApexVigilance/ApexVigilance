import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Building2, ArrowLeft, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { useStore } from '../../data/store';
import { RegistrationType } from '../../data/types';


type Step = 'keuze' | 'formulier' | 'bevestigd';

const TALEN = ['NL', 'FR', 'EN', 'DE'];

const inputClass =
  'w-full bg-[#191a1b] border border-white/8 rounded-xl px-4 py-3 text-[#f7f8f8] text-sm outline-none transition-all placeholder:text-[#62666d] focus:border-[#7170ff] focus:ring-2 focus:ring-[#7170ff]/20';

const labelClass = 'block text-[11px] font-medium text-[#8a8f98] uppercase tracking-[0.18em] mb-2';

export const RegistratiePage: React.FC = () => {
  const { addPendingRegistration, pricingConfig, brandLogoBase64 } = useStore();

  const [step, setStep] = useState<Step>('keuze');
  const [type, setType] = useState<RegistrationType>('agent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Agent fields
  const [agentForm, setAgentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    languages: [] as string[],
    motivation: '',
  });

  // Client fields
  const [clientForm, setClientForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    vat: '',
    message: '',
  });

  const chooseType = (t: RegistrationType) => {
    setType(t);
    setStep('formulier');
    setError('');
  };

  const toggleLanguage = (lang: string) => {
    setAgentForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const validateAgent = () => {
    const { firstName, lastName, email, phone } = agentForm;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('Vul alle verplichte velden in.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Voer een geldig e-mailadres in.');
      return false;
    }
    return true;
  };

  const validateClient = () => {
    const { companyName, contactPerson, email, phone, address } = clientForm;
    if (!companyName.trim() || !contactPerson.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setError('Vul alle verplichte velden in.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Voer een geldig e-mailadres in.');
      return false;
    }
    return true;
  };

  const sendConfirmationEmail = async (to: string, name: string) => {
    try {
      const smtp = pricingConfig?.smtp;
      await fetch('http://localhost:3001/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [to],
          subject: 'Aanvraag ontvangen – Apex Vigilance Group',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#08090a;color:#f7f8f8;border-radius:12px;padding:32px">
              <h2 style="color:#7170ff;margin-top:0">Apex Vigilance Group</h2>
              <p>Beste ${name},</p>
              <p>Wij hebben uw aanvraag succesvol ontvangen en zullen deze zo snel mogelijk behandelen.</p>
              <p>U ontvangt een berichtje zodra uw aanvraag is goedgekeurd en uw account is aangemaakt.</p>
              <p>Met vriendelijke groeten,<br/><strong>Apex Vigilance Group</strong></p>
            </div>
          `,
          smtp: smtp?.pass ? smtp : undefined,
        }),
      });
    } catch {
      // email failure is non-blocking
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (type === 'agent' && !validateAgent()) return;
    if (type === 'client' && !validateClient()) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 500));

    if (type === 'agent') {
      addPendingRegistration({
        type: 'agent',
        email: agentForm.email,
        phone: agentForm.phone,
        address: agentForm.address || undefined,
        firstName: agentForm.firstName,
        lastName: agentForm.lastName,
        languages: agentForm.languages.length > 0 ? agentForm.languages : undefined,
        motivation: agentForm.motivation || undefined,
      });
      await sendConfirmationEmail(agentForm.email, `${agentForm.firstName} ${agentForm.lastName}`);
    } else {
      addPendingRegistration({
        type: 'client',
        email: clientForm.email,
        phone: clientForm.phone,
        address: clientForm.address || undefined,
        companyName: clientForm.companyName,
        contactPerson: clientForm.contactPerson,
        vat: clientForm.vat || undefined,
        message: clientForm.message || undefined,
      });
      await sendConfirmationEmail(clientForm.email, clientForm.contactPerson);
    }

    setLoading(false);
    setStep('bevestigd');
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(113,112,255,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(94,106,210,0.10),transparent_28%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          {brandLogoBase64 ? (
            <img src={brandLogoBase64} alt="Logo" className="h-32 object-contain opacity-95 mb-2" />
          ) : (
            <div className="w-24 h-24 rounded-3xl border border-white/10 bg-[#0f1011] flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_40px_rgba(113,112,255,0.15)] mb-2">
              <span className="text-5xl font-semibold text-[#f7f8f8]">A</span>
            </div>
          )}
          <p className="text-sm text-[#8a8f98] mt-1">Profiel aanmaken</p>
        </div>

        {/* Step: Keuze */}
        {step === 'keuze' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-[#0f1011]/96 backdrop-blur-xl p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <h2 className="text-base font-semibold text-white mb-1">Wie bent u?</h2>
              <p className="text-sm text-[#8a8f98] mb-5">Kies hieronder uw type registratie.</p>

              <button
                onClick={() => chooseType('agent')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-[#5e6ad2]/10 hover:border-[#5e6ad2]/40 transition-all text-left mb-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#5e6ad2]/15 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[#7170ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">Bewakingsagent</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8a8f98] shrink-0" />
              </button>

              <button
                onClick={() => chooseType('client')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">Klant / Bedrijf</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8a8f98] shrink-0" />
              </button>
            </div>

            <div className="text-center">
              <Link to="/login" className="text-xs text-[#8a8f98] hover:text-[#f7f8f8] transition-colors flex items-center justify-center gap-1.5">
                <ArrowLeft className="w-3 h-3" /> Terug naar inloggen
              </Link>
            </div>
          </div>
        )}

        {/* Step: Formulier */}
        {step === 'formulier' && (
          <div>
            <div className="rounded-2xl border border-white/8 bg-[#0f1011]/96 backdrop-blur-xl p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === 'agent' ? 'bg-[#5e6ad2]/15' : 'bg-emerald-500/15'}`}>
                  {type === 'agent' ? <Shield className="w-4 h-4 text-[#7170ff]" /> : <Building2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white leading-tight">
                    {type === 'agent' ? 'Registreer als agent' : 'Registreer als klant'}
                  </h2>
                  <p className="text-xs text-[#8a8f98]">Velden met * zijn verplicht</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-300 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {type === 'agent' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Voornaam *</label>
                        <input className={inputClass} value={agentForm.firstName} onChange={e => setAgentForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Jan" />
                      </div>
                      <div>
                        <label className={labelClass}>Achternaam *</label>
                        <input className={inputClass} value={agentForm.lastName} onChange={e => setAgentForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Janssen" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>E-mailadres *</label>
                      <input type="email" className={inputClass} value={agentForm.email} onChange={e => setAgentForm(f => ({ ...f, email: e.target.value }))} placeholder="jan@email.com" />
                    </div>
                    <div>
                      <label className={labelClass}>Telefoonnummer *</label>
                      <input type="tel" className={inputClass} value={agentForm.phone} onChange={e => setAgentForm(f => ({ ...f, phone: e.target.value }))} placeholder="+32 4xx xx xx xx" />
                    </div>
                    <div>
                      <label className={labelClass}>Adres</label>
                      <input className={inputClass} value={agentForm.address} onChange={e => setAgentForm(f => ({ ...f, address: e.target.value }))} placeholder="Straat 1, 1000 Brussel" />
                    </div>
                    <div>
                      <label className={labelClass}>Talen</label>
                      <div className="flex gap-2 flex-wrap">
                        {TALEN.map(lang => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => toggleLanguage(lang)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              agentForm.languages.includes(lang)
                                ? 'bg-[#5e6ad2]/20 border-[#5e6ad2]/50 text-[#7170ff]'
                                : 'bg-white/[0.03] border-white/8 text-[#8a8f98] hover:border-white/20'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Motivatie</label>
                      <textarea
                        className={`${inputClass} resize-none`}
                        rows={3}
                        value={agentForm.motivation}
                        onChange={e => setAgentForm(f => ({ ...f, motivation: e.target.value }))}
                        placeholder="Waarom wilt u bij Apex Vigilance werken?"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={labelClass}>Bedrijfsnaam *</label>
                      <input className={inputClass} value={clientForm.companyName} onChange={e => setClientForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Mijn Bedrijf NV" />
                    </div>
                    <div>
                      <label className={labelClass}>Contactpersoon *</label>
                      <input className={inputClass} value={clientForm.contactPerson} onChange={e => setClientForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="Naam contactpersoon" />
                    </div>
                    <div>
                      <label className={labelClass}>E-mailadres *</label>
                      <input type="email" className={inputClass} value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))} placeholder="info@bedrijf.be" />
                    </div>
                    <div>
                      <label className={labelClass}>Telefoonnummer *</label>
                      <input type="tel" className={inputClass} value={clientForm.phone} onChange={e => setClientForm(f => ({ ...f, phone: e.target.value }))} placeholder="+32 2 xxx xx xx" />
                    </div>
                    <div>
                      <label className={labelClass}>Adres *</label>
                      <input className={inputClass} value={clientForm.address} onChange={e => setClientForm(f => ({ ...f, address: e.target.value }))} placeholder="Straat 1, 1000 Brussel" />
                    </div>
                    <div>
                      <label className={labelClass}>BTW-nummer</label>
                      <input className={inputClass} value={clientForm.vat} onChange={e => setClientForm(f => ({ ...f, vat: e.target.value }))} placeholder="BE 0xxx.xxx.xxx" />
                    </div>
                    <div>
                      <label className={labelClass}>Bericht</label>
                      <textarea
                        className={`${inputClass} resize-none`}
                        rows={3}
                        value={clientForm.message}
                        onChange={e => setClientForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="Bijkomende informatie of vragen..."
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5e6ad2] hover:bg-[#7170ff] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(94,106,210,0.22)]"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {loading ? 'Bezig...' : 'Aanvraag indienen'}
                </button>
              </form>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={() => { setStep('keuze'); setError(''); }}
                className="text-xs text-[#8a8f98] hover:text-[#f7f8f8] transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-3 h-3" /> Terug
              </button>
            </div>
          </div>
        )}

        {/* Step: Bevestigd */}
        {step === 'bevestigd' && (
          <div className="rounded-2xl border border-white/8 bg-[#0f1011]/96 backdrop-blur-xl p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Aanvraag ingediend</h2>
            <p className="text-sm text-[#8a8f98] mb-6">
              Uw aanvraag is succesvol ingediend. U ontvangt een bevestiging per e-mail. Wij nemen zo snel mogelijk contact op.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-[#5e6ad2] hover:bg-[#7170ff] text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Terug naar inloggen
            </Link>
          </div>
        )}

        <div className="mt-6 text-center text-[#62666d] text-xs">
          Apex Vigilance Group &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
