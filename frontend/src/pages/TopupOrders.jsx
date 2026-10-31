import React, { useState, useEffect } from 'react';
import {
  Gem,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  CreditCard,
  Settings,
  Plus,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function TopupOrders() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'services', 'payment_settings'
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Receipt Preview Modal
  const [previewReceipt, setPreviewReceipt] = useState(null);

  // Reject Order Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Payment Credentials Form
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardHolder: '',
    bankName: ''
  });

  // Service Edit/Create Modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    title_uz: '',
    title_ru: '',
    description_uz: '',
    description_ru: '',
    price: 0,
    currency: 'UZS',
    type: 'cpm_money',
    badge: ''
  });

  const { addToast } = useToast();

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'services') fetchServices();
    if (activeTab === 'payment_settings') fetchPaymentDetails();
  }, [activeTab, pagination.page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/topup/orders', {
        params: {
          page: pagination.page,
          limit: 15,
          status: statusFilter,
          search
        }
      });
      if (res.success) {
        setOrders(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/topup/services');
      if (res.success) setServices(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get('/topup/payment-details');
      if (res.success) setPaymentForm(res.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status, admin_note = '') => {
    try {
      await api.patch(`/topup/orders/${id}/status`, { status, admin_note });
      addToast(`Buyurtma '${status}' deb belgilandi va foydalanuvchiga Telegramda xabar berildi`, 'success');
      fetchOrders();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    try {
      await api.post('/topup/payment-details', paymentForm);
      addToast('Toʻlov rekvizitlari muvaffaqiyatli saqlandi!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.put(`/topup/services/${editingService.id}`, serviceForm);
        addToast('Xizmat yangilandi', 'success');
      } else {
        await api.post('/topup/services', serviceForm);
        addToast('Yangi xizmat qoʻshildi', 'success');
      }
      setServiceModalOpen(false);
      fetchServices();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Xizmatni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/topup/services/${id}`);
      addToast("Xizmat o'chirildi", 'success');
      fetchServices();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">⏳ Kutilmoqda</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✅ Bajarildi</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">❌ Rad etilgan</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Tab Switch */}
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Gem className="w-6 h-6 text-cyan-400" />
            CPM Chin Pul & Donat Solish Xizmatlari
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            50.000.000$ o'yin puli, Coins, barcha pullik mashinalarni ochish va donat buyurtmalari boshqaruvi
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0d1117] p-1.5 rounded-xl border border-[#30363d]">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'orders' ? 'bg-[#ff5e00] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Buyurtmalar
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'services' ? 'bg-[#ff5e00] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Xizmatlar Narxlari
          </button>
          <button
            onClick={() => setActiveTab('payment_settings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'payment_settings' ? 'bg-[#ff5e00] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            To'lov Rekvizitlari
          </button>
        </div>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <form onSubmit={(e) => { e.preventDefault(); fetchOrders(); }} className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buyurtma kodi (DONAT-1234), o'yin ID yoki ism..."
                  className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff5e00]"
                />
              </div>
              <button type="submit" className="py-2 px-4 bg-[#ff5e00] hover:bg-orange-600 text-white text-xs font-bold rounded-xl">
                Izlash
              </button>
            </form>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Holat:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-gray-200 focus:outline-none focus:border-[#ff5e00]"
              >
                <option value="all">Barcha buyurtmalar</option>
                <option value="pending">Kutilmoqda (Yangi)</option>
                <option value="completed">Bajarilgan</option>
                <option value="rejected">Rad etilgan</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d1117] text-gray-400 uppercase font-semibold border-b border-[#30363d]">
                  <tr>
                    <th className="py-3.5 px-6">Buyurtma</th>
                    <th className="py-3.5 px-6">Xaridor</th>
                    <th className="py-3.5 px-6">Xizmat Nomi</th>
                    <th className="py-3.5 px-6">O'yin ID / Pochta</th>
                    <th className="py-3.5 px-6">Narx</th>
                    <th className="py-3.5 px-6">Chek</th>
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
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-gray-500">
                        Hozircha donat buyurtmalari yo'q
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#21262d] transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-cyan-400">#{o.order_code}</td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-white">{o.first_name}</p>
                          <p className="text-gray-400 text-[11px]">@{o.username || o.telegram_id}</p>
                        </td>
                        <td className="py-4 px-6 font-semibold text-white">{o.service_title_uz}</td>
                        <td className="py-4 px-6">
                          <code className="px-2 py-1 rounded bg-[#0d1117] border border-[#30363d] font-mono text-orange-400 font-bold">
                            {o.game_id}
                          </code>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                          {o.price.toLocaleString()} {o.currency}
                        </td>
                        <td className="py-4 px-6">
                          {o.receipt_image ? (
                            <button
                              onClick={() => setPreviewReceipt(o.receipt_image)}
                              className="px-2.5 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-bold flex items-center gap-1 border border-blue-500/30"
                            >
                              <Eye className="w-3.5 h-3.5" /> Chekni ko'rish
                            </button>
                          ) : (
                            <span className="text-gray-500 italic">Chek yo'q</span>
                          )}
                        </td>
                        <td className="py-4 px-6">{statusBadge(o.status)}</td>
                        <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                          {o.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(o.id, 'completed')}
                                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-md shadow-emerald-600/20"
                                title="Akkauntga pul solindi, yakunlash"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Bajarildi
                              </button>
                              <button
                                onClick={() => { setOrderToReject(o); setRejectReason(''); setRejectModalOpen(true); }}
                                className="py-1.5 px-3 bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                                title="Rad etish"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Rad etish
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES MANAGEMENT */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-white">Barcha Donat & Pul Xizmatlari</h4>
            <button
              onClick={() => {
                setEditingService(null);
                setServiceForm({
                  title_uz: '',
                  title_ru: '',
                  description_uz: '',
                  description_ru: '',
                  price: 15000,
                  currency: 'UZS',
                  type: 'cpm_money',
                  badge: 'YANGI'
                });
                setServiceModalOpen(true);
              }}
              className="py-2.5 px-4 bg-[#ff5e00] hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Yangi Xizmat Qo'shish
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <div key={s.id} className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl shadow-xl flex flex-col justify-between hover:border-cyan-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {s.badge ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-orange-500/20 text-[#ff5e00] border border-orange-500/30">
                        {s.badge}
                      </span>
                    ) : <span />}
                    <span className="font-mono text-xs text-gray-500">#{s.id}</span>
                  </div>

                  <h5 className="font-bold text-white text-base">{s.title_uz}</h5>
                  <p className="text-gray-400 text-xs mt-1">{s.description_uz}</p>

                  <div className="mt-4 pt-3 border-t border-[#30363d] flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase font-bold">Narxi:</span>
                    <span className="text-base font-mono font-extrabold text-emerald-400">
                      {s.price.toLocaleString()} {s.currency}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#30363d] mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingService(s);
                      setServiceForm({ ...s });
                      setServiceModalOpen(true);
                    }}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200"
                    title="Tahrirlash"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="p-2 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-400 border border-rose-500/30"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT CREDENTIALS */}
      {activeTab === 'payment_settings' && (
        <div className="max-w-xl mx-auto bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl space-y-6">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              To'lov Rekvizitlari (Plastik Karta)
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              Foydalanuvchilar o'yinga pul solish (donat) qilganda to'lov o'tkazishi kerak bo'lgan karta ma'lumotlari
            </p>
          </div>

          <form onSubmit={handleSavePaymentSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-300 font-bold uppercase mb-1.5">Plastik Karta Raqami:</label>
              <input
                type="text"
                value={paymentForm.cardNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                placeholder="8600 0000 0000 0000"
                className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white font-mono text-sm tracking-wider focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-bold uppercase mb-1.5">Karta Egasining Ism-Sharifi:</label>
              <input
                type="text"
                value={paymentForm.cardHolder}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardHolder: e.target.value })}
                placeholder="BEKZOD A."
                className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white focus:outline-none focus:border-emerald-500 uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-bold uppercase mb-1.5">Bank yoki To'lov Tizimi Nomi:</label>
              <input
                type="text"
                value={paymentForm.bankName}
                onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                placeholder="TBC Bank / Click / Payme / Uzum"
                className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Rekvizitlarni Saqlash
            </button>
          </form>
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectModalOpen && orderToReject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                Buyurtmani Rad Etish
              </h4>
              <button onClick={() => setRejectModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-300">
              Buyurtma: <b className="text-white">#{orderToReject.order_code}</b> ({orderToReject.service_title_uz})
            </div>

            <div>
              <label className="block text-xs text-gray-300 font-bold uppercase mb-2">Rad etish sababi:</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="To'lov cheki soxta, to'lov tushmadi yoki o'yin ID noto'g'ri..."
                rows={3}
                className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30363d]">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="py-2 px-4 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  handleStatusChange(orderToReject.id, 'rejected', rejectReason);
                  setRejectModalOpen(false);
                }}
                className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                Rad etishni tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Image Zoom Modal */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-xl max-h-[85vh] bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setPreviewReceipt(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <h5 className="text-xs font-bold text-gray-300 uppercase mb-3">To'lov Cheki (Skrinshot):</h5>
            <div className="overflow-auto max-h-[70vh] rounded-xl border border-[#30363d]">
              <img
                src={previewReceipt.startsWith('http') ? previewReceipt : `https://api.telegram.org/file/bot9062692127:AAEUbwoJvMkzBEFoYAAgaVUEvu05MiEaAiE/${previewReceipt}`}
                alt="Receipt"
                className="max-w-full h-auto object-contain"
                onError={(e) => {
                  // If telegram file path requires resolving
                  e.target.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Service Edit / Create Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h4 className="text-base font-bold text-white">
                {editingService ? "Xizmatni Tahrirlash" : "Yangi Donat Xizmati"}
              </h4>
              <button onClick={() => setServiceModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="block text-gray-300 font-bold uppercase mb-1">Nomi (O'zbekcha):</label>
                <input
                  type="text"
                  value={serviceForm.title_uz}
                  onChange={(e) => setServiceForm({ ...serviceForm, title_uz: e.target.value })}
                  placeholder="💵 50.000.000$ CPM O'yin Puli"
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold uppercase mb-1">Nomi (Ruscha):</label>
                <input
                  type="text"
                  value={serviceForm.title_ru}
                  onChange={(e) => setServiceForm({ ...serviceForm, title_ru: e.target.value })}
                  placeholder="💵 50.000.000$ Игровой валюты CPM"
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold uppercase mb-1">Narxi (UZS):</label>
                <input
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                  placeholder="15000"
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold uppercase mb-1">Badge (Masalan: HIT 🔥, TOP, SUPER):</label>
                <input
                  type="text"
                  value={serviceForm.badge}
                  onChange={(e) => setServiceForm({ ...serviceForm, badge: e.target.value })}
                  placeholder="HIT 🔥"
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold uppercase mb-1">Tavsifi:</label>
                <textarea
                  value={serviceForm.description_uz}
                  onChange={(e) => setServiceForm({ ...serviceForm, description_uz: e.target.value })}
                  placeholder="Qisqacha ta'rif..."
                  rows={2}
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-gray-800 text-gray-300 font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#ff5e00] hover:bg-orange-600 text-white font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
