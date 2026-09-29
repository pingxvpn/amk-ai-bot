'use client';

import React from 'react';

export default function HomePage() {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || '3448515021975528';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://amk-ai-bot.vercel.app';
  const redirectUri = `${appUrl}/api/auth/facebook/callback`;
  const scope = 'pages_show_list,pages_messaging,pages_manage_metadata';

  // Facebook OAuth Login URL
  const fbLoginUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&response_type=code`;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6">
      <div className="max-w-2xl text-center space-y-6">
        <span className="inline-block bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
          🚀 AI Social Commerce SaaS
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          သင့် Facebook Page အတွက် <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            ၂၄ နာရီ အရောင်းဝန်ထမ်း AI Bot
          </span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg">
          မက်ဆေ့ချ်များ ချက်ချင်း ပြန်ပေးခြင်း၊ ပုံကြည့်ပြီး ဈေးပြောပေးခြင်းနှင့် အော်ဒါများကို အလိုအလျောက် ကောက်ယူပေးသည့် စနစ်။
        </p>

        <div className="pt-4">
          <a
            href={fbLoginUrl}
            className="inline-flex items-center gap-3 bg-[#1877F2] hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg shadow-blue-500/20 hover:scale-105 transform duration-200"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Connect with Facebook (၇ ရက် အခမဲ့ စမ်းသုံးမည်)
          </a>
          <p className="text-xs text-slate-500 mt-3">Credit Card ထည့်ရန် မလိုပါ။ ၁ မိနစ်အတွင်း စတင်နိုင်ပါသည်။</p>
        </div>
      </div>
    </div>
  );
}