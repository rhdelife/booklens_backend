# 백엔드 설정 및 연동 가이드

## 📋 설정 단계

### 1. 의존성 설치

```bash
cd booklens2-backend
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=booklens2
DB_USER=postgres
DB_PASSWORD=your_password

# JWT 설정
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# 서버 설정
PORT=3000
NODE_ENV=development

# CORS 설정 (프런트엔드 URL)
CORS_ORIGIN=http://localhost:5173

# OAuth 설정
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

### 3. PostgreSQL 데이터베이스 설정

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE booklens2;

# 데이터베이스 선택
\c booklens2

# 스키마 적용
\i database/schema.sql
```

또는 명령줄에서 직접:

```bash
psql -U postgres -d booklens2 -f database/schema.sql
```

### 4. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 🔗 프런트엔드 연동

### 프런트엔드 환경 변수 설정

프런트엔드 프로젝트의 `.env` 파일에 다음을 추가:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 연동 확인

1. 백엔드 서버 실행 확인:
   ```bash
   curl http://localhost:3000/api/health
   ```
   응답: `{"status":"ok","message":"BookLens2 API Server is running"}`

2. 프런트엔드에서 로그인 테스트:
   - 로그인 페이지에서 이메일/비밀번호로 로그인
   - OAuth 버튼 클릭하여 구글/네이버 로그인 테스트

## 🔐 OAuth 설정

### 구글 OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **API 및 서비스** > **사용자 인증 정보** 이동
4. **OAuth 클라이언트 ID** 생성
5. 애플리케이션 유형: **웹 애플리케이션**
6. 승인된 리디렉션 URI:
   - `http://localhost:5173/auth/google/callback` (개발)
   - `https://yourdomain.com/auth/google/callback` (프로덕션)
7. Client ID와 Client Secret을 `.env`에 설정

### 네이버 OAuth

1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. **내 애플리케이션** > **애플리케이션 등록**
3. 애플리케이션 정보 입력:
   - 애플리케이션 이름: BookLens
   - 사용 API: 네이버 로그인
   - 로그인 오픈 API 서비스 환경: PC 웹
   - 서비스 URL: `http://localhost:5173`
   - Callback URL: `http://localhost:5173/auth/naver/callback`
4. Client ID와 Client Secret을 `.env`에 설정

## 🧪 테스트

### API 테스트 (curl)

```bash
# Health check
curl http://localhost:3000/api/health

# 회원가입
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 현재 사용자 정보 (토큰 필요)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 문제 해결

### 데이터베이스 연결 오류

- PostgreSQL이 실행 중인지 확인: `pg_isready`
- 데이터베이스 이름, 사용자, 비밀번호가 `.env`와 일치하는지 확인

### CORS 오류

- `.env`의 `CORS_ORIGIN`이 프런트엔드 URL과 일치하는지 확인
- 프런트엔드가 `http://localhost:5173`에서 실행 중인지 확인

### OAuth 오류

- Client ID와 Client Secret이 올바른지 확인
- 리디렉션 URI가 OAuth 제공자 설정과 일치하는지 확인
- 백엔드와 프런트엔드의 `.env` 설정이 일치하는지 확인

## 📚 추가 리소스

- [Express 공식 문서](https://expressjs.com/)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [JWT 공식 문서](https://jwt.io/)



