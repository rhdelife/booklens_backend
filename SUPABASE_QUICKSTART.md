# Supabase 빠른 시작 가이드

## 🚀 5분 안에 시작하기

### 1단계: Supabase 프로젝트 생성 (2분)

1. [supabase.com](https://supabase.com) 접속 → "Start your project"
2. GitHub로 로그인
3. "New Project" 클릭
4. 정보 입력:
   - Name: `booklens2`
   - Database Password: **강력한 비밀번호 생성** (저장 필수!)
   - Region: `Northeast Asia (Seoul)` 선택
5. "Create new project" 클릭 → 2-3분 대기

### 2단계: API 키 복사 (1분)

1. 프로젝트 대시보드 → **Settings** (왼쪽 하단) → **API**
2. 다음 정보 복사:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (비밀!)
   ```

### 3단계: 환경 변수 설정 (1분)

`booklens2-backend/.env` 파일 수정:

```env
# Supabase 설정
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 기존 PostgreSQL 설정 주석 처리
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=booklens2
# DB_USER=postgres
# DB_PASSWORD=your_password

# 나머지 설정은 그대로 유지
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 4단계: 데이터베이스 스키마 적용 (1분)

1. Supabase 대시보드 → **SQL Editor** (왼쪽 메뉴)
2. **New query** 클릭
3. `database/schema.sql` 파일 내용 복사 → 붙여넣기
4. **Run** 버튼 클릭
5. ✅ 성공 메시지 확인

### 5단계: 패키지 설치 및 실행

```bash
cd booklens2-backend

# Supabase 클라이언트 설치
npm install @supabase/supabase-js

# 서버 실행
npm run dev
```

---

## 📝 다음 단계: 코드 마이그레이션

### 1. 데이터베이스 연결 변경

`src/config/database.js` 파일을 `src/config/supabase.js`로 교체 (이미 생성됨)

### 2. 컨트롤러 수정

모든 컨트롤러에서:
- `pool.query()` → `supabase.from().select()` 등으로 변경
- 예시: `src/controllers/authController.supabase.example.js` 참고

### 3. 테스트

```bash
# 서버 실행
npm run dev

# 다른 터미널에서 테스트
curl http://localhost:3000/api/health
```

---

## 🔄 쿼리 변환 가이드

### SELECT
```javascript
// 기존
const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])

// Supabase
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single()
```

### INSERT
```javascript
// 기존
const result = await pool.query(
  'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
  [email, name]
)

// Supabase
const { data, error } = await supabase
  .from('users')
  .insert({ email, name })
  .select()
  .single()
```

### UPDATE
```javascript
// 기존
const result = await pool.query(
  'UPDATE users SET name = $1 WHERE id = $2 RETURNING *',
  [name, id]
)

// Supabase
const { data, error } = await supabase
  .from('users')
  .update({ name })
  .eq('id', id)
  .select()
  .single()
```

### DELETE
```javascript
// 기존
const result = await pool.query('DELETE FROM users WHERE id = $1', [id])

// Supabase
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', id)
```

---

## ⚠️ 주의사항

1. **service_role 키는 절대 프런트엔드에 노출하지 마세요!**
2. **데이터베이스 비밀번호는 안전하게 보관하세요**
3. **RLS (Row Level Security) 설정을 고려하세요**

---

## 🆘 문제 해결

### 연결 오류
- Supabase URL과 키가 올바른지 확인
- `.env` 파일이 제대로 로드되는지 확인

### 쿼리 오류
- Supabase 메서드 문법 확인
- 에러 메시지 확인: `console.error(error)`

### 테이블 없음 오류
- SQL Editor에서 스키마가 제대로 적용되었는지 확인
- Table Editor에서 테이블 목록 확인

---

## 📚 더 알아보기

- [전체 마이그레이션 가이드](./SUPABASE_MIGRATION.md)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)



