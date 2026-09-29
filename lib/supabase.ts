import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Backend API များတွင် အသုံးပြုရန် Admin Client (Row Level Security ကို ကျော်လွန်ခွင့်ရှိသည်)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);