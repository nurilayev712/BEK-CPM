import React, { useState } from 'react';
import { Send, Users, Image, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Broadcast() {
  const [target, setTarget] = useState('all');
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { addToast } = useToast();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      addToast('Xabar matnini kiriting', 'warning');
      return;
    }

    if (!window.confirm("Haqiqatan ham ushbu xabarni barcha tanlangan foydalanuvchilarga jo'natmoqchimisiz?")) return;

    try {
      setLoading(true);
      const res = await api.post('/broadcast', {
        target,
        message: message.trim(),
        photo_url: photoUrl.trim() || undefined
      });
      if (res.success) {
        setResult(res);
        addToast(res.message, 'success');
        setMessage('');
        setPhotoUrl('');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Send className="w-6 h-6 text-[#ff5e00]" />
          Telegram Ommaviy Xabarnoma (Broadcast)
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Barcha CPM o'yinchilariga bot orqali yangiliklar, turnirlar, aksiya yoki tizim xabarlarini yuborish
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form */}
        <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl space-y-5">
          <form onSubmit={handleSend} className="space-y-4 text-xs">
            {/* Target selection */}
            <div>
              <label className="block text-gray-300 font-bold uppercase mb-2">Auditoriya:</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTarget('all')}
                  className={`p-3 rounded-xl border text-center font-bold transition-all ${
                    target === 'all'
                      ? 'border-[#ff5e00] bg-orange-500/10 text-orange-400 shadow-md'
                      : 'border-[#30363d] text-gray-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 mx-auto mb-1" />
                  Barchaga
                </button>
                <button
                  type="button"
                  onClick={() => setTarget('sellers')}
                  className={`p-3 rounded-xl border text-center font-bold transition-all ${
                    target === 'sellers'
                      ? 'border-[#ff5e00] bg-orange-500/10 text-orange-400 shadow-md'
                      : 'border-[#30363d] text-gray-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 mx-auto mb-1" />
                  Sotuvchilarga
                </button>
                <button
                  type="button"
                  onClick={() => setTarget('buyers')}
                  className={`p-3 rounded-xl border text-center font-bold transition-all ${
                    target === 'buyers'
                      ? 'border-[#ff5e00] bg-orange-500/10 text-orange-400 shadow-md'
                      : 'border-[#30363d] text-gray-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 mx-auto mb-1" />
                  Xaridorlarga
                </button>
              </div>
            </div>

            {/* Photo URL */}
            <div>
              <label className="block text-gray-300 font-bold uppercase mb-1.5 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-orange-400" />
                Rasm Havolasi (Ixtiyoriy):
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff5e00]"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-gray-300 font-bold uppercase mb-1.5">
                Xabar Matni (HTML teglari qo'llab-quvvatlanadi):
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hurmatli CPM Market o'yinchilari! Yangi haftalik musobaqa..."
                rows={6}
                className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff5e00] leading-relaxed"
                required
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Qo'llab-quvvatlanadigan formatlar: &lt;b&gt;qalin&lt;/b&gt;, &lt;i&gt;kursiv&lt;/i&gt;, &lt;code&gt;kod&lt;/code&gt;
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#ff5e00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Xabarni Yuborish</span>
                </>
              )}
            </button>
          </form>

          {result && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">{result.message}</p>
                <p className="text-[11px] text-emerald-400 mt-0.5">Xabar fon rejimida navbat bilan yetkazilmoqda.</p>
              </div>
            </div>
          )}
        </div>

        {/* Live Telegram Preview */}
        <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#ff5e00]" />
              Telegram Prevyusi
            </h4>

            {/* Telegram message bubble mock */}
            <div className="bg-[#21262d] border border-[#30363d] rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center gap-2 border-b border-[#30363d]/50 pb-2">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">
                  CPM
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">CPM Market Bot</span>
                  <span className="text-[10px] text-gray-400">bot</span>
                </div>
              </div>

              {photoUrl && (
                <div className="w-full h-40 rounded-xl overflow-hidden bg-black/40 border border-[#30363d]">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed font-sans">
                {message ? (
                  <div dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, '<br/>') }} />
                ) : (
                  <span className="text-gray-500 italic">Xabar matni bu yerda ko'rinadi...</span>
                )}
              </div>

              <div className="text-[10px] text-gray-500 text-right">
                12:45 • o'qildi
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#0d1117] border border-[#30363d] text-[11px] text-gray-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Telegram cheklovlariga uchramaslik uchun xabarlar soniyasiga 25-30 tagacha tezlikda yuboriladi.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
