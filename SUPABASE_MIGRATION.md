# Supabase 마이그레이션 가이드

PostgreSQL에서 Supabase로 마이그레이션하는 단계별 가이드입니다.

## 📋 목차

1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [데이터베이스 스키마 적용](#2-데이터베이스-스키마-적용)
3. [Supabase 클라이언트 설정](#3-supabase-클라이언트-설정)
4. [백엔드 코드 수정](#4-백엔드-코드-수정)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [인증 시스템 통합](#6-인증-시스템-통합)

---

## 1. Supabase 프로젝트 생성

### 1.1 Supabase 계정 생성

1. [Supabase](https://supabase.com/) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인 (또는 이메일 가입)

### 1.2 새 프로젝트 생성

1. "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `booklens2` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 생성 (저장 필수!)
   - **Region**: 가장 가까운 리전 선택 (예: Northeast Asia (Seoul))
3. "Create new project" 클릭
4. 프로젝트 생성 완료까지 2-3분 대기

### 1.3 프로젝트 정보 확인

프로젝트 대시보드에서 다음 정보 확인:
- **Project URL**: `https://xxxxx.supabase.co`
- **API Key (anon/public)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **API Key (service_role)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (비밀!)

---

## 2. 데이터베이스 스키마 적용

### 2.1 SQL Editor 사용

1. Supabase 대시보드에서 **SQL Editor** 메뉴 클릭
2. **New query** 클릭
3. `database/schema.sql` 파일의 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭하여 실행

### 2.2 또는 Table Editor 사용

1. **Table Editor** 메뉴에서 수동으로 테이블 생성
2. 각 테이블의 컬럼과 제약조건 설정

### 2.3 스키마 확인

**Table Editor**에서 다음 테이블들이 생성되었는지 확인:
- ✅ users
- ✅ books
- ✅ reading_sessions
- ✅ postings
- ✅ tags
- ✅ posting_tags
- ✅ locations
- ✅ inventory
- ✅ likes
- ✅ comments
- ✅ bookmarks

---

## 3. Supabase 클라이언트 설정

### 3.1 패키지 설치

```bash
cd booklens2-backend
npm install @supabase/supabase-js
```

### 3.2 Supabase 클라이언트 생성

`src/config/supabase.js` 파일 생성:

```javascript
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // 서버 사이드용

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// 서버 사이드 클라이언트 (service_role 키 사용)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 클라이언트 사이드용 (anon 키 - 프런트엔드에서 사용)
export const supabaseAnon = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY
)
```

---

## 4. 백엔드 코드 수정

### 4.1 데이터베이스 연결 변경

기존 `src/config/database.js`를 Supabase 클라이언트로 교체:

```javascript
// src/config/database.js
import { supabase } from './supabase.js'

// Supabase는 클라이언트를 직접 사용하므로 pool 대신 supabase 사용
export default supabase
```

### 4.2 쿼리 문법 변경

Supabase는 PostgreSQL 쿼리를 직접 사용할 수 있지만, 더 편리한 메서드를 제공합니다.

#### 기존 PostgreSQL 쿼리:
```javascript
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
)
```

#### Supabase 쿼리:
```javascript
// 방법 1: Supabase 메서드 사용 (권장)
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single()

// 방법 2: RPC 사용 (복잡한 쿼리)
const { data, error } = await supabase.rpc('function_name', { param: value })

// 방법 3: SQL 직접 실행 (고급)
const { data, error } = await supabase.rpc('exec_sql', {
  query: 'SELECT * FROM users WHERE email = $1',
  params: [email]
})
```

### 4.3 컨트롤러 수정 예시

`src/controllers/authController.js` 수정:

```javascript
import supabase from '../config/supabase.js'

// 로그인 예시
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Supabase Auth 사용 (권장)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // 또는 직접 쿼리
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, email, name, nickname, alias, profile_image_url, bio')
      .eq('email', email)
      .single()

    if (queryError || !user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // 비밀번호 확인 (bcrypt 사용)
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // JWT 토큰 생성
    const token = generateToken(user.id)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        alias: user.alias,
        profile_image_url: user.profile_image_url,
        bio: user.bio,
      },
      token,
    })
  } catch (error) {
    next(error)
  }
}
```

---

## 5. 환경 변수 설정

### 5.1 백엔드 `.env` 파일 수정

```env
# Supabase 설정
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 기존 PostgreSQL 설정 제거 또는 주석 처리
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=booklens2
# DB_USER=postgres
# DB_PASSWORD=your_password

# JWT 설정 (유지)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 서버 설정 (유지)
PORT=3000
NODE_ENV=development

# CORS 설정 (유지)
CORS_ORIGIN=http://localhost:5173

# OAuth 설정 (유지)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

### 5.2 Supabase API 키 찾기

1. Supabase 대시보드 → **Settings** → **API**
2. 다음 정보 복사:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** 키 → `SUPABASE_ANON_KEY`
   - **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY` (비밀!)

⚠️ **주의**: `service_role` 키는 서버 사이드에서만 사용하고, 절대 프런트엔드에 노출하지 마세요!

---

## 6. 인증 시스템 통합

### 6.1 옵션 1: Supabase Auth 사용 (권장)

Supabase의 내장 인증 시스템을 사용하면 더 간단합니다.

#### 장점:
- 이메일/비밀번호 인증 자동 처리
- OAuth 통합 (구글, 네이버 등)
- 세션 관리 자동화
- 비밀번호 재설정 기능

#### 백엔드 수정:

```javascript
// Supabase Auth 사용
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    // 사용자 정보 가져오기
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        // ...
      },
      token: data.session.access_token,
    })
  } catch (error) {
    next(error)
  }
}
```

### 6.2 옵션 2: 기존 JWT 시스템 유지

기존 JWT 인증 시스템을 그대로 사용할 수도 있습니다.

---

## 7. 마이그레이션 체크리스트

### 백엔드
- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 적용
- [ ] `@supabase/supabase-js` 패키지 설치
- [ ] `src/config/supabase.js` 생성
- [ ] 모든 컨트롤러의 쿼리 문법 변경
- [ ] 환경 변수 업데이트
- [ ] 테스트 실행

### 프런트엔드 (선택사항)
- [ ] Supabase 클라이언트 설정 (직접 사용하는 경우)
- [ ] API 엔드포인트 확인

---

## 8. 주요 변경사항 요약

### 쿼리 문법 비교

| 작업 | PostgreSQL | Supabase |
|------|-----------|----------|
| SELECT | `pool.query('SELECT * FROM users')` | `supabase.from('users').select('*')` |
| INSERT | `pool.query('INSERT INTO ...')` | `supabase.from('users').insert({...})` |
| UPDATE | `pool.query('UPDATE ...')` | `supabase.from('users').update({...}).eq('id', id)` |
| DELETE | `pool.query('DELETE FROM ...')` | `supabase.from('users').delete().eq('id', id)` |
| WHERE | `WHERE email = $1` | `.eq('email', email)` |
| JOIN | SQL JOIN | `.select('*, other_table(*)')` |

### 에러 처리

```javascript
// Supabase는 항상 { data, error } 반환
const { data, error } = await supabase.from('users').select('*')

if (error) {
  console.error('Error:', error.message)
  return res.status(500).json({ error: error.message })
}

// data 사용
res.json({ users: data })
```

---

## 9. 다음 단계

1. **Row Level Security (RLS) 설정**: Supabase의 보안 기능 활성화
2. **Realtime 기능**: 실시간 업데이트 활용
3. **Storage**: 프로필 이미지 등 파일 저장
4. **Edge Functions**: 서버리스 함수 활용

---

## 10. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [PostgreSQL에서 Supabase로 마이그레이션](https://supabase.com/docs/guides/database)

---

## 문제 해결

### 연결 오류
- Supabase URL과 API 키가 올바른지 확인
- 네트워크 방화벽 설정 확인

### 쿼리 오류
- Supabase 메서드 문법 확인
- RLS 정책 확인 (테이블 접근 권한)

### 인증 오류
- Supabase Auth 설정 확인
- JWT 시크릿 키 확인



