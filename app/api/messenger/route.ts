import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 30;

// 1. Meta Webhook Verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new Response('Verification failed', { status: 403 });
}

// 2. Incoming Messenger Messages (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object === 'page') {
      for (const entry of body.entry || []) {
        const pageId = entry.id; // စာဝင်လာသော Facebook Page ID
        const event = entry.messaging?.[0];
        if (!event) continue;

        // Skip Echoes (Bot ပို့သောစာကို ပြန်မဖတ်ရန်)
        if (event.message?.is_echo) {
          continue;
        }

        const senderId = event.sender?.id;
        const message = event.message;

        if (senderId && message && (message.text || message.attachments)) {
          let userText = message.text || '';
          let imageUrl = '';

          if (message.attachments?.[0]?.type === 'image') {
            imageUrl = message.attachments[0].payload?.url || '';
            userText = userText || 'ဒီပစ္စည်းပုံလေး ဈေးနှုန်းနဲ့ အချက်အလက် သိချင်ပါတယ်ရှင်။';
          }

          // ၁။ Supabase Database မှ ထို Page ၏ ဆိုင်အချက်အလက်နှင့် ပစ္စည်းစာရင်းကို ဆွဲယူခြင်း
          const { data: store } = await supabaseAdmin
            .from('stores')
            .select('*, products(*)')
            .eq('page_id', pageId)
            .single();

          if (!store) {
            console.log('Store not registered for pageId:', pageId);
            continue;
          }

          // ၂။ ၇ ရက် Trial သက်တမ်း ကုန်/မကုန် စစ်ဆေးခြင်း
          const isExpired = store.trial_ends_at && new Date(store.trial_ends_at).getTime() < new Date().getTime();
          if (isExpired && store.subscription_status === 'trial') {
            await replyToFacebook(
              senderId,
              'မင်္ဂလာပါရှင်၊ ဤ Page ၏ AI စမ်းသပ်ကာလ (7-Day Trial) ပြီးဆုံးသွားပါသဖြင့် လူကြီးမင်း မေးမြန်းချက်အတွက် ဆိုင်ရှင်မှ တိုက်ရိုက် ပြန်လည်ဖြေကြားပေးပါမည်ရှင်။',
              store.page_access_token
            );
            continue;
          }

          // ၃။ Database ထဲက ပစ္စည်းများဖြင့် Dynamic Knowledge Base တည်ဆောက်ခြင်း
          const productsList =
            store.products
              ?.map(
                (p: any) =>
                  `- ${p.name}: ဈေးနှုန်း ${p.price}${p.promo_price ? ` (ပရိုမိုးရှင်းဈေး: ${p.promo_price})` : ''} (${p.specs || ''})`
              )
              .join('\n') || 'လက်ရှိတွင် ပစ္စည်းစာရင်း မရှိသေးပါ။';

          const storeKnowledge = `
=== ဆိုင်အမည် - ${store.store_name} ===
ဆက်သွယ်ရန်ဖုန်း - ${store.phone || 'N/A'}
ဆိုင်ဖွင့်ချိန် - ${store.operating_hours || 'N/A'}
ပို့ဆောင်ခ - ${store.delivery_info || 'N/A'}
ငွေပေးချေမှု - ${store.payment_info || 'N/A'}

[ ရောင်းချမည့် ပစ္စည်းများနှင့် ဈေးနှုန်းများ ]
${productsList}
`;

          // ၄။ AI ဆီ အဖြေတောင်းယူပြီး Facebook ဆီ ပြန်လည် ပို့ဆောင်ခြင်း
          const aiAnswer = await askAI(userText, store.store_name, storeKnowledge, imageUrl);
          await replyToFacebook(senderId, aiAnswer, store.page_access_token);
        }
      }
      return new Response('EVENT_RECEIVED', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('EVENT_RECEIVED', { status: 200 });
  }
}

// OpenRouter Gemini 2.5 Flash Call
async function askAI(userText: string, storeName: string, knowledge: string, imageUrl?: string): Promise<string> {
  try {
    const userContent: any = imageUrl
      ? [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: imageUrl } },
        ]
      : userText;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a polite, helpful Myanmar customer support assistant for "${storeName}".
Always answer in friendly, natural Burmese (မြန်မာလို ယဉ်ကျေးစွာ ဖြေပေးပါ).
Base all your answers strictly on this Knowledge Base:
${knowledge}
If user sends a photo, visually identify which product it is and answer with price and specs.
If customer wants to buy, ask for Name, Phone, and Delivery Address.`,
          },
          { role: 'user', content: userContent },
        ],
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || `မင်္ဂလာပါရှင်၊ ${storeName} မှ ကြိုဆိုပါတယ်ရှင့်။ ဘာများကူညီပေးရမလဲရှင့်။`;
  } catch (err) {
    console.error('AI Error:', err);
    return 'မင်္ဂလာပါရှင်၊ ခေတ္တ စနစ်ချို့ယွင်းနေပါသဖြင့် ခဏအကြာမှ ထပ်မံမေးမြန်းပေးပါရန် မေတ္တာရပ်ခံအပ်ပါသည်ရှင်။';
  }
}

// Send Reply via Facebook Graph API using the Store's own Token
async function replyToFacebook(recipientId: string, text: string, pageToken: string) {
  try {
    const safeText = text.slice(0, 1900);

    await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text: safeText },
      }),
    });
  } catch (err) {
    console.error('FB Send Error:', err);
  }
}