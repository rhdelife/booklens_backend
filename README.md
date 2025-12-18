# BookLens2 Backend API Server

BookLens2 프로젝트의 백엔드 API 서버입니다.

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Supabase 설정 (필수)
SUPABASE_URL=https://ueffydcywfamsxdiggym.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# JWT 설정
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# 서버 설정
PORT=3000
NODE_ENV=development

# CORS 설정 (프론트엔드 URL)
CORS_ORIGIN=http://localhost:5173

# OAuth 설정 (선택사항)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
NAVER_REDIRECT_URI=http://localhost:3000/api/auth/naver/callback

# 배포 환경 설정 (프로덕션)
BACKEND_URL=https://your-backend.onrender.com
```

### 3. Supabase 데이터베이스 설정

1. Supabase 대시보드에서 SQL Editor 열기
2. `database/schema.sql` 파일의 내용 실행
3. `database/migration_add_profile_fields.sql` 실행 (필요시)

### 4. 서버 실행

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 📡 API 엔드포인트

### Health Check
- `GET /api/health` - 서버 상태 확인

### 인증 (Auth)
- `POST /api/auth/login` - 로그인
- `POST /api/auth/signup` - 회원가입
- `GET /api/auth/me` - 현재 사용자 정보 (인증 필요)
- `PUT /api/auth/profile` - 프로필 업데이트 (인증 필요)
- `POST /api/auth/profile/image` - 프로필 이미지 업로드 (인증 필요)
- `GET /api/auth/google` - 구글 OAuth 시작
- `GET /api/auth/google/callback` - 구글 OAuth 콜백
- `GET /api/auth/naver` - 네이버 OAuth 시작
- `GET /api/auth/naver/callback` - 네이버 OAuth 콜백

### 책 (Books)
모든 엔드포인트는 인증이 필요합니다.
- `GET /api/books` - 내 도서 목록
- `GET /api/books/:id` - 책 상세 정보
- `POST /api/books` - 책 추가
- `PUT /api/books/:id` - 책 수정
- `DELETE /api/books/:id` - 책 삭제

### 포스팅 (Postings)
모든 엔드포인트는 인증이 필요합니다.
- `GET /api/postings` - 포스팅 목록
- `GET /api/postings/:id` - 포스팅 상세
- `POST /api/postings` - 포스팅 작성
- `PUT /api/postings/:id` - 포스팅 수정
- `DELETE /api/postings/:id` - 포스팅 삭제

### 독서 세션 (Reading Sessions)
모든 엔드포인트는 인증이 필요합니다.
- `GET /api/reading-sessions/active` - 활성 세션 조회
- `GET /api/reading-sessions` - 세션 목록
- `POST /api/reading-sessions` - 세션 시작
- `PUT /api/reading-sessions/:id` - 세션 종료

## 🔐 인증

대부분의 API는 JWT 토큰 인증이 필요합니다. 요청 헤더에 다음을 포함하세요:

```
Authorization: Bearer <your_token>
```

## 🔄 OAuth 설정

### 구글 OAuth

#### 개발 환경
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 클라이언트 ID 생성
3. 리디렉션 URI 추가: `http://localhost:3000/api/auth/google/callback`
4. `.env` 파일에 `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET` 설정

#### 프로덕션 환경 (Render)
1. Google Cloud Console에서 OAuth 클라이언트 ID 생성
2. **리디렉션 URI 추가: `https://your-backend.onrender.com/api/auth/google/callback`** ⚠️ 중요!
3. Render 환경 변수 설정:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `BACKEND_URL=https://your-backend.onrender.com`

### 네이버 OAuth

#### 개발 환경
1. [네이버 개발자 센터](https://developers.naver.com/)에서 애플리케이션 등록
2. 네이버 로그인 API 선택
3. Callback URL 설정: `http://localhost:3000/api/auth/naver/callback`
4. `.env` 파일에 `NAVER_CLIENT_ID`와 `NAVER_CLIENT_SECRET` 설정

#### 프로덕션 환경 (Render)
1. 네이버 개발자 센터에서 애플리케이션 등록
2. **Callback URL 설정: `https://your-backend.onrender.com/api/auth/naver/callback`** ⚠️ 중요!
3. Render 환경 변수 설정:
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`
   - `BACKEND_URL=https://your-backend.onrender.com`

### ⚠️ 중요: OAuth Redirect URI 설정

OAuth 제공자(구글, 네이버)에 등록된 **리디렉션 URI는 백엔드 서버의 콜백 URL**이어야 합니다:
- ✅ 올바른 예: `https://your-backend.onrender.com/api/auth/google/callback`
- ❌ 잘못된 예: `https://your-frontend.onrender.com/auth/google/callback`

프론트엔드는 백엔드의 OAuth 시작 엔드포인트(`/api/auth/google`)로 리다이렉트하고, 백엔드가 OAuth 제공자로 리다이렉트합니다.

## 📁 프로젝트 구조

```
booklens2-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # 데이터베이스 연결 (PostgreSQL)
│   │   └── supabase.js         # Supabase 클라이언트 설정
│   ├── controllers/
│   │   ├── authController.js   # 인증 컨트롤러
│   │   ├── bookController.js   # 책 컨트롤러
│   │   ├── postingController.js # 포스팅 컨트롤러
│   │   └── readingSessionController.js # 독서 세션 컨트롤러
│   ├── middleware/
│   │   ├── auth.js             # 인증 미들웨어
│   │   └── errorHandler.js     # 에러 핸들러
│   ├── routes/
│   │   ├── authRoutes.js       # 인증 라우트
│   │   ├── bookRoutes.js       # 책 라우트
│   │   ├── postingRoutes.js    # 포스팅 라우트
│   │   └── readingSessionRoutes.js # 독서 세션 라우트
│   └── server.js               # 서버 진입점
├── database/
│   ├── schema.sql              # 데이터베이스 스키마
│   └── migration_add_profile_fields.sql # 프로필 필드 마이그레이션
├── .env                        # 환경 변수 (git에 포함하지 않음)
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ 기술 스택

- **Node.js** - 런타임 환경
- **Express** - 웹 프레임워크
- **Supabase** - 데이터베이스 및 인증
- **PostgreSQL** - 데이터베이스 (Supabase)
- **JWT** - 인증 토큰
- **bcryptjs** - 비밀번호 해싱
- **axios** - HTTP 클라이언트 (OAuth용)

## 📝 참고사항

- 프로덕션 환경에서는 반드시 `JWT_SECRET`을 강력한 랜덤 문자열로 변경하세요
- Supabase Service Role Key는 서버 사이드에서만 사용하고, 절대 클라이언트에 노출하지 마세요
- CORS 설정은 프로덕션 환경에 맞게 조정하세요
- 환경 변수는 `.env` 파일에 저장하고 `.gitignore`에 포함되어 있습니다

## 🔗 프론트엔드 연동

프론트엔드 프로젝트의 `.env.local` 파일에 다음을 추가:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

자세한 내용은 `BACKEND_SETUP.md`를 참고하세요.
