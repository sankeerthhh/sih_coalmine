import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb: string;
  icon?: React.ReactNode;
  onBack?: () => void;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumb,
  icon,
  onBack,
  action
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 hover:text-blue-600 transition font-medium cursor-pointer"
          >
            <Home className="w-3 h-3" />
            <span>Dashboard</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-800">{breadcrumb}</span>
        </div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {action}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition cursor-pointer border border-slate-300 shadow-2xs active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>
    </div>
  );
};
