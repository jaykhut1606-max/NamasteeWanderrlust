// ═══════════════════════════════════════════
// Supabase Client Configuration
// ═══════════════════════════════════════════
const SUPABASE_URL = 'https://aczvtyyjliocxtmfhflx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjenZ0eXlqbGlvY3h0bWZoZmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTA1MDMsImV4cCI6MjA5MTQ2NjUwM30.NNDnAMOxCEzBYCDcJVQGV6vGi8aLFAIK_2m5Ipa9_UQ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Re-assign to 'supabase' for use across all modules
// This works because the CDN attaches to window.supabase, and our const shadows it in module scope
var supabase = supabaseClient;
