import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AMK AI - ၂၄ နာရီ Facebook Page အရောင်းဝန်ထမ်း',
  description: 'သင့် Facebook Page အတွက် မက်ဆေ့ချ်များ ချက်ချင်း ပြန်ပေးခြင်းနှင့် အော်ဒါကောက်ယူပေးသည့် AI စနစ်။ ၇ ရက် အခမဲ့ စမ်းသုံးရန်။',
  openGraph: {
    title: 'AMK AI - ၂၄ နာရီ Facebook Page အရောင်းဝန်ထမ်း',
    description: 'မက်ဆေ့ချ်များ ချက်ချင်း ပြန်ပေးခြင်းနှင့် ပုံကြည့်ပြီး ဈေးပြောပေးမည့် AI Bot။ ၇ ရက် အခမဲ့ စမ်းသုံးရန်။',
    url: 'https://amk-ai-bot.vercel.app',
    siteName: 'AMK AI Commerce',
    locale: 'my_MM',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="my">
      <body className="antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}