
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yeuscslngjdjluqssfgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlldXNjc2xuZ2pkamx1cXNzZmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NTk4NzcsImV4cCI6MjA2NDQzNTg3N30.Pupr_dY7QCDG1Lvwei4D1CRM2sxSZ6tKDi3OywCVub4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
