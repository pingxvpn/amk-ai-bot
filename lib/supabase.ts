import { createClient } from '@supabase/supabase-js';

// အကယ်၍ /rest/v1 ပါလာခဲ့ပါက အလိုအလျောက် ဖြတ်ထုတ်ပေးမည့် စနစ်
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);