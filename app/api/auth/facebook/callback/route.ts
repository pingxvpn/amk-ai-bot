import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // Variable များကို အလိုအလျောက် သန့်စင်ခြင်း (Space များနှင့် အမှိုက်များ ဖြတ်ထုတ်ခြင်း)
    const appId = (process.env.NEXT_PUBLIC_META_APP_ID || '').trim();
    const appSecret = (process.env.META_APP_SECRET || '').trim();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://amk-ai-bot.vercel.app').trim().replace(/\/$/, '');
    const redirectUri = `${appUrl}/api/auth/facebook/callback`;

    // ၁။ URLSearchParams သုံး၍ အမှားအယွင်းမရှိ Token လဲလှယ်ရန် လှမ်းခေါ်ခြင်း
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: code,
    });

    const tokenRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Meta Token Exchange Error:', tokenData.error);
      return NextResponse.json({ error: tokenData.error.message }, { status: 400 });
    }

    const userAccessToken = tokenData.access_token;

    // ၂။ ထို User ပိုင်ဆိုင်သော Facebook Page များကို ဆွဲယူခြင်း
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`);
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      console.error('Meta Pages Fetch Error:', pagesData.error);
      return NextResponse.json({ error: pagesData.error.message }, { status: 400 });
    }

    const pages = pagesData.data;
    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No Facebook Pages found for this account' }, { status: 400 });
    }

    // ဆိုင်ရှင်၏ ပထမဆုံး Page ကို အလိုအလျောက် ရွေးချယ်ခြင်း
    const selectedPage = pages[0];
    const pageId = selectedPage.id;
    const pageName = selectedPage.name;
    const pageAccessToken = selectedPage.access_token;

    // ၃။ Supabase Database ထဲသို့ ဆိုင်အချက်အလက်နှင့် ၇ ရက် Trial အလိုအလျောက် သွင်းခြင်း
    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: store, error: dbError } = await supabaseAdmin
      .from('stores')
      .upsert(
        {
          store_name: pageName,
          page_id: pageId,
          page_access_token: pageAccessToken,
          subscription_status: 'trial',
          trial_ends_at: trialEndDate,
        },
        { onConflict: 'page_id' }
      )
      .select()
      .single();

    if (dbError) {
      console.error('Supabase DB Error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // ၄။ Facebook Webhook သို့ ထို Page ကို အလိုအလျောက် ချိတ်ဆက်ပေးခြင်း
    try {
      await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=messages&access_token=${pageAccessToken}`,
        { method: 'POST' }
      );
    } catch (subErr) {
      console.log('Subscribed apps non-fatal notice:', subErr);
    }

    // ၅။ ဆိုင်ရှင်၏ သီးသန့် Admin Dashboard ဆီသို့ အောင်မြင်စွာ ခေါ်ဆောင်သွားခြင်း
    return NextResponse.redirect(`${appUrl}/admin?store_id=${store.id}&trial=success`);
  } catch (error: any) {
    console.error('OAuth Callback Fatal Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Unknown error',
        details: error.cause ? String(error.cause) : undefined,
      },
      { status: 500 }
    );
  }
}