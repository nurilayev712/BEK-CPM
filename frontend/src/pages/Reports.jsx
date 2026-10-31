import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, ShieldCheck, History, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Reports() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/logs', { params: { limit: 50 } });
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async (type) => {
    try {
      setDownloading(type);
      const token = localStorage.getItem('cpm_admin_token');
      const response = await fetch(`http://localhost:5000/api/reports/export?type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Eksport xatoligi');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cpm_${type}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      addToast(`${type.toUpperCase()} ma'lumotlari CSV formatida yuklab olindi!`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* CSV Export Cards */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#ff5e00]" />
            Hisobotlar va Ma'lumotlarni Eksport Qilish
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Platforma ma'lumotlarini Excel yoki boshqa tizimlarda tahlil qilish uchun CSV formatida yuklab oling
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Users */}
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:border-[#ff5e00]/50 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#ff5e00] flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Foydalanuvchilar Bazasi</h4>
              <p className="text-xs text-gray-400 mt-1">
                Barcha bot o'yinchilari, ularning reytingi, savdolar soni, telefon va tillari.
              </p>
            </div>
            <button
              onClick={() => handleExportCSV('users')}
              disabled={downloading === 'users'}
              className="mt-5 w-full py-2.5 px-4 bg-[#21262d] hover:bg-[#ff5e00] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-[#30363d] transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading === 'users' ? 'Tayyorlanmoqda...' : 'CSV Yuklab Olish'}</span>
            </button>
          </div>

          {/* Card 2: Listings */}
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:border-[#ff5e00]/50 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">E'lonlar Bazasi</h4>
              <p className="text-xs text-gray-400 mt-1">
                Katalogdagi barcha avtomobillar, narxlar, kategoriyalar, ko'rishlar va holatlar.
              </p>
            </div>
            <button
              onClick={() => handleExportCSV('listings')}
              disabled={downloading === 'listings'}
              className="mt-5 w-full py-2.5 px-4 bg-[#21262d] hover:bg-cyan-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-[#30363d] transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading === 'listings' ? 'Tayyorlanmoqda...' : 'CSV Yuklab Olish'}</span>
            </button>
          </div>

          {/* Card 3: Deals */}
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:border-[#ff5e00]/50 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Escrow Bitimlar Tarixi</h4>
              <p className="text-xs text-gray-400 mt-1">
                Barcha xavfsiz savdolar, to'lovlar, xaridor va sotuvchilar, nizolar yozuvlari.
              </p>
            </div>
            <button
              onClick={() => handleExportCSV('deals')}
              disabled={downloading === 'deals'}
              className="mt-5 w-full py-2.5 px-4 bg-[#21262d] hover:bg-purple-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-[#30363d] transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading === 'deals' ? 'Tayyorlanmoqda...' : 'CSV Yuklab Olish'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Audit Logs */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              Admin Xavfsizlik va Harakatlar Jurnali (Audit Logs)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Qaysi administrator qachon va qanday o'zgartirish kiritgani haqida to'liq hisobot
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 bg-[#0d1117] hover:bg-[#21262d] text-gray-300 hover:text-white rounded-xl border border-[#30363d] transition-colors"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1117] text-gray-400 uppercase font-semibold border-b border-[#30363d]">
              <tr>
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">Admin</th>
                <th className="py-3.5 px-6">Amal</th>
                <th className="py-3.5 px-6">Tafsilot</th>
                <th className="py-3.5 px-6">IP Manzil</th>
                <th className="py-3.5 px-6">Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] text-gray-200 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-400">
                    <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500 font-sans">
                    Hozircha audit yozuvlari yo'q
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#21262d] transition-colors">
                    <td className="py-3.5 px-6 text-gray-500">#{log.id}</td>
                    <td className="py-3.5 px-6 font-bold text-white font-sans">@{log.admin_username}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-sans text-gray-300 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3.5 px-6 text-gray-400 text-[11px]">{log.ip_address || '::1'}</td>
                    <td className="py-3.5 px-6 text-gray-400 whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString('uz-UZ')}
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
