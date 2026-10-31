import React, { useState, useEffect } from 'react';
import {
  Users,
  Car,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stats/dashboard');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      addToast('Statistika yuklanmadi: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { metrics, categoryStats, trends, recentDeals, recentLogs } = data;

  // Chart Data preparation
  const chartLabels = trends.users.length > 0
    ? trends.users.map(u => u.date.slice(5))
    : ['10-01', '10-05', '10-10', '10-15', '10-20', '10-25', '10-31'];

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Yangi foydalanuvchilar',
        data: trends.users.length > 0 ? trends.users.map(u => u.count) : [2, 5, 8, 12, 19, 24, 30],
        borderColor: '#ff5e00',
        backgroundColor: 'rgba(255, 94, 0, 0.12)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ff5e00',
        pointRadius: 4
      },
      {
        label: 'Bitimlar',
        data: trends.deals.length > 0 ? trends.deals.map(d => d.count) : [1, 3, 4, 7, 11, 15, 21],
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00f0ff',
        pointRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9ca3af',
          font: { family: 'sans-serif', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#161b22',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        borderColor: '#30363d',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9ca3af' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9ca3af', precision: 0 }
      }
    }
  };

  const statusBadges = {
    pending: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Kutilmoqda</span>,
    payment_sent: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">To'lov yuborildi</span>,
    item_transferred: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Topshirildi</span>,
    completed: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Yakunlandi</span>,
    disputed: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">Nizo</span>,
    cancelled: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">Bekor</span>
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#ff5e00]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Jami Foydalanuvchilar</span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#ff5e00] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{metrics.usersCount}</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Faol
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Telegram bot foydalanuvchilari</p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#ff5e00]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Faol E'lonlar</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{metrics.activeListings}</span>
            <span className="text-xs text-amber-400 font-semibold">+{metrics.todayListings} bugun</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Katalogdagi faol mashinalar</p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#ff5e00]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Escrow Savdolar</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{metrics.completedDeals}</span>
            <span className="text-xs text-purple-400 font-semibold">+{metrics.activeDeals} faol</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Muvaffaqiyatli xavfsiz bitimlar</p>
        </div>

        {/* Card 4 - Disputes */}
        <div className={`p-5 rounded-2xl border shadow-lg transition-all ${
          metrics.disputedDeals > 0
            ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-500'
            : 'bg-[#161b22] border-[#30363d] hover:border-[#ff5e00]/50'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Faol Nizolar</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              metrics.disputedDeals > 0 ? 'bg-rose-500/20 text-rose-400 animate-bounce' : 'bg-gray-800 text-gray-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${metrics.disputedDeals > 0 ? 'text-rose-400' : 'text-white'}`}>
              {metrics.disputedDeals}
            </span>
            {metrics.disputedDeals > 0 ? (
              <button
                onClick={() => setActiveTab('deals')}
                className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold hover:underline"
              >
                Ko'rish →
              </button>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold">Tinch</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Admin aralashuvi talab qilingan</p>
        </div>
      </div>

      {/* Analytics Chart & Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Line Chart */}
        <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Platforma Dinamikasi (Oxirgi 30 kun)</h3>
              <p className="text-xs text-gray-400">Yangi o'yinchilar va amalga oshirilgan savdolar</p>
            </div>
            <div className="text-xs text-[#ff5e00] font-semibold bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              Real-time trend
            </div>
          </div>
          <div className="h-72 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Kategoriyalar Ulushi</h3>
            <p className="text-xs text-gray-400 mb-5">CPM mahsulotlari taqsimoti</p>

            <div className="space-y-4">
              {categoryStats.map((cat, idx) => {
                const total = categoryStats.reduce((sum, c) => sum + c.listing_count, 0) || 1;
                const percent = Math.round((cat.listing_count / total) * 100);
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-300 font-medium flex items-center gap-1.5">
                        <span>{cat.icon}</span>
                        <span>{cat.name_uz}</span>
                      </span>
                      <span className="text-gray-400 font-mono font-semibold">{cat.listing_count} ta ({percent}%)</span>
                    </div>
                    <div className="w-full bg-[#0d1117] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#ff5e00] to-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#30363d] mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>Umumiy hajm:</span>
            <span className="text-emerald-400 font-bold font-mono text-sm">
              {metrics.totalVolume.toLocaleString()} UZS
            </span>
          </div>
        </div>
      </div>

      {/* Recent Deals Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">So'nggi Escrow Bitimlar</h3>
            <p className="text-xs text-gray-400">Yangi ochilgan va yakunlangan xavfsiz savdolar</p>
          </div>
          <button
            onClick={() => setActiveTab('deals')}
            className="text-xs text-[#ff5e00] hover:text-orange-400 font-bold flex items-center gap-1"
          >
            Barchasini ko'rish <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] text-gray-200">
              {recentDeals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    Hozircha bitimlar yo'q
                  </td>
                </tr>
              ) : (
                recentDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-[#21262d] transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#ff5e00]">#{deal.deal_code}</td>
                    <td className="py-4 px-6 font-semibold max-w-xs truncate">{deal.listing_title}</td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-white">{deal.buyer_name}</span>
                      <span className="text-gray-400 block text-[11px]">@{deal.buyer_username || 'no_user'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-white">{deal.seller_name}</span>
                      <span className="text-gray-400 block text-[11px]">@{deal.seller_username || 'no_user'}</span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                      {deal.price.toLocaleString()} {deal.currency}
                    </td>
                    <td className="py-4 px-6">{statusBadges[deal.status] || deal.status}</td>
                    <td className="py-4 px-6 text-gray-400 whitespace-nowrap">
                      {new Date(deal.created_at).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
