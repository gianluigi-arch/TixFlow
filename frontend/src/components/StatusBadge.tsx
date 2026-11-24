import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Ticket,
  UserCheck,
} from 'lucide-react';
import type { Role, TicketStatus } from '@/types/api';

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  if (status === 'VALID') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Tiket Valid
      </span>
    );
  }

  if (status === 'USED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Sudah Check-in
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800">
      <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Dibatalkan
    </span>
  );
}

export function QuotaBadge({
  remainingQuota,
  totalQuota,
}: {
  remainingQuota: number;
  totalQuota: number;
}) {
  if (remainingQuota <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800">
        <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Kuota Habis
      </span>
    );
  }

  const ratio = totalQuota > 0 ? remainingQuota / totalQuota : 0;
  if (remainingQuota <= 5 || ratio <= 0.2) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Sisa {remainingQuota} tiket
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
      <Ticket className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Tersedia ({remainingQuota})
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  if (role === 'PANITIA') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        PANITIA
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
      <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      PARTICIPANT
    </span>
  );
}
