import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mwotlyzhumrbyqovtrma.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13b3RseXpodW1yYnlxb3Z0cm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTgyNjgsImV4cCI6MjA4NzA3NDI2OH0.zWHZ8iOn4P6TLV2eym5t0RHlfGiKWyh_o2iXROJrfl8';

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    console.warn('⚠️ Supabase environment variables are missing! Cloud sync will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'florida-pos-session'
    }
});
