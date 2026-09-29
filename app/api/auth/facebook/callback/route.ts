import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided from Facebook' }, { status: 400 });
  }

  let currentStep = '1. Start Token Exchange';
  let targetUrl = '';

  try {
    const appId = (process.env.NEXT_PUBLIC_META_APP_ID || '').trim();
    const appSecret = (process.env.META_APP_SECRET || '').trim();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://amk-ai-bot.vercel.app').trim().replace(/\/$/, '');
    const redirectUri = `${appUrl}/api/auth/facebook/callback`;

    // အဆင့် ၁။ Code ကို User Access Token ဖြင့် လဲလှယ်ခြင်း
    currentStep = '1. Facebook Token Exchange';
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: code,
    });
    targetUrl = `https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`;

    const tokenRes = await fetch(targetUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.json({ 
        failed_at: 'Step 1 - Meta Token Error',
        message: tokenData.error.message,
        type: tokenData.error.type 
      }, { status: 400 });
    }

    const userAccessToken = tokenData.access_token;

    // အဆင့် ၂။ ထို User ပိုင်ဆိုင်သော Facebook Page များကို ဆွဲယူခြင်း
    currentStep = '2. Fetch Facebook Pages';
    targetUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`;

    const pagesRes = await fetch(targetUrl);
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      return NextResponse.json({ 
        failed_at: 'Step 2 - Meta Pages Error', 
        message: pagesData.error.message 
      }, { status: 400 });
    }

    const pages = pagesData.data;
    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No Facebook Pages found for this account' }, { status: 400 });
    }

    const selectedPage = pages[0];
    const pageId = selectedPage.id;
    const pageName = selectedPage.name;
    const pageAccessToken = selectedPage.access_token;

    // အဆင့် ၃။ Supabase Database ထဲသို့ ဆိုင်အချက်အလက်နှင့် ၇ ရက် Trial သွင်းခြင်း
    currentStep = '3. Save to Supabase Database';
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
      return NextResponse.json({ 
        failed_at: 'Step 3 - Supabase DB Error', 
        message: dbError.message,
        details: dbError.details 
      }, { status: 500 });
    }

    // အဆင့် ၄။ Webhook ချိတ်ဆက်ခြင်း (Non-blocking)
    currentStep = '4. Subscribe Webhook';
    try {
      await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=messages&access_token=${pageAccessToken}`,
        { method: 'POST' }
      );
    } catch (subErr) {
      console.log('Subscribed apps notice:', subErr);
    }

    // အဆင့် ၅။ Dashboard ဆီ အောင်မြင်စွာ ခေါ်ဆောင်သွားခြင်း
    return NextResponse.redirect(`${appUrl}/admin?store_id=${store.id}&trial=success`);

  } catch (error: any) {
    console.error('Fatal Catch Error:', error);
    return NextResponse.json(
      {
        failed_at_step: currentStep,
        error_name: error.name,
        error_message: error.message,
        cause: error.cause ? String(error.cause) : null,
      },
      { status: 500 }
    );
  }
}