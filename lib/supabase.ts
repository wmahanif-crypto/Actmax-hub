import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://eitgfkufambdbvnlccwx.supabase.co"
const supabaseAnonKey = "sb_publishable_ViZdwOAbctGk4SqYrOA_Wg_Q3X92txx" // Guna Anon Key kau

export const supabase = createClient(supabaseUrl, supabaseAnonKey)