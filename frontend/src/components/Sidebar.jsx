import React from 'react';
import {
  LayoutDashboard,
  Car,
  Handshake,
  Gem,
  Users,
  FolderTree,
  Send,
  FileSpreadsheet,
  LogOut,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, disputedCount = 0, topupPendingCount = 0 }) {
  const { admin, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
    { id: 'topup', label: 'Donat & Pul Solish', icon: Gem, badge: topupPendingCount, badgeColor: 'bg-cyan-500' },
    { id: 'listings', label: "E'lonlar", icon: Car },
    { id: 'deals', label: 'Bitimlar & Nizolar', icon: Handshake, badge: disputedCount, badgeColor: 'bg-rose-500' },
    { id: 'users', label: 'Foydalanuvchilar', icon: Users },
    { id: 'categories', label: 'Kategoriyalar', icon: FolderTree },
    { id: 'broadcast', label: 'Broadcast', icon: Send },
    { id: 'reports', label: 'Hisobot & Loglar', icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col justify-between shrink-0 min-h-screen">
      {/* Brand header */}
      <div>
        <div className="p-6 border-b border-[#30363d] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5e00] to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wider text-white flex items-center gap-1.5">
              CPM <span className="text-[#ff5e00]">MARKET</span>
            </h1>
            <p className="text-xs text-gray-400 font-medium">Boshqaruv Paneli</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ff5e00] to-orange-600 text-white shadow-lg shadow-orange-600/30 font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-[#21262d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`${item.badgeColor || 'bg-rose-500'} text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-md`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin profile and logout */}
      <div className="p-4 border-t border-[#30363d]">
        <div className="bg-[#21262d] p-3 rounded-xl mb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-500/20 text-[#ff5e00] font-bold flex items-center justify-center border border-orange-500/30">
            {admin?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{admin?.full_name || 'Admin'}</p>
            <p className="text-xs text-orange-400 font-mono">@{admin?.username} ({admin?.role})</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
