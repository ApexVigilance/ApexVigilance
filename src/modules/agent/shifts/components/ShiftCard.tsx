import React from 'react';
import { MapPin, Clock, Calendar, ChevronRight, CheckCircle2, User, HelpCircle, XCircle, Play } from 'lucide-react';
import clsx from 'clsx';
import { Shift, ApplicationStatus } from '../../../../data/types';
import { useTranslation } from 'react-i18next';

interface AgentShiftCardProps {
  shift: Shift;
  variant: 'MINE' | 'APPLICATION' | 'OPEN';
  applicationStatus?: ApplicationStatus;
  applicationNote?: string;
  onClick: () => void;
  openSlots?: number;
}

export const ShiftCard: React.FC<AgentShiftCardProps> = ({ 
  shift, 
  variant, 
  applicationStatus, 
  applicationNote,
  onClick, 
  openSlots = 0 
}) => {
  const { t } = useTranslation();
  const start = new Date(shift.startTime);
  const end = new Date(shift.endTime);
  const isToday = new Date().toDateString() === start.toDateString();

  const getStatusBadge = () => {
    if (variant === 'MINE') {
      return (
        <span className="bg-green-900/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-900/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> MIJN SHIFT
        </span>
      );
    }
    if (variant === 'OPEN') {
      return (
        <span className="bg-blue-900/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded border border-blue-900/30 flex items-center gap-1">
           <User className="w-3 h-3" /> {openSlots > 0 ? `${openSlots} VRIJ` : 'OPEN'}
        </span>
      );
    }
    if (variant === 'APPLICATION') {
      if (applicationStatus === 'PENDING') {
        return (
          <span className="bg-yellow-900/20 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded border border-yellow-900/30 flex items-center gap-1">
             <HelpCircle className="w-3 h-3" /> {t('shifts.status.pending')}
          </span>
        );
      }
      if (applicationStatus === 'REJECTED') {
        return (
          <span className="bg-red-900/20 text-red-500 text-[10px] font-bold px-2 py-1 rounded border border-red-900/30 flex items-center gap-1">
             <XCircle className="w-3 h-3" /> {t('shifts.status.rejected')}
          </span>
        );
      }
      if (applicationStatus === 'APPROVED') {
        return (
          <span className="bg-green-900/20 text-green-500 text-[10px] font-bold px-2 py-1 rounded border border-green-900/30 flex items-center gap-1">
             <CheckCircle2 className="w-3 h-3" /> {t('shifts.status.approved')}
          </span>
        );
      }
      if (applicationStatus === 'WITHDRAWN') {
        return (
          <span className="bg-zinc-800 text-zinc-500 text-[10px] font-bold px-2 py-1 rounded border border-zinc-700 flex items-center gap-1">
             <XCircle className="w-3 h-3" /> {t('shifts.status.withdrawn')}
          </span>
        );
      }
    }
    return null;
  };

  return (
    <div 
      onClick={onClick}
      className={clsx(
        "relative overflow-hidden rounded-xl border p-4 transition-all active:scale-[0.98] cursor-pointer bg-zinc-900/50 backdrop-blur-sm group",
        variant === 'MINE' ? "border-green-500/30 hover:border-green-500/50" : 
        (variant === 'APPLICATION' && applicationStatus === 'REJECTED') ? "border-red-900/50 hover:border-red-500/50" :
        "border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:shadow-apex-gold/5"
      )}
    >
      {/* Status Strip */}
      <div className={clsx(
        "absolute left-0 top-0 bottom-0 w-1",
        variant === 'MINE' ? "bg-green-500" : 
        variant === 'APPLICATION' && applicationStatus === 'PENDING' ? "bg-yellow-500" :
        variant === 'APPLICATION' && applicationStatus === 'REJECTED' ? "bg-red-500" :
        "bg-blue-500"
      )} />

      <div className="pl-3 flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="font-bold text-white text-lg leading-tight mb-1 truncate group-hover:text-apex-gold transition-colors">{shift.clientName}</h4>
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{shift.location}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {getStatusBadge()}
        </div>
      </div>

      <div className="pl-3 flex items-center gap-3 text-sm mt-3">
        <div className={clsx("flex items-center gap-1.5 font-mono text-xs", isToday ? "text-white font-bold" : "text-zinc-400")}>
          <Calendar className="w-3.5 h-3.5" />
          <span>{start.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-xs bg-zinc-950/50 px-2 py-1 rounded border border-zinc-800">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>{start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
      </div>

      {variant === 'APPLICATION' && applicationStatus === 'REJECTED' && applicationNote && (
         <div className="mt-3 pl-3 text-xs text-red-400 italic">
            "{applicationNote}"
         </div>
      )}

      {variant === 'MINE' && isToday && (
         <div className="absolute right-3 bottom-3 animate-pulse">
            <Play className="w-8 h-8 text-green-500 fill-current opacity-20" />
         </div>
      )}

      <ChevronRight className="absolute right-4 bottom-4 w-5 h-5 text-zinc-600 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </div>
  );
};