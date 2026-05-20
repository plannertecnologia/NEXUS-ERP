import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'nexuserp-auth',
  }
})

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_EMPRESA' | 'FUNCIONARIO'

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  company_id: string | null
  avatar?: string
}
