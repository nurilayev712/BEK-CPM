import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Listings from './pages/Listings';
import Deals from './pages/Deals';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Broadcast from './pages/Broadcast';
import Reports from './pages/Reports';
import TopupOrders from './pages/TopupOrders';
import api from './services/api';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [disputedCount, setDisputedCount] = useState(0);
  const [topupPendingCount, setTopupPendingCount] = useState(0);

  // Poll dispute and topup counts periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkBadges = async () => {
      try {
        const [dealsRes, topupRes] = await Promise.all([
          api.get('/deals', { params: { status: 'disputed' } }),
          api.get('/topup/orders', { params: { status: 'pending' } })
        ]);
        if (dealsRes.success) setDisputedCount(dealsRes.data.length);
        if (topupRes.success) setTopupPendingCount(topupRes.data.length);
      } catch (err) {
        // quiet error
      }
    };

    checkBadges();
    const interval = setInterval(checkBadges, 25000); // every 25s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const titles = {
    dashboard: { title: 'Bosh Sahifa (Dashboard)', subtitle: 'CPM Market platformasi umumiy holati va jonli statistikasi' },
    topup: { title: 'Donat & Pul Solish Xizmati', subtitle: '50M CPM puli, Coins, All Cars va donat buyurtmalari boshqaruvi' },
    listings: { title: "E'lonlar Ro'yxati", subtitle: 'Barcha sotuvga qoʻyilgan mashina va tyuninglar moderatsiyasi' },
    deals: { title: 'Escrow Bitimlar va Nizolar', subtitle: 'Xavfsiz savdo kafolati va kelishmovchiliklarni hal qilish' },
    users: { title: 'Foydalanuvchilar Roʻyxati', subtitle: 'CPM oʻyinchilari hisoblari, reytinglari va boshqaruvi' },
    categories: { title: 'Kategoriyalar', subtitle: 'Mashinalar va mahsulot boʻlimlarini sozlash' },
    broadcast: { title: 'Ommaviy Xabarnoma', subtitle: 'Barcha bot foydalanuvchilariga xabar joʻnatish' },
    reports: { title: 'Hisobotlar va Audit Jurnali', subtitle: 'CSV maʼlumotlarni yuklab olish va xavfsizlik nazorati' },
  };

  const currentHeader = titles[activeTab] || titles.dashboard;

  return (
    <div className="flex min-h-screen bg-[#0d1117]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        disputedCount={disputedCount}
        topupPendingCount={topupPendingCount}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar
          title={currentHeader.title}
          subtitle={currentHeader.subtitle}
        />

        <div className="flex-1">
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'topup' && <TopupOrders />}
          {activeTab === 'listings' && <Listings />}
          {activeTab === 'deals' && <Deals />}
          {activeTab === 'users' && <Users />}
          {activeTab === 'categories' && <Categories />}
          {activeTab === 'broadcast' && <Broadcast />}
          {activeTab === 'reports' && <Reports />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
