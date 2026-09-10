import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function check() {
  const { data, error } = await supabase.from('users').select('*');
  console.log('Users in DB:', data);
  if (error) console.error(error);
}
check();
