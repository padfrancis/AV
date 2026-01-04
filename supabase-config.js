const SUPABASE_URL = "https://rlgelnedymfzpyiddkna.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZ2VsbmVkeW1menB5aWRka25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODI1ODEsImV4cCI6MjA4Mjc1ODU4MX0.bz2HpMeCe9bsfAxmNgragvqNdN8N5swfy8Y_O1fICSM";
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZ2VsbmVkeW1menB5aWRka25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODI1ODEsImV4cCI6MjA4Mjc1ODU4MX0.bz2HpMeCe9bsfAxmNgragvqNdN8N5swfy8Y_O1fICSM
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Store reference to Supabase library before overwriting
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
window.supabaseClient = supabaseClient;

