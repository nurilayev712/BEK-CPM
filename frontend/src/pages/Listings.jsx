import React, { useState, useEffect } from 'react';
import {
  Car,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  Star,
  Eye,
  ExternalLink,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVip, setSelectedVip] = useState('');

  // Detail Modal
  const [selectedListing, setSelectedListing] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { addToast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchListings();
  }, [pagination.page, selectedCat, selectedStatus, selectedVip]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 15,
        search,
        category_id: selectedCat,
        status: selectedStatus,
        is_vip: selectedVip
      };
      const res = await api.get('/listings', { params });
      if (res.success) {
        setListings(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchListings();
  };

  const handleStatusChange = async (id, newStatus, reason = '') => {
    try {
      await api.patch(`/listings/${id}/status`, { status: newStatus, reason });
      addToast(`E'lon holati '${newStatus}' ga o'zgartirildi`, 'success');
      fetchListings();
      if (selectedListing && selectedListing.id === id) {
        setSelectedListing(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleToggleVip = async (id) => {
    try {
      const res = await api.post(`/listings/${id}/vip`, { days: 7 });
      addToast(res.message, 'success');
      fetchListings();
      if (selectedListing && selectedListing.id === id) {
        setSelectedListing(prev => ({ ...prev, is_vip: res.is_vip }));
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Haqiqatan ham ushbu e'lonni butunlay o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/listings/${id}`);
      addToast("E'lon o'chirildi", 'success');
      setSelectedListing(null);
      fetchListings();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Faol</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Tekshiruvda</span>;
      case 'sold':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Sotilgan</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Rad etilgan</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Filters Card */}
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Car className="w-6 h-6 text-[#ff5e00]" />
              E'lonlar Boshqaruvi
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Barcha foydalanuvchilar tomonidan joylashtirilgan Car Parking Multiplayer e'lonlari ({pagination.total} ta)
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nomi yoki tavsifi bo'yicha..."
                className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff5e00]"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-4 bg-[#ff5e00] hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Qidirish
            </button>
          </form>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#30363d] text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtr:</span>
          </div>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-gray-200 focus:outline-none focus:border-[#ff5e00]"
          >
            <option value="all">Barcha holatlar</option>
            <option value="active">Faol</option>
            <option value="pending">Tekshiruvda</option>
            <option value="sold">Sotilgan</option>
            <option value="rejected">Rad etilgan</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCat}
            onChange={(e) => { setSelectedCat(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-gray-200 focus:outline-none focus:border-[#ff5e00]"
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name_uz}</option>
            ))}
          </select>

          {/* VIP filter */}
          <select
            value={selectedVip}
            onChange={(e) => { setSelectedVip(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-gray-200 focus:outline-none focus:border-[#ff5e00]"
          >
            <option value="">Hammasi (Oddiy + VIP)</option>
            <option value="1">Faqat VIP ⭐</option>
            <option value="0">Oddiy</option>
          </select>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1117] text-gray-400 uppercase font-semibold border-b border-[#30363d]">
              <tr>
                <th className="py-3.5 px-6">ID & Rasm</th>
                <th className="py-3.5 px-6">Mashina / Nomi</th>
                <th className="py-3.5 px-6">Kategoriya</th>
                <th className="py-3.5 px-6">Narx</th>
                <th className="py-3.5 px-6">Sotuvchi</th>
                <th className="py-3.5 px-6">VIP / Ko'rishlar</th>
                <th className="py-3.5 px-6">Holat</th>
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
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    Hech qanday e'lon topilmadi
                  </td>
                </tr>
              ) : (
                listings.map((item) => (
                  <tr key={item.id} className="hover:bg-[#21262d] transition-colors">
                    <td className="py-3 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-gray-400">#{item.id}</span>
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-[#0d1117] border border-[#30363d] flex-shrink-0">
                          {item.images && item.images.length > 0 && item.images[0].startsWith('http') ? (
                            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">
                              {item.category_icon || '🚗'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-6 max-w-xs">
                      <p className="font-bold text-white truncate">{item.title}</p>
                      <p className="text-gray-400 text-[11px] truncate">{item.description}</p>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>{item.category_icon}</span>
                        <span>{item.category_name_uz}</span>
                      </span>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap font-mono font-bold text-emerald-400">
                      {item.price.toLocaleString()} {item.currency}
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <p className="font-semibold text-white">{item.seller_name}</p>
                      <p className="text-gray-400 text-[11px]">@{item.seller_username || 'no_user'} (⭐ {item.seller_rating})</p>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {item.is_vip ? (
                          <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-300" /> VIP
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Oddiy</span>
                        )}
                        <span className="text-gray-400 font-mono text-[11px]">👁️ {item.views_count}</span>
                      </div>
                    </td>

                    <td className="py-3 px-6 whitespace-nowrap">
                      {statusBadge(item.status)}
                    </td>

                    <td className="py-3 px-6 text-right whitespace-nowrap space-x-1.5">
                      {/* View details */}
                      <button
                        onClick={() => { setSelectedListing(item); setActiveImageIndex(0); }}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                        title="Batafsil ko'rish"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Approve */}
                      {item.status !== 'active' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'active')}
                          className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30 transition-colors"
                          title="Faollashtirish"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* VIP toggle */}
                      <button
                        onClick={() => handleToggleVip(item.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          item.is_vip
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-700'
                        }`}
                        title={item.is_vip ? "VIP ni o'chirish" : "VIP ga ko'tarish"}
                      >
                        <Star className={`w-4 h-4 ${item.is_vip ? 'fill-amber-300' : ''}`} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-400 border border-rose-500/30 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
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
              Jami {pagination.total} tadan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} ko'rsatilmoqda
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

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#30363d] flex items-center justify-between sticky top-0 bg-[#161b22] z-10">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-[#ff5e00]">#{selectedListing.id}</span>
                <h4 className="text-lg font-bold text-white">{selectedListing.title}</h4>
                {selectedListing.is_vip ? (
                  <span className="bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-300" /> VIP
                  </span>
                ) : null}
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Images preview gallery */}
              {selectedListing.images && selectedListing.images.length > 0 && selectedListing.images[0].startsWith('http') && (
                <div className="space-y-3">
                  <div className="w-full h-80 rounded-xl overflow-hidden bg-[#0d1117] border border-[#30363d]">
                    <img
                      src={selectedListing.images[activeImageIndex]}
                      alt="Listing main"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {selectedListing.images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {selectedListing.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIndex(i)}
                          className={`w-16 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                            activeImageIndex === i ? 'border-[#ff5e00]' : 'border-[#30363d] opacity-60'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Price & Category info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
                <div>
                  <span className="text-[11px] text-gray-400 block font-semibold uppercase">Narxi</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    {selectedListing.price.toLocaleString()} {selectedListing.currency}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 block font-semibold uppercase">Kategoriya</span>
                  <span className="text-sm font-semibold text-white">
                    {selectedListing.category_name_uz}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 block font-semibold uppercase">Holat</span>
                  <div className="mt-0.5">{statusBadge(selectedListing.status)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 block font-semibold uppercase">Ko'rishlar</span>
                  <span className="text-sm font-mono font-bold text-cyan-400">
                    👁️ {selectedListing.views_count}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Tavsif:</h5>
                <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {selectedListing.description}
                </div>
              </div>

              {/* Tags */}
              {selectedListing.tags && selectedListing.tags.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Teglar:</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-[#21262d] border border-[#30363d] text-xs font-mono text-orange-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Seller details */}
              <div className="p-4 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-between">
                <div>
                  <h6 className="text-xs font-bold text-white">Sotuvchi: {selectedListing.seller_name}</h6>
                  <p className="text-xs text-gray-400">
                    Telegram: @{selectedListing.seller_username || 'nomaʼlum'} | Reyting: ⭐ {selectedListing.seller_rating} | Savdolar: {selectedListing.seller_deals} ta
                  </p>
                </div>
                {selectedListing.seller_username && (
                  <a
                    href={`https://t.me/${selectedListing.seller_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-semibold flex items-center gap-1 border border-blue-500/30"
                  >
                    Profil <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-[#30363d] flex items-center justify-between bg-[#161b22]">
              <button
                onClick={() => handleDelete(selectedListing.id)}
                className="py-2 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                E'lonni o'chirish
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleVip(selectedListing.id)}
                  className="py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5"
                >
                  <Star className="w-4 h-4" />
                  {selectedListing.is_vip ? "VIP ni bekor qilish" : "VIP maqomini berish"}
                </button>

                {selectedListing.status !== 'active' ? (
                  <button
                    onClick={() => handleStatusChange(selectedListing.id, 'active')}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Tasdiqlash & Faollashtirish
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(selectedListing.id, 'rejected', "Admin tomonidan to'xtatildi")}
                    className="py-2 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    To'xtatish (Rad etish)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
