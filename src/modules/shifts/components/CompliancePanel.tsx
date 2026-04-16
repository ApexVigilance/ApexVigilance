import React from 'react';
import { Employee } from '../../../data/types';
import { ShieldCheck, Award, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

interface CompliancePanelProps {
  requiredRole: 'Guard' | 'Senior';
  requiredCerts: string[];
  assignedEmployees: Employee[];
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({
  requiredRole,
  requiredCerts,
  assignedEmployees
}) => {
  const totalAssigned = assignedEmployees.length;

  // Calculate stats
  let roleMatches = 0;
  let certMatches = 0;
  let badgeIssues = 0;

  const employeeValidation = assignedEmployees.map(emp => {
    const roleOK = requiredRole === 'Guard' || (requiredRole === 'Senior' && emp.role === 'Senior');
    const certsOK = requiredCerts.every(c => emp.certificates?.includes(c));
    
    // Badge check (simplified)
    const badgeValid = emp.badgeExpiry ? new Date(emp.badgeExpiry) > new Date() : false;
    
    if (roleOK) roleMatches++;
    if (certsOK) certMatches++;
    if (!badgeValid) badgeIssues++;

    return {
      id: emp.id,
      name: emp.name,
      roleOK,
      certsOK,
      badgeValid,
      missing: [] as string[]
    };
  });

  const isCompliant = totalAssigned > 0 && roleMatches === totalAssigned && certMatches === totalAssigned && badgeIssues === 0;
  const isPartial = totalAssigned > 0 && !isCompliant;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-apex-gold" /> Compliance Check
        </h3>
        <span className={clsx(
          "px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border",
          isCompliant ? "bg-green-900/20 text-green-500 border-green-900/50" :
          isPartial ? "bg-orange-900/20 text-orange-500 border-orange-900/50" :
          "bg-zinc-800 text-zinc-500 border-zinc-700"
        )}>
          {isCompliant ? 'Volledig Conform' : isPartial ? 'Aandacht Vereist' : 'Geen Data'}
        </span>
      </div>

      <div className="space-y-6">
        {/* Requirements */}
        <div>
           <h4 className="text-xs text-zinc-500 font-bold uppercase mb-3">Vereisten</h4>
           <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1">
                 <ShieldCheck className="w-3 h-3 text-zinc-500" /> Min. Rol: <strong className="text-white">{requiredRole}</strong>
              </span>
              {requiredCerts.map(c => (
                 <span key={c} className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1">
                    <Award className="w-3 h-3 text-zinc-500" /> Cert: <strong className="text-white">{c}</strong>
                 </span>
              ))}
           </div>
        </div>

        {/* Validation List */}
        <div>
           <h4 className="text-xs text-zinc-500 font-bold uppercase mb-3 flex justify-between">
              <span>Validatie per agent</span>
              <span className="text-zinc-400">{totalAssigned} toegewezen</span>
           </h4>
           
           {totalAssigned === 0 ? (
              <div className="text-sm text-zinc-500 italic">Nog geen personeel toegewezen.</div>
           ) : (
              <div className="space-y-2">
                 {employeeValidation.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded border border-zinc-800">
                       <span className="text-sm font-bold text-white">{v.name}</span>
                       <div className="flex gap-2">
                          {!v.roleOK && <span className="text-[10px] bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded border border-red-900/30">ROL</span>}
                          {!v.certsOK && <span className="text-[10px] bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded border border-red-900/30">CERT</span>}
                          {!v.badgeValid && <span className="text-[10px] bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded border border-red-900/30">BADGE</span>}
                          {v.roleOK && v.certsOK && v.badgeValid && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>

        {/* Global Issues */}
        {badgeIssues > 0 && (
           <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/10 p-3 rounded border border-red-900/20">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Er zijn {badgeIssues} medewerkers met een verlopen of ongeldige badge.</span>
           </div>
        )}
      </div>
    </div>
  );
};