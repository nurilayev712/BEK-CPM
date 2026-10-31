import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Send,
  Star,
  Eye,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Direct Message Modal
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [directMessage, setDirectMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // User Profile Detail Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', {
        params: {
          page: pagination.page,
          limit: 15,
          search,
          status: statusFilter
        }
      });
      if (res.success) {
        setUsers(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchUsers();
  };

  const toggleBan = async (user) => {
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    const confirmMsg = newStatus === 'banned'
      ? `Haqiqatan ham @${user.username || user.telegram_id} ni bloklamoqchimisiz?`
      : `Foydalanuvchi blokdan chiqarilsinmi?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/users/${user.id}/status`, { status: newStatus });
      addToast(`Foydalanuvchi holati '${newStatus}' ga o'zgartirildi`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openDirectMessage = (user) => {
    setSelectedUser(user);
    setDirectMessage('');
    setMessageModalOpen(true);
  };

  const sendDirectMsg = async (e) => {
    e.preventDefault();
    if (!directMessage.trim()) return;

    try {
      setSendingMessage(true);
      await api.post(`/users/${selectedUser.id}/message`, { message: directMessage.trim() });
      addToast(`Xabar @${selectedUser.username || selectedUser.telegram_id} ga Telegram orqali yuborildi!`, 'success');
      setMessageModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const openUserProfile = async (userId) => {
    try {
      setLoadingProfile(true);
      setProfileModalOpen(true);
      const res = await api.get(`/users/${userId}`);
      if (res.success) {
        setProfileData(res.data);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Search */}
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-[#ff5e00]" />
            Foydalanuvchilar Boshqaruvi
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            CPM Market botining barcha o'yinchilari va ishtirokchilari ({pagination.total} ta)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism, @username yoki Telegram ID..."
              className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff5e00]"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#ff5e00]"
          >
            <option value="all">Barcha foydalanuvchilar</option>
            <option value="active">Faollar</option>
            <option value="banned">Bloklanganlar</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1117] text-gray-400 uppercase font-semibold border-b border-[#30363d]">
              <tr>
                <th className="py-3.5 px-6">ID & Foydalanuvchi</th>
                <th className="py-3.5 px-6">Telegram ID</th>
                <th className="py-3.5 px-6">Reyting</th>
                <th className="py-3.5 px-6">Savdolar</th>
                <th className="py-3.5 px-6">E'lonlar</th>
                <th className="py-3.5 px-6">Holat</th>
                <th className="py-3.5 px-6">Sana</th>
                <th className="py-3.5 px-6 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#21262d] transition-colors">
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 font-bold flex items-center justify-center text-xs">
                          {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{user.first_name || 'Nomaʼlum'}</p>
                          <p className="text-gray-400 text-[11px]">@{user.username || 'username_yoq'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-gray-300">
                      <code>{user.telegram_id}</code>
                    </td>

                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{user.rating.toFixed(1)}</span>
                        <span className="text-gray-500 text-[10px] font-normal">({user.reviews_count})</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-mono font-bold text-purple-400">
                      {user.deals_count} ta
                    </td>

                    <td className="py-3.5 px-6 font-mono font-bold text-cyan-400">
                      {user.listings_count} ta
                    </td>

                    <td className="py-3.5 px-6 whitespace-nowrap">
                      {user.status === 'active' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Faol
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Bloklangan
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-gray-400 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString('uz-UZ')}
                    </td>

                    <td className="py-3.5 px-6 text-right whitespace-nowrap space-x-1.5">
                      {/* View Profile */}
                      <button
                        onClick={() => openUserProfile(user.id)}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
                        title="Profilni ko'rish"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Direct Telegram Message */}
                      <button
                        onClick={() => openDirectMessage(user)}
                        className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-blue-400 border border-blue-500/30 transition-colors"
                        title="Telegram botdan xabar jo'natish"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                      {/* Ban / Unban */}
                      <button
                        onClick={() => toggleBan(user)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          user.status === 'active'
                            ? 'bg-rose-950/50 hover:bg-rose-900 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-950/50 hover:bg-emerald-900 text-emerald-400 border-emerald-500/30'
                        }`}
                        title={user.status === 'active' ? 'Bloklash' : 'Blokdan chiqarish'}
                      >
                        {user.status === 'active' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-[#30363d] flex items-center justify-between text-xs text-gray-400">
            <span>
              Jami {pagination.total} tadan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-2 bg-[#0d1117] border border-[#30363d] rounded-lg disabled:opacity-30 hover:border-orange-500 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white px-2">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-2 bg-[#0d1117] border border-[#30363d] rounded-lg disabled:opacity-30 hover:border-orange-500 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Direct Telegram Message Modal */}
      {messageModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                Foydalanuvchiga Xabar Yuborish
              </h4>
              <button onClick={() => setMessageModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] text-xs">
              <p className="text-gray-400">Qabul qiluvchi: <b className="text-white">{selectedUser.first_name}</b> (@{selectedUser.username || 'username_yoq'})</p>
              <p className="text-gray-400">Telegram ID: <code className="text-orange-400">{selectedUser.telegram_id}</code></p>
            </div>

            <form onSubmit={sendDirectMsg} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold uppercase mb-2">Xabar matni:</label>
                <textarea
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="Xabarni yozing (Telegram bot orqali yetkaziladi)..."
                  rows={4}
                  className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setMessageModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-gray-800 text-gray-300 font-bold hover:bg-gray-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {sendingMessage ? 'Yuborilmoqda...' : 'Telegramga Joʻnatish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Full Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h4 className="text-base font-bold text-white">Foydalanuvchi Profili va Tarixi</h4>
              <button onClick={() => setProfileModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingProfile || !profileData ? (
              <div className="py-12 text-center text-gray-400">
                <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* User stats overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Ismi</span>
                    <span className="font-bold text-white text-sm">{profileData.user.first_name}</span>
                  </div>
                  <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Reyting</span>
                    <span className="font-bold text-amber-400 text-sm">⭐ {profileData.user.rating.toFixed(1)}</span>
                  </div>
                  <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Savdolar</span>
                    <span className="font-bold text-purple-400 text-sm">{profileData.user.deals_count} ta</span>
                  </div>
                  <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Holat</span>
                    <span className={`font-bold text-sm ${profileData.user.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {profileData.user.status}
                    </span>
                  </div>
                </div>

                {/* User Listings */}
                <div>
                  <h5 className="font-bold text-white uppercase tracking-wider mb-2">E'lonlari ({profileData.listings.length} ta):</h5>
                  {profileData.listings.length === 0 ? (
                    <p className="text-gray-500 italic">E'lonlar yo'q</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {profileData.listings.map((l) => (
                        <div key={l.id} className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-between">
                          <span className="font-medium text-white">{l.title}</span>
                          <span className="font-mono text-emerald-400 font-bold">{l.price.toLocaleString()} {l.currency} ({l.status})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Reviews */}
                <div>
                  <h5 className="font-bold text-white uppercase tracking-wider mb-2">Qoldirilgan Sharhlar ({profileData.reviews.length} ta):</h5>
                  {profileData.reviews.length === 0 ? (
                    <p className="text-gray-500 italic">Hali sharhlar yo'q</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {profileData.reviews.map((r) => (
                        <div key={r.id} className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white">{r.first_name} (@{r.username || 'user'})</span>
                            <span className="text-amber-400 font-bold">⭐ {r.score}/5</span>
                          </div>
                          <p className="text-gray-300 italic">{r.comment || 'Izohsiz'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
