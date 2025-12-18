import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// 서버 사이드 클라이언트 (service_role 키 사용)
// 이 클라이언트는 RLS를 우회하고 모든 권한을 가집니다
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// 클라이언트 사이드용 (anon 키 - 프런트엔드에서 사용할 경우)
export const supabaseAnon = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export default supabase



