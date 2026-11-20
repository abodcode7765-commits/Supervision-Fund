import React, { useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MinusCircle,
  X,
  AlertTriangle,
} from 'lucide-react';

export function LogoMark({ size = 40, light = false }: { size?: number; light?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl shrink-0 ${
        light
          ? 'bg-white/12 border border-white/20 text-white'
          : 'bg-gradient-to-br from-[#123B70] to-[#2878C8] text-white shadow-sm'
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M16 3L27 7.5V15.5C27 22.3 22.3 27.6 16 29.5C9.7 27.6 5 22.3 5 15.5V7.5L16 3Z"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path
          d="M16 9V22M16 9C13.5 11.2 11.5 11.8 10 12M16 9C18.5 11.2 20.5 11.8 22 12M11.5 16.5H20.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export type StatusTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

export function StatusIndicator({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  const styles: Record<StatusTone, string> = {
    success: 'text-[#16A36A] bg-[#16A36A]/10',
    danger: 'text-[#DC5555] bg-[#DC5555]/10',
    warning: 'text-[#C67B1B] bg-[#E99A35]/14',
    neutral: 'text-[#748399] bg-[#F1F5F9]',
    info: 'text-[#2878C8] bg-[#EAF3FC]',
  };

  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'danger'
        ? AlertCircle
        : tone === 'warning'
          ? Clock
          : MinusCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 ${styles[tone]}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'blue',
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: 'blue' | 'royal' | 'green' | 'red' | 'amber';
}) {
  const accentMap = {
    blue: 'bg-[#EAF3FC] text-[#2878C8]',
    royal: 'bg-[#123B70]/10 text-[#123B70]',
    green: 'bg-[#16A36A]/10 text-[#16A36A]',
    red: 'bg-[#DC5555]/10 text-[#DC5555]',
    amber: 'bg-[#E99A35]/14 text-[#C67B1B]',
  };

  const valueColorMap = {
    blue: 'text-[#172B45]',
    royal: 'text-[#123B70]',
    green: 'text-[#16A36A]',
    red: 'text-[#DC5555]',
    amber: 'text-[#C67B1B]',
  };

  return (
    <div className="h-full bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_1px_3px_rgba(18,59,112,0.04)] hover:border-[#4A90D9]/50 transition-colors duration-150 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-[#748399] truncate">{title}</p>
          <p
            className={`mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular-nums break-words ${valueColorMap[accent]}`}
          >
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-xs text-[#748399] line-clamp-2">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${accentMap[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-2xl font-bold text-[#172B45] leading-snug">{title}</h1>
        <p className="mt-1 text-xs sm:text-sm text-[#748399] leading-relaxed">{description}</p>
      </div>
      {action && (
        <div className="w-full sm:w-auto shrink-0 flex flex-wrap items-center gap-2 sm:gap-2.5">
          {action}
        </div>
      )}
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxW =
    size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#123B70]/45 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxW} max-h-[92vh] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[#172B45]">{title}</h2>
            {subtitle && <p className="text-xs text-[#748399] mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#748399] hover:text-[#172B45] hover:bg-slate-200/60 transition-colors shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  variant = 'danger',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
}) {
  const iconTone =
    variant === 'warning'
      ? 'bg-[#E99A35]/15 text-[#C67B1B]'
      : variant === 'primary'
        ? 'bg-[#EAF3FC] text-[#2878C8]'
        : 'bg-[#DC5555]/10 text-[#DC5555]';

  const btnTone =
    variant === 'warning'
      ? 'bg-[#C67B1B] hover:bg-[#a86613]'
      : variant === 'primary'
        ? 'bg-[#2878C8] hover:bg-[#123B70]'
        : 'bg-[#DC5555] hover:bg-[#c54646]';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconTone}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-[#172B45] leading-relaxed">{message}</p>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 text-sm font-medium text-[#172B45] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`h-10 px-4 text-sm font-semibold text-white rounded-xl transition-colors cursor-pointer ${btnTone}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 py-12 px-5 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EAF3FC] text-[#2878C8] flex items-center justify-center">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="mt-4 text-base font-bold text-[#172B45]">{title}</h3>
      <p className="mt-1.5 text-sm text-[#748399] max-w-md mx-auto leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: { id: number; message: string; type: 'success' | 'info' | 'warning' } | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  const colors =
    toast.type === 'warning'
      ? 'bg-[#172B45] border-[#E99A35]'
      : 'bg-[#123B70] border-[#2878C8]';

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-6 sm:right-auto z-50 max-w-sm no-print">
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-white shadow-lg border-r-4 ${colors}`}
      >
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" />
          <span>{toast.message}</span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-white/70 hover:text-white p-1 shrink-0"
          aria-label="إغلاق الإشعار"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
