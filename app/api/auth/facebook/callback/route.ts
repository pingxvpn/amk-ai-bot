import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;

    // ၁။ Code ကို User Access Token ဖြင့် လဲလှယ်ခြင်း
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Token Exchange Error:', tokenData.error);
      return NextResponse.json({ error: tokenData.error.message }, { status: 400 });
    }

    const userAccessToken = tokenData.access_token;

    // ၂။ ထို User ပိုင်ဆိုင်သော Facebook Page များကို ဆွဲယူခြင်း
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();

    const pages = pagesData.data;
    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No Facebook Pages found for this account' }, { status: 400 });
    }

    // ဆိုင်ရှင်၏ ပထမဆုံး Page ကို အလိုအလျောက် ရွေးချယ်ချိတ်ဆက်ခြင်း
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

    // ၄။ Facebook Webhook သို့ ထို Page ကို အလိုအလျောက် Subscribe လုပ်ပေးခြင်း (Force Subscribe)
    await fetch(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=messages&access_token=${pageAccessToken}`, {
      method: 'POST',
    });

    // ၅။ ပြီးပါက ဆိုင်ရှင်၏ သီးသန့် Admin Dashboard ဆီသို့ အလိုအလျောက် ခေါ်ဆောင်သွားခြင်း
    return NextResponse.redirect(new URL(`/admin?store_id=${store.id}&trial=success`, request.url));
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}