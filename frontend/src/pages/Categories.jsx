import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name_uz: '',
    name_ru: '',
    icon: '🚗',
    slug: '',
    sort_order: 0
  });

  const { addToast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({
      name_uz: '',
      name_ru: '',
      icon: '🚗',
      slug: '',
      sort_order: categories.length + 1
    });
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setForm({
      name_uz: cat.name_uz,
      name_ru: cat.name_ru,
      icon: cat.icon,
      slug: cat.slug,
      sort_order: cat.sort_order
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, form);
        addToast('Kategoriya yangilandi', 'success');
      } else {
        await api.post('/categories', form);
        addToast('Yangi kategoriya qoʻshildi', 'success');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu kategoriyani o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/categories/${id}`);
      addToast('Kategoriya oʻchirildi', 'success');
      fetchCategories();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-[#ff5e00]" />
            Kategoriyalar Boshqaruvi
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Telegram bot va platformadagi avtomobil turlari va mahsulot bo'limlari
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="py-2.5 px-4 bg-gradient-to-r from-[#ff5e00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Kategoriya qo'shish
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400">
            <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl shadow-lg flex flex-col justify-between hover:border-[#ff5e00]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-2xl shadow-inner">
                    {cat.icon}
                  </div>
                  <span className="font-mono text-xs text-gray-500 font-semibold">
                    Tartib: #{cat.sort_order}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">{cat.name_uz}</h4>
                <p className="text-xs text-gray-400 font-medium">{cat.name_ru}</p>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-mono">slug: {cat.slug}</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-orange-500/10 text-[#ff5e00] border border-orange-500/20">
                    {cat.listings_count || 0} ta e'lon
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#30363d] mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(cat)}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  title="Tahrirlash"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-400 border border-rose-500/30 transition-colors"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h4 className="text-base font-bold text-white">
                {editingCategory ? 'Kategoriyani Tahrirlash' : 'Yangi Kategoriya Qoʻshish'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold uppercase mb-1.5">Ikonka (Emoji):</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="🚗"
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-lg focus:outline-none focus:border-[#ff5e00]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold uppercase mb-1.5">Nomi (O'zbekcha):</label>
                <input
                  type="text"
                  value={form.name_uz}
                  onChange={(e) => setForm({ ...form, name_uz: e.target.value })}
                  placeholder="Sport avtomobillar"
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white focus:outline-none focus:border-[#ff5e00]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold uppercase mb-1.5">Nomi (Ruscha):</label>
                <input
                  type="text"
                  value={form.name_ru}
                  onChange={(e) => setForm({ ...form, name_ru: e.target.value })}
                  placeholder="Спорткары"
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white focus:outline-none focus:border-[#ff5e00]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold uppercase mb-1.5">Slug (Noyob kalit):</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="sport"
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white font-mono focus:outline-none focus:border-[#ff5e00]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold uppercase mb-1.5">Tartib raqami:</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-white font-mono focus:outline-none focus:border-[#ff5e00]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-gray-800 text-gray-300 font-bold hover:bg-gray-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#ff5e00] hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-600/30"
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
