import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pkg

// DATABASE_URL이 있으면 사용 (Supabase 연결 문자열), 없으면 개별 설정 사용
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      // Supabase는 SSL 연결 필요 (로컬/프로덕션 모두)
      ssl: process.env.DATABASE_URL.includes('supabase') 
        ? { rejectUnauthorized: false } 
        : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'booklens2',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      // Supabase 사용 시 SSL 필요
      ssl: (process.env.DB_HOST && process.env.DB_HOST.includes('supabase')) 
        ? { rejectUnauthorized: false } 
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }

const pool = new Pool(poolConfig)

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ Database connected')
})

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message)
  // 연결 실패해도 서버는 계속 실행 (Supabase 클라이언트 사용 가능)
})

// 연결 실패해도 서버는 계속 실행 (Supabase 클라이언트 사용)
// 실제 연결은 쿼리 실행 시점에 이루어짐

export default pool



