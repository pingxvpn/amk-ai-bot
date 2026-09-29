'use client';

import React from 'react';

export default function HomePage() {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || '3448515021975528';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://amk-ai-bot.vercel.app';
  const redirectUri = `${appUrl}/api/auth/facebook/callback`;
  const scope = 'pages_show_list,pages_messaging,pages_manage_metadata';

  const fbLoginUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&response_type=code`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-between p-6 md:p-12 font-sans selection:bg-blue-600">
      <div className="max-w-xl mx-auto w-full text-center my-auto space-y-6 pt-6">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span className="text-blue-400 text-xs font-semibold tracking-wide uppercase">
            AI Social Commerce Assistant
          </span>
        </div>

        {/* Clean Responsive Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-snug">
          သင့် Facebook Page အတွက် <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-400">
            ၂၄ နာရီ အရောင်းဝန်ထမ်း AI
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed px-2">
          မက်ဆေ့ချ်များ ချက်ချင်း ပြန်ပေးခြင်း၊ ပစ္စည်းဓာတ်ပုံကြည့်ပြီး ဈေးနှုန်းရှင်းပြခြင်းနှင့် အော်ဒါများကို အလိုအလျောက် ကောက်ယူပေးသည့် စနစ်။
        </p>

        {/* CTA Button */}
        <div className="pt-4 space-y-3">
          <a
            href={fbLoginUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl text-base sm:text-lg transition-all shadow-xl shadow-blue-500/25 active:scale-95 duration-150"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Connect with Facebook (၇ ရက် အခမဲ့)
          </a>
          <p className="text-xs text-slate-500 font-medium">
            Credit Card ထည့်ရန် မလိုပါ။ စတင်ရန် ၁ မိနစ်သာ ကြာပါမည်။
          </p>
        </div>

      </div>

      <footer className="text-center text-xs text-slate-600 py-4">
        © 2026 AMK AI Social Commerce. All rights reserved.
      </footer>
    </div>
  );
}