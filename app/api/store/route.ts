import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ၁။ ဆိုင်အချက်အလက်နှင့် ပစ္စည်းစာရင်း ဆွဲယူခြင်း (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('store_id');

  if (!storeId) {
    return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
  }

  try {
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ success: true, store, products: products || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ၂။ ဆိုင်အချက်အလက် ပြင်ဆင်ခြင်းနှင့် ပစ္စည်း အသစ်ထည့်/ဖျက်ခြင်း (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, storeId, storeData, productData, productId } = body;

    // ဆိုင်အချက်အလက်များ သိမ်းခြင်း
    if (action === 'update_store') {
      const { error } = await supabaseAdmin
        .from('stores')
        .update({
          store_name: storeData.store_name,
          phone: storeData.phone,
          address: storeData.address,
          operating_hours: storeData.operating_hours,
          delivery_info: storeData.delivery_info,
          payment_info: storeData.payment_info,
        })
        .eq('id', storeId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // ပစ္စည်းအသစ် ထည့်သွင်းခြင်း
    if (action === 'add_product') {
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert({
          store_id: storeId,
          name: productData.name,
          price: productData.price,
          promo_price: productData.promo_price || null,
          specs: productData.specs || null,
          in_stock: true,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, product: data });
    }

    // ပစ္စည်း ဖျက်ခြင်း
    if (action === 'delete_product') {
      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}