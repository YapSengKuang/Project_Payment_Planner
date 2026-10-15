import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
function usableConfig() {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol) && typeof key === 'string' && key.length > 20 && !key.includes('replace-with')
  } catch { return false }
}
export const supabase = usableConfig() ? createClient(url, key) : null
