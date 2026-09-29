'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DashboardContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('store_id');

  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Store Settings State
  const [store, setStore] = useState({
    store_name: '',
    phone: '',
    address: '',
    operating_hours: '',
    delivery_info: '',
    payment_info: '',
    trial_ends_at: '',
  });

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [newProd, setNewProd] = useState({ name: '', price: '', promo_price: '', specs: '' });
  const [addingProd, setAddingProd] = useState(false);

  // Load Data from Supabase
  useEffect(() => {
    if (!storeId) return;
    fetch(`/api/store?store_id=${storeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStore({
            store_name: data.store.store_name || '',
            phone: data.store.phone || '',
            address: data.store.address || '',
            operating_hours: data.store.operating_hours || '',
            delivery_info: data.store.delivery_info || '',
            payment_info: data.store.payment_info || '',
            trial_ends_at: data.store.trial_ends_at || '',
          });
          setProducts(data.products || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [storeId]);

  // Calculate Trial Days Remaining
  const getTrialDays = () => {
    if (!store.trial_ends_at) return 7;
    const diff = new Date(store.trial_ends_at).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Save Store Settings
  const handleSaveStore = async () => {
    setSavingStore(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_store',
          storeId,
          storeData: store,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('✅ ဆိုင်အချက်အလက်များ အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!');
      }
    } catch {
      setStatusMsg('❌ သိမ်းဆည်းမှု မအောင်မြင်ပါ။');
    } finally {
      setSavingStore(false);
    }
  };

  // Add Product
  const handleAddProduct = async () => {
    if (!newProd.name || !newProd.price) return;
    setAddingProd(true);
    try {
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_product',
          storeId,
          productData: newProd,
        }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts([data.product, ...products]);
        setNewProd({ name: '', price: '', promo_price: '', specs: '' });
      }
    } finally {
      setAddingProd(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    const res = await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_product', productId: id }),
    });
    if (res.ok) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center p-6 text-center">
        <div>
          <h2 className="text-xl font-bold mb-2">Store ID မတွေ့ရှိပါ</h2>
          <p className="text-slate-400 text-sm mb-4">Facebook ဖြင့် အရင်ဆုံး ချိတ်ဆက်ပေးပါရန် လိုအပ်ပါသည်။</p>
          <a href="/" className="bg-blue-600 px-6 py-2.5 rounded-xl font-semibold text-sm">ပင်မစာမျက်နှာသို့ သွားမည်</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="text-slate-600 font-medium">အချက်အလက်များ ဆွဲယူနေပါသည်...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Trial Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">7-Day Free Trial</span>
            <h2 className="text-lg sm:text-xl font-bold mt-1">အခမဲ့ စမ်းသပ်ခွင့် အသက်ဝင်နေပါသည်</h2>
            <p className="text-blue-100 text-xs sm:text-sm">သက်တမ်းကုန်ဆုံးရန် ({getTrialDays()}) ရက် ကျန်ရှိပါသေးသည်။</p>
          </div>
          <button className="bg-white text-blue-600 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-blue-50 transition">
            Upgrade Pro
          </button>
        </div>

        {/* Dashboard Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{store.store_name || 'My Online Store'}</h1>
            <p className="text-xs text-slate-500 mt-1">Facebook Messenger AI Sales Agent ထိန်းချုပ်ခန်း</p>
          </div>
          <button
            onClick={handleSaveStore}
            disabled={savingStore}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
          >
            {savingStore ? 'သိမ်းဆည်းနေသည်...' : '💾 အချက်အလက်များ သိမ်းဆည်းမည်'}
          </button>
        </div>

        {statusMsg && (
          <div className="p-4 rounded-xl bg-blue-50 text-blue-800 text-sm border border-blue-200">
            {statusMsg}
          </div>
        )}

        {/* Store Info Settings Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 border-b pb-3">🏪 ဆိုင်အချက်အလက်များနှင့် စည်းကမ်းများ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ဆက်သွယ်ရန် ဖုန်းနံပါတ်</label>
              <input
                type="text"
                value={store.phone}
                onChange={(e) => setStore({ ...store, phone: e.target.value })}
                placeholder="09-xxxxxxxxx"
                className="w-full border rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ဆိုင်ဖွင့်ချိန်</label>
              <input
                type="text"
                value={store.operating_hours}
                onChange={(e) => setStore({ ...store, operating_hours: e.target.value })}
                placeholder="မနက် ၉:၀၀ မှ ည ၈:၀၀ ထိ"
                className="w-full border rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ပို့ဆောင်ခ နှုန်းထားများ</label>
              <input
                type="text"
                value={store.delivery_info}
                onChange={(e) => setStore({ ...store, delivery_info: e.target.value })}
                placeholder="ရန်ကုန် ၃,၀၀၀ ကျပ် / နယ် ၅,၀၀၀ ကျပ်"
                className="w-full border rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ငွေလက်ခံမည့် KPay / WavePay</label>
              <input
                type="text"
                value={store.payment_info}
                onChange={(e) => setStore({ ...store, payment_info: e.target.value })}
                placeholder="KPay / Wave (09-xxxxxxxxx)"
                className="w-full border rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Products Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 border-b pb-3">📱 ပစ္စည်းစာရင်းနှင့် ဈေးနှုန်းများ (AI ရောင်းပေးမည့် စာရင်း)</h3>

          {/* Add Product Inline Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="ပစ္စည်းအမည် (ဥပမာ iPhone 16)"
              value={newProd.name}
              onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              type="text"
              placeholder="မူရင်းဈေး (ဥပမာ ၄,၈၅၀,၀၀၀)"
              value={newProd.price}
              onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              type="text"
              placeholder="ပရိုမိုးရှင်းဈေး (ရှိပါက)"
              value={newProd.promo_price}
              onChange={(e) => setNewProd({ ...newProd, promo_price: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              type="text"
              placeholder="အသေးစိတ် (အရောင်၊ ဆိုဒ်)"
              value={newProd.specs}
              onChange={(e) => setNewProd({ ...newProd, specs: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            />
            <div className="sm:col-span-2 md:col-span-4 flex justify-end">
              <button
                onClick={handleAddProduct}
                disabled={addingProd}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2 rounded-lg text-xs tracking-wide uppercase transition disabled:opacity-50"
              >
                {addingProd ? 'ထည့်နေသည်...' : '+ ပစ္စည်းအသစ် ထည့်မည်'}
              </button>
            </div>
          </div>

          {/* Products List Table */}
          <div className="space-y-2 pt-2">
            {products.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">ပစ္စည်းစာရင်း မရှိသေးပါ။ အပေါ်တွင် အသစ်ထည့်သွင်းပေးပါရန်။</p>
            ) : (
              products.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{p.name}</h4>
                    <p className="text-xs text-slate-500">{p.specs || 'No specs'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-extrabold text-blue-600 text-sm">{p.price}</span>
                      {p.promo_price && (
                        <p className="text-xs text-emerald-600 font-semibold">Promo: {p.promo_price}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1"
                    >
                      ဖျက်မည်
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex justify-center items-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}