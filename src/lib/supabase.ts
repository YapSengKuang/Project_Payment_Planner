import { createClient } from '@supabase/supabase-js'
import { supabaseConfigProblem } from './supabase-config'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supabase = supabaseConfigProblem(url, key) === null ? createClient(url, key) : null
