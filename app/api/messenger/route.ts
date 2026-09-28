import { NextRequest } from 'next/server';
import { STORE_KNOWLEDGE_BASE } from '@/lib/knowledge';

// 1. Meta Webhook Verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED_SUCCESSFULLY');
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
        const event = entry.messaging?.[0];
        if (!event) continue;

        const senderId = event.sender?.id;
        const message = event.message;

        if (senderId && message && (message.text || message.attachments)) {
          let userText = message.text || '';
          let imageUrl = '';

          // ပုံပါလာပါက ပုံကိုပါ AI ဆီ ပို့ရန် စစ်ဆေးခြင်း
          if (message.attachments?.[0]?.type === 'image') {
            imageUrl = message.attachments[0].payload.url;
            userText = userText || 'ဒီပစ္စည်းပုံလေး ဈေးနှုန်းနဲ့ အချက်အလက် သိချင်ပါတယ်ရှင်။';
          }

          // OpenRouter Gemini Flash ဆီ အဖြေတောင်းယူခြင်း
          const aiAnswer = await askAI(userText, imageUrl);

          // Facebook Graph API သို့ အကြောင်းပြန်စာ ပို့ခြင်း
          await replyToFacebook(senderId, aiAnswer);
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
async function askAI(userText: string, imageUrl?: string): Promise<string> {
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
            content: `You are a polite, helpful Myanmar customer support assistant for "Online shopping AMK".
Always answer in friendly, natural Burmese (မြန်မာလို ယဉ်ကျေးစွာ ဖြေပေးပါ).
Base all your answers strictly on this Knowledge Base:
${STORE_KNOWLEDGE_BASE}
If user sends a photo, visually identify which phone it is and answer with price and specs.
If customer wants to buy, ask for Name, Phone, and Delivery Address.`,
          },
          { role: 'user', content: userContent },
        ],
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'မင်္ဂလာပါရှင်၊ လူကြီးမင်း မေးမြန်းချက်အတွက် ခေတ္တစောင့်ဆိုင်းပေးပါရှင်။';
  } catch (err) {
    console.error('AI Error:', err);
    return 'မင်္ဂလာပါရှင်၊ စနစ်ချို့ယွင်းနေပါသဖြင့် ခေတ္တစောင့်ဆိုင်းပြီးမှ ထပ်မံမေးမြန်းပေးပါရှင်။';
  }
}

// Send Reply via Facebook Graph API
async function replyToFacebook(recipientId: string, text: string) {
  try {
    await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      }
    );
  } catch (err) {
    console.error('FB Send Error:', err);
  }
}