const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variable');
}

// Service-role client for backend operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Anon client for public-facing operations if needed
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase, supabaseAnon };
