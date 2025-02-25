import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orecskavelwbthlsmrbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZWNza2F2ZWx3YnRobHNtcmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyMTgyNTAsImV4cCI6MjA1NTc5NDI1MH0.EFhBN3inBVzZsSzkCUsJy8En0Fgawmvvw-8Aqj_Ddnw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
