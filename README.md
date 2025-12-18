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

# CORS 설정
CORS_ORIGIN=http://localhost:5173

# OAuth 설정
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

### 3. 데이터베이스 설정

PostgreSQL 데이터베이스를 생성하고 스키마를 적용하세요:

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE booklens2;

# 스키마 적용
\c booklens2
\i database/schema.sql
```

또는 명령줄에서:

```bash
psql -U postgres -d booklens2 -f database/schema.sql
```

### 4. 서버 실행

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 📡 API 엔드포인트

### 인증 (Auth)

- `POST /api/auth/login` - 로그인
- `POST /api/auth/signup` - 회원가입
- `GET /api/auth/me` - 현재 사용자 정보 (인증 필요)
- `POST /api/auth/google/callback` - 구글 OAuth 콜백
- `POST /api/auth/naver/callback` - 네이버 OAuth 콜백

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

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 클라이언트 ID 생성
3. 리디렉션 URI 추가: `http://localhost:5173/auth/google/callback`
4. `.env` 파일에 `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET` 설정

### 네이버 OAuth

1. [네이버 개발자 센터](https://developers.naver.com/)에서 애플리케이션 등록
2. 네이버 로그인 API 선택
3. Callback URL 설정: `http://localhost:5173/auth/naver/callback`
4. `.env` 파일에 `NAVER_CLIENT_ID`와 `NAVER_CLIENT_SECRET` 설정

## 📁 프로젝트 구조

```
booklens2-backend/
├── src/
│   ├── config/
│   │   └── database.js          # 데이터베이스 연결
│   ├── controllers/
│   │   ├── authController.js    # 인증 컨트롤러
│   │   ├── bookController.js    # 책 컨트롤러
│   │   ├── postingController.js # 포스팅 컨트롤러
│   │   └── readingSessionController.js # 독서 세션 컨트롤러
│   ├── middleware/
│   │   ├── auth.js              # 인증 미들웨어
│   │   └── errorHandler.js      # 에러 핸들러
│   ├── routes/
│   │   ├── authRoutes.js        # 인증 라우트
│   │   ├── bookRoutes.js        # 책 라우트
│   │   ├── postingRoutes.js     # 포스팅 라우트
│   │   └── readingSessionRoutes.js # 독서 세션 라우트
│   └── server.js                # 서버 진입점
├── database/
│   └── schema.sql               # 데이터베이스 스키마
├── .env.example                 # 환경 변수 예시
├── package.json
└── README.md
```

## 🛠️ 기술 스택

- **Node.js** - 런타임 환경
- **Express** - 웹 프레임워크
- **PostgreSQL** - 데이터베이스
- **JWT** - 인증 토큰
- **bcryptjs** - 비밀번호 해싱
- **axios** - HTTP 클라이언트 (OAuth용)

## 📝 참고사항

- 프로덕션 환경에서는 반드시 `JWT_SECRET`을 강력한 랜덤 문자열로 변경하세요
- 데이터베이스 비밀번호는 안전하게 관리하세요
- CORS 설정은 프로덕션 환경에 맞게 조정하세요



