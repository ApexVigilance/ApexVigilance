
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shift } from '../../../data/types';
import { MapPin, Clock, Calendar, Moon, AlertTriangle, CheckCircle2, ShieldAlert, Users, Eye, UserPlus, CheckSquare, CircleDashed } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface ShiftCardProps {
  shift: Shift;
  totalSlots: number;
  filledSlots: number;
  isOvernight: boolean;
  complianceStatus: 'CONFORM' | 'PARTIAL' | 'NON_CONFORM';
  openSlots: number;
  pendingCount?: number; // Optional prop for pending applications count
}

export const ShiftCard: React.FC<ShiftCardProps> = ({ 
  shift, 
  totalSlots, 
  filledSlots, 
  isOvernight,
  complianceStatus,
  openSlots,
  pendingCount = 0
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const percentage = Math.round((filledSlots / totalSlots) * 100);
  
  // LOGIC: Determine Visual Status only (Does not change shift.status data)
  const isZeroAssigned = shift.status === 'Scheduled' && filledSlots === 0;
  const isPartial = shift.status === 'Scheduled' && filledSlots > 0 && filledSlots < totalSlots;
  const isFull = shift.status === 'Scheduled' && filledSlots === totalSlots;

  let visualStatus = {
      label: shift.status === 'Scheduled' ? t('shifts.status.open') : shift.status === 'Active' ? 'BEZIG' : 'AFGEROND',
      color: shift.status === 'Active' ? 'text-green-400' : 'text-zinc-400',
      bg: shift.status === 'Active' ? 'bg-green-900/20' : 'bg-zinc-800',
      border: shift.status === 'Active' ? 'border-green-900/50' : 'border-zinc-700',
      bar: shift.status === 'Active' ? 'bg-green-500' : 'bg-zinc-600'
  };

  // Overrides for Planning View
  if (shift.status === 'Scheduled') {
      if (isFull) {
          visualStatus = { label: t('shifts.status.full'), color: 'text-green-500', bg: 'bg-green-900/20', border: 'border-green-900/50', bar: 'bg-green-500' };
      } else if (isZeroAssigned) {
          visualStatus = { label: t('shifts.status.open'), color: 'text-yellow-500', bg: 'bg-yellow-900/20', border: 'border-yellow-900/50', bar: 'bg-yellow-500' };
      } else if (isPartial) {
          visualStatus = { label: t('shifts.status.open'), color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-900/50', bar: 'bg-orange-500' };
      }
  }

  const complianceConfig = {
    'CONFORM': { label: t('compliance.compliant'), color: 'text-green-500', icon: CheckCircle2, bar: 'bg-green-500' },
    'PARTIAL': { label: t('compliance.partial'), color: 'text-orange-500', icon: AlertTriangle, bar: 'bg-orange-500' },
    'NON_CONFORM': { label: t('compliance.nonCompliant'), color: 'text-red-500', icon: ShieldAlert, bar: 'bg-red-500' }
  }[complianceStatus];

  const ComplianceIcon = complianceConfig.icon;

  const handleAction = (e: React.MouseEvent, tab: string) => {
    e.stopPropagation();
    navigate(`/shifts/${shift.id}`, { state: { tab } });
  };

  return (
    <div 
      onClick={() => navigate(`/shifts/${shift.id}`, { state: { tab: 'details' } })}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-apex-gold hover:shadow-lg hover:shadow-apex-gold/5 transition-all group relative overflow-hidden flex flex-col h-full"
    >
      {/* Status Strip */}
      <div className={clsx("absolute top-0 left-0 bottom-0 w-1", visualStatus.bar)} />

      {/* Header */}
      <div className="pl-3 mb-3 flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-bold text-white text-lg group-hover:text-apex-gold transition-colors truncate">
            {shift.clientName}
          </h3>
          <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 truncate">
             <MapPin className="w-3 h-3 shrink-0" /> {shift.location}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
            <span className={clsx("text-[10px] font-bold uppercase px-2 py-1 rounded border whitespace-nowrap", visualStatus.color, visualStatus.bg, visualStatus.border)}>
              {visualStatus.label}
            </span>
            {/* Pending Badge */}
            {pendingCount > 0 && shift.status !== 'Completed' && (
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded border whitespace-nowrap bg-red-500 text-white border-red-600 animate-pulse shadow-md shadow-red-900/20">
                    {pendingCount} Aanvragen
                </span>
            )}
        </div>
      </div>

      {/* Date & Time */}
      <div className="pl-3 mb-4 space-y-1.5 flex-1">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
           <Calendar className="w-4 h-4 text-zinc-500" />
           <span>{new Date(shift.startTime).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-300">
           <Clock className="w-4 h-4 text-zinc-500" />
           <span className="font-mono">
              {new Date(shift.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
              {new Date(shift.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
           </span>
           {isOvernight && <Moon className="w-3 h-3 text-blue-400" />}
        </div>
      </div>

      {/* Compliance Bar */}
      <div className="pl-3 mb-4">
        {filledSlots > 0 ? (
            <div className="flex justify-between items-center mb-1">
               <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <ComplianceIcon className={clsx("w-3 h-3", complianceConfig.color)} />
                  <span className={complianceConfig.color}>{complianceConfig.label}</span>
               </div>
            </div>
        ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 text-zinc-500">
                <CircleDashed className="w-3 h-3" /> Nog geen personeel
            </div>
        )}
        
        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
           <div className={clsx("h-full rounded-full", filledSlots > 0 ? complianceConfig.bar : 'bg-zinc-700')} style={{ width: '100%' }} />
        </div>
      </div>

      {/* Capacity & Action */}
      <div className="pl-3 mt-auto pt-3 border-t border-zinc-800">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Users className="w-3 h-3" />
                <span className="font-mono text-white font-bold">{filledSlots}/{totalSlots}</span>
                <span>•</span>
                <span className={clsx("font-bold", openSlots > 0 ? "text-apex-gold" : "text-zinc-500")}>
                    {openSlots} OPEN
                </span>
            </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-4 relative">
           <div 
              className={clsx("h-full rounded-full transition-all duration-500", 
                 percentage === 100 ? "bg-green-500" : percentage >= 50 ? "bg-orange-500" : "bg-apex-gold"
              )} 
              style={{ width: `${percentage}%` }}
           />
        </div>

        {/* Contextual Action Button */}
        {shift.status === 'Active' ? (
             <button 
                onClick={(e) => handleAction(e, 'live')}
                className="w-full bg-green-900/20 hover:bg-green-900/40 text-green-500 border border-green-900/50 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors"
             >
                <Eye className="w-3 h-3" /> LIVE VIEW
             </button>
        ) : shift.status === 'Completed' ? (
             <button 
                onClick={(e) => handleAction(e, 'details')}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors"
             >
                <CheckSquare className="w-3 h-3" /> DETAILS
             </button>
        ) : (
             <button 
                onClick={(e) => handleAction(e, 'aanmeldingen')}
                className="w-full bg-apex-gold hover:bg-yellow-500 text-black border border-yellow-600 text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors"
             >
                <UserPlus className="w-3 h-3" /> 
                {pendingCount > 0 ? `AANVRAGEN (${pendingCount})` : 'AANMELDINGEN'}
             </button>
        )}
      </div>
    </div>
  );
};
