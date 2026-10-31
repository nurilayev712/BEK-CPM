import React, { useState, useEffect } from 'react';
import {
  Handshake,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  X,
  ShieldCheck,
  Scale,
  MessageSquare,
  Clock,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveSubTab] = useState('all'); // 'all' or 'disputes'
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);

  // Dispute resolution modal state
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [resolutionAction, setResolutionAction] = useState('complete'); // 'complete' or 'cancel'
  const [resolutionText, setResolutionText] = useState('');
  const [resolving, setResolving] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchDeals();
  }, [activeTab, statusFilter]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const params = {
        status: activeTab === 'disputes' ? 'disputed' : statusFilter,
        search
      };
      const res = await api.get('/deals', { params });
      if (res.success) {
        setDeals(res.data);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDeals();
  };

  const openResolution = (deal) => {
    setSelectedDeal(deal);
    setResolutionText('');
    setResolutionAction('complete');
    setDisputeModalOpen(true);
  };

  const submitDisputeResolution = async (e) => {
    e.preventDefault();
    if (!resolutionText.trim()) {
      addToast('Iltimos, nizo yechimi boʻyicha admin xulosasini kiriting', 'warning');
      return;
    }

    try {
      setResolving(true);
      await api.post(`/deals/${selectedDeal.id}/resolve-dispute`, {
        action: resolutionAction,
        resolution: resolutionText.trim()
      });
      addToast('Nizo muvaffaqiyatli hal qilindi va ikkala tomonga bildirishnoma yuborildi', 'success');
      setDisputeModalOpen(false);
      setSelectedDeal(null);
      fetchDeals();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setResolving(false);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Kutilmoqda</span>;
      case 'payment_sent':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">To'lov yuborildi</span>;
      case 'item_transferred':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Mashina topshirildi</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Yakunlandi</span>;
      case 'disputed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">⚠️ Nizo</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">Bekor qilingan</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const disputedCount = deals.filter(d => d.status === 'disputed').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Navigation */}
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Handshake className="w-6 h-6 text-[#ff5e00]" />
            Escrow Bitimlar va Nizolar Markazi
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Xavfsiz savdo kafolati — barcha operatsiyalar va kelishmovchiliklarni nazorat qilish
          </p>
        </div>

        {/* Sub-tabs switch */}
        <div className="flex items-center gap-2 bg-[#0d1117] p-1.5 rounded-xl border border-[#30363d]">
          <button
            onClick={() => { setActiveSubTab('all'); setStatusFilter('all'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#ff5e00] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Barcha Bitimlar
          </button>
          <button
            onClick={() => setActiveSubTab('disputes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'disputes'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-gray-400 hover:text-rose-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Faol Nizolar</span>
            {disputedCount > 0 && (
              <span className="bg-white text-rose-600 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                {disputedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Bitim kodi (CPM-12345), mashina yoki ism..."
              className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff5e00]"
            />
          </div>
          <button type="submit" className="py-2 px-4 bg-[#ff5e00] hover:bg-orange-600 text-white text-xs font-bold rounded-xl">
            Izlash
          </button>
        </form>

        {activeTab === 'all' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Holat:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-gray-200 focus:outline-none focus:border-[#ff5e00]"
            >
              <option value="all">Barchasi</option>
              <option value="pending">Kutilmoqda</option>
              <option value="payment_sent">To'lov yuborildi</option>
              <option value="item_transferred">Mashina topshirildi</option>
              <option value="completed">Yakunlandi</option>
              <option value="disputed">Nizo</option>
              <option value="cancelled">Bekor</option>
            </select>
          </div>
        )}
      </div>

      {/* Deals Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1117] text-gray-400 uppercase font-semibold border-b border-[#30363d]">
              <tr>
                <th className="py-3.5 px-6">Bitim ID</th>
                <th className="py-3.5 px-6">Mahsulot</th>
                <th className="py-3.5 px-6">Xaridor</th>
                <th className="py-3.5 px-6">Sotuvchi</th>
                <th className="py-3.5 px-6">Narx</th>
                <th className="py-3.5 px-6">Holat</th>
                <th className="py-3.5 px-6">Sana</th>
                <th className="py-3.5 px-6 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    {activeTab === 'disputes' ? "Ajoyib! Hozircha hech qanday nizoli bitim mavjud emas." : "Bitimlar topilmadi"}
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id} className={`transition-colors ${deal.status === 'disputed' ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-[#21262d]'}`}>
                    <td className="py-4 px-6 font-mono font-bold text-[#ff5e00]">#{deal.deal_code}</td>
                    <td className="py-4 px-6 font-semibold max-w-xs truncate">{deal.listing_title}</td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-white">{deal.buyer_name}</p>
                      <p className="text-gray-400 text-[11px]">@{deal.buyer_username || 'no_user'} (⭐ {deal.buyer_rating})</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-white">{deal.seller_name}</p>
                      <p className="text-gray-400 text-[11px]">@{deal.seller_username || 'no_user'} (⭐ {deal.seller_rating})</p>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                      {deal.price.toLocaleString()} {deal.currency}
                    </td>
                    <td className="py-4 px-6">{statusBadge(deal.status)}</td>
                    <td className="py-4 px-6 text-gray-400 whitespace-nowrap">
                      {new Date(deal.created_at).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => setSelectedDeal(deal)}
                        className="py-1.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Tafsilot
                      </button>

                      {deal.status === 'disputed' && (
                        <button
                          onClick={() => openResolution(deal)}
                          className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-md shadow-rose-600/30"
                        >
                          <Scale className="w-3.5 h-3.5" /> Nizo Yechish
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deal Detail Modal */}
      {selectedDeal && !disputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-[#ff5e00]" />
                  Bitim #{selectedDeal.deal_code}
                </h4>
                <p className="text-xs text-gray-400">Mahsulot: {selectedDeal.listing_title}</p>
              </div>
              <button onClick={() => setSelectedDeal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stages overview */}
            <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Bosqichlar Tarixi</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-[#21262d] border border-emerald-500/30 text-emerald-400 font-semibold">
                  1. Bitim ochildi ✅
                </div>
                <div className={`p-2 rounded-lg border font-semibold ${selectedDeal.buyer_confirmed ? 'bg-[#21262d] border-emerald-500/30 text-emerald-400' : 'bg-[#161b22] border-[#30363d] text-gray-500'}`}>
                  2. To'lov qilindi {selectedDeal.buyer_confirmed ? '✅' : '⏳'}
                </div>
                <div className={`p-2 rounded-lg border font-semibold ${selectedDeal.seller_confirmed ? 'bg-[#21262d] border-emerald-500/30 text-emerald-400' : 'bg-[#161b22] border-[#30363d] text-gray-500'}`}>
                  3. Mashina berildi {selectedDeal.seller_confirmed ? '✅' : '⏳'}
                </div>
              </div>
            </div>

            {/* Dispute Callout if any */}
            {selectedDeal.dispute_reason && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
                  <AlertTriangle className="w-4 h-4" /> Nizo sababi:
                </div>
                <p className="text-sm text-gray-200 italic font-medium">"{selectedDeal.dispute_reason}"</p>
                {selectedDeal.dispute_resolution && (
                  <div className="mt-3 pt-3 border-t border-rose-500/20 text-xs text-emerald-400">
                    <b>Admin xulosasi:</b> {selectedDeal.dispute_resolution}
                  </div>
                )}
              </div>
            )}

            {/* Parties info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
                <span className="text-[11px] font-bold uppercase text-gray-400 block mb-1">Xaridor</span>
                <p className="font-bold text-white text-sm">{selectedDeal.buyer_name}</p>
                <p className="text-xs text-gray-400">@{selectedDeal.buyer_username || 'no_user'}</p>
                <p className="text-xs text-orange-400 mt-2">⭐ Reyting: {selectedDeal.buyer_rating} / 5.0</p>
              </div>

              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
                <span className="text-[11px] font-bold uppercase text-gray-400 block mb-1">Sotuvchi</span>
                <p className="font-bold text-white text-sm">{selectedDeal.seller_name}</p>
                <p className="text-xs text-gray-400">@{selectedDeal.seller_username || 'no_user'}</p>
                <p className="text-xs text-orange-400 mt-2">⭐ Reyting: {selectedDeal.seller_rating} / 5.0</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#30363d]">
              <div>
                <span className="text-xs text-gray-400">Savdo summasi:</span>
                <p className="text-lg font-mono font-bold text-emerald-400">
                  {selectedDeal.price.toLocaleString()} {selectedDeal.currency}
                </p>
              </div>

              {selectedDeal.status === 'disputed' && (
                <button
                  onClick={() => openResolution(selectedDeal)}
                  className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30"
                >
                  <Scale className="w-4 h-4" />
                  Nizoni Hal Qilish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {disputeModalOpen && selectedDeal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-rose-500" />
                Nizo bo'yicha Sud (Admin Qarori)
              </h4>
              <button onClick={() => setDisputeModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs space-y-1">
              <p className="text-gray-400">Bitim: <b className="text-white">#{selectedDeal.deal_code}</b></p>
              <p className="text-gray-400">E'tiroz sababi: <i className="text-rose-400">"{selectedDeal.dispute_reason}"</i></p>
            </div>

            <form onSubmit={submitDisputeResolution} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold uppercase mb-2">Qaror turi:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                    resolutionAction === 'complete' ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300' : 'border-[#30363d] text-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="res_action"
                      checked={resolutionAction === 'complete'}
                      onChange={() => setResolutionAction('complete')}
                      className="hidden"
                    />
                    <CheckCircle className="w-4 h-4" />
                    <div>
                      <p className="font-bold text-xs">Savdoni Yakunlash</p>
                      <p className="text-[10px] text-gray-400">Savdo muvaffaqiyatli deb hisoblanadi</p>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                    resolutionAction === 'cancel' ? 'border-rose-500 bg-rose-950/30 text-rose-300' : 'border-[#30363d] text-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="res_action"
                      checked={resolutionAction === 'cancel'}
                      onChange={() => setResolutionAction('cancel')}
                      className="hidden"
                    />
                    <XCircle className="w-4 h-4" />
                    <div>
                      <p className="font-bold text-xs">Bitimni Bekor Qilish</p>
                      <p className="text-[10px] text-gray-400">Mablag' qaytariladi, e'lon faollashadi</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold uppercase mb-2">
                  Admin Xulosasi va Tushuntirish:
                </label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Xaridor va sotuvchiga yuboriladigan yakuniy xulosa matni..."
                  rows={4}
                  className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff5e00]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-gray-800 text-gray-300 font-bold hover:bg-gray-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-600/30 disabled:opacity-50"
                >
                  {resolving ? 'Qaror chiqarilmoqda...' : 'Qarorni Tasdiqlash & Yuborish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
