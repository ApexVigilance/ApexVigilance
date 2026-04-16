import React from 'react';
import { useAuthStore } from '../auth/store';
import { useStore } from '../../data/store';
import { Building2, Mail, Phone, MapPin, Hash, FileText, Users } from 'lucide-react';

export const ClientProfielPage: React.FC = () => {
  const { user } = useAuthStore();
  const { clients, locations } = useStore();

  const clientId = user?.clientId || '';
  const client = clients.find(c => c.id === clientId);
  const clientLocs = locations.filter(l => l.clientId === clientId);

  if (!client) return <div className="p-8 text-zinc-400">Klantprofiel niet gevonden.</div>;

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) => (
    value ? (
      <div className="flex items-start gap-3 py-3 border-b border-zinc-800/50 last:border-0">
        <Icon className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
          <div className="text-sm text-white mt-0.5">{value}</div>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="pb-10 animate-in fade-in duration-300 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Profiel</h1>
        <p className="text-zinc-400 text-sm mt-1">Uw bedrijfsgegevens en contactinformatie</p>
      </div>

      {/* Company card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800">
            <Building2 className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{client.name}</h2>
            {client.clientRef && (
              <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold mt-0.5">
                <Hash className="w-3 h-3" /> {client.clientRef}
              </div>
            )}
          </div>
        </div>

        <InfoRow icon={Users} label="Contactpersoon" value={client.contact} />
        <InfoRow icon={Mail} label="E-mail" value={client.email} />
        <InfoRow icon={Phone} label="Telefoon" value={client.phone} />
        <InfoRow icon={MapPin} label="Adres" value={client.address} />
        <InfoRow icon={FileText} label="BTW-nummer" value={client.vat} />
        {client.contractNumber && <InfoRow icon={FileText} label="Contractnummer" value={client.contractNumber} />}
        {client.paymentTerms && <InfoRow icon={FileText} label="Betalingstermijn" value={`${client.paymentTerms} dagen`} />}
      </div>

      {/* Locaties */}
      {clientLocs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-black text-white mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" /> Uw locaties ({clientLocs.length})
          </h3>
          <div className="space-y-3">
            {clientLocs.map(loc => (
              <div key={loc.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{loc.name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{loc.address}, {loc.city}</div>
                  </div>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{loc.type}</span>
                </div>
                {loc.accessInfo && (
                  <div className="text-xs text-zinc-500 mt-2 italic">"{loc.accessInfo}"</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-xs text-zinc-500">
        Wilt u uw gegevens wijzigen? Neem contact op met Apex Vigilance Group.
      </div>
    </div>
  );
};
