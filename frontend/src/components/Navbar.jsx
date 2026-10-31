import React from 'react';
import { Bell, Activity, ShieldCheck } from 'lucide-react';

export default function Navbar({ title, subtitle }) {
  const todayStr = new Intl.DateTimeFormat('uz-UZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="h-20 bg-[#161b22] border-b border-[#30363d] px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Live status badge */}
        <div className="flex items-center gap-2 bg-[#21262d] border border-[#30363d] px-3.5 py-1.5 rounded-full text-xs font-medium text-emerald-400 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Activity className="w-3.5 h-3.5" />
          <span>Tizim: Faol</span>
        </div>

        {/* Date */}
        <div className="text-xs text-gray-400 hidden sm:block bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#30363d]">
          📅 {todayStr}
        </div>
      </div>
    </header>
  );
}
