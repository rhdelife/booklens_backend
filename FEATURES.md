# BookLens2 Backend 기능 설명서

BookLens2는 독서 관리 및 커뮤니티 플랫폼을 위한 백엔드 API 서버입니다.

## 📚 주요 기능

### 1. 사용자 인증 및 프로필 관리

#### 일반 인증
- **회원가입** (`POST /api/auth/signup`)
  - 이메일, 비밀번호, 이름으로 회원가입
  - 비밀번호는 bcrypt로 해싱되어 저장
  - 가입 시 자동 로그인 (JWT 토큰 발급)

- **로그인** (`POST /api/auth/login`)
  - 이메일과 비밀번호로 로그인
  - 로그인 성공 시 JWT 토큰 발급
  - 토큰은 7일간 유효 (기본값)

- **현재 사용자 정보 조회** (`GET /api/auth/me`)
  - 인증된 사용자의 정보 조회
  - JWT 토큰 필요

#### OAuth 소셜 로그인
- **Google OAuth 로그인**
  - `GET /api/auth/google` - Google OAuth 시작
  - `GET /api/auth/google/callback` - Google OAuth 콜백 처리
  - Google 계정으로 간편 로그인
  - 자동 회원가입 지원

- **네이버 OAuth 로그인**
  - `GET /api/auth/naver` - 네이버 OAuth 시작
  - `GET /api/auth/naver/callback` - 네이버 OAuth 콜백 처리
  - 네이버 계정으로 간편 로그인
  - 자동 회원가입 지원

#### 프로필 관리
- **프로필 수정** (`PUT /api/auth/profile`)
  - 이름, 닉네임, 별명, 소개글 수정
  - 프로필 이미지 URL 업데이트

- **프로필 이미지 업로드** (`POST /api/auth/profile/image`)
  - Base64 이미지 데이터 업로드
  - 프로필 이미지 URL 저장

---

### 2. 도서 관리 (Books)

사용자가 읽고 있는 책을 관리하는 기능입니다.

#### 도서 목록 조회 (`GET /api/books`)
- 현재 로그인한 사용자의 모든 도서 목록 조회
- 읽기 상태별 필터링 가능 (not_started, reading, completed)
- 진행률, 읽은 페이지 수 등 정보 포함

#### 도서 상세 정보 (`GET /api/books/:id`)
- 특정 도서의 상세 정보 조회
- 제목, 저자, 출판사, 설명, 썸네일 등
- 읽은 페이지, 진행률, 메모 등

#### 도서 추가 (`POST /api/books`)
- 새로운 도서를 내 서재에 추가
- Google Books API에서 가져온 정보 또는 수동 입력
- ISBN, 제목, 저자, 출판사, 설명 등 저장

#### 도서 수정 (`PUT /api/books/:id`)
- 도서 정보 수정
- 읽은 페이지, 진행률, 상태, 메모 등 업데이트
- 읽기 시작일, 완료일 설정

#### 도서 삭제 (`DELETE /api/books/:id`)
- 내 서재에서 도서 삭제
- 관련 독서 세션, 포스팅은 유지 (book_id는 NULL로 설정)

---

### 3. 독서 세션 관리 (Reading Sessions)

실제 독서 활동을 기록하고 추적하는 기능입니다.

#### 독서 세션 시작 (`POST /api/reading-sessions`)
- 새로운 독서 세션 시작
- 시작 시간, 시작 페이지 기록
- 한 번에 하나의 활성 세션만 가능

#### 활성 세션 조회 (`GET /api/reading-sessions/active`)
- 현재 진행 중인 독서 세션 조회
- 시작 시간, 시작 페이지 확인
- 실시간 독서 추적

#### 독서 세션 종료 (`PUT /api/reading-sessions/:id`)
- 진행 중인 독서 세션 종료
- 종료 시간, 종료 페이지 기록
- 독서 시간 자동 계산
- 도서의 읽은 페이지 수 자동 업데이트

#### 독서 세션 목록 (`GET /api/reading-sessions`)
- 사용자의 모든 독서 세션 기록 조회
- 날짜별, 도서별 필터링 가능
- 독서 통계 계산에 활용

---

### 4. 포스팅 및 커뮤니티 (Postings)

책에 대한 리뷰와 감상을 공유하는 커뮤니티 기능입니다.

#### 포스팅 목록 조회 (`GET /api/postings`)
- 모든 사용자의 포스팅 목록 조회
- 최신순, 인기순 정렬
- 특정 도서 관련 포스팅 필터링
- 좋아요 수, 댓글 수 포함

#### 포스팅 상세 조회 (`GET /api/postings/:id`)
- 특정 포스팅의 상세 정보
- 작성자 정보, 내용, 평점
- 관련 도서 정보
- 좋아요, 댓글 목록

#### 포스팅 작성 (`POST /api/postings`)
- 새로운 포스팅 작성
- 제목, 내용, 평점(1-5점) 입력
- 관련 도서 연결
- 태그 추가 가능

#### 포스팅 수정 (`PUT /api/postings/:id`)
- 본인이 작성한 포스팅 수정
- 제목, 내용, 평점 수정 가능

#### 포스팅 삭제 (`DELETE /api/postings/:id`)
- 본인이 작성한 포스팅 삭제
- 관련 좋아요, 댓글도 함께 삭제

---

### 5. 데이터베이스 구조

#### 주요 테이블
- **users**: 사용자 정보
- **books**: 도서 정보
- **reading_sessions**: 독서 세션 기록
- **postings**: 포스팅/리뷰
- **tags**: 태그
- **posting_tags**: 포스팅-태그 연결
- **likes**: 좋아요
- **comments**: 댓글
- **bookmarks**: 북마크
- **locations**: 도서관/서점 위치 정보
- **inventory**: 도서관/서점 재고 정보

---

## 🔐 보안 기능

### 인증 및 권한
- **JWT 토큰 기반 인증**
  - 모든 API 요청에 토큰 필요
  - 토큰 만료 시간 설정 가능
  - 토큰 검증 미들웨어

- **비밀번호 보안**
  - bcrypt를 사용한 비밀번호 해싱
  - 평문 비밀번호는 절대 저장하지 않음

- **OAuth 보안**
  - CSRF 방지를 위한 state 파라미터 검증
  - 쿠키 기반 state 저장 (httpOnly, secure)
  - OAuth 제공자 검증

### CORS 설정
- 프론트엔드 도메인만 허용
- credentials 지원
- 안전한 헤더 설정

---

## 📊 주요 데이터 흐름

### 1. 사용자 가입 및 로그인
```
사용자 → 회원가입/로그인 → JWT 토큰 발급 → 토큰으로 API 접근
```

### 2. OAuth 로그인
```
사용자 → OAuth 시작 → OAuth 제공자 인증 → 콜백 처리 → 사용자 생성/조회 → JWT 토큰 발급 → 프론트엔드 리디렉션
```

### 3. 도서 추가 및 독서 시작
```
도서 검색 → 도서 추가 → 독서 세션 시작 → 독서 진행 → 세션 종료 → 진행률 업데이트
```

### 4. 포스팅 작성 및 공유
```
도서 읽기 완료 → 포스팅 작성 → 커뮤니티에 공유 → 다른 사용자 좋아요/댓글
```

---

## 🛠️ 기술 스택

- **런타임**: Node.js
- **프레임워크**: Express.js
- **데이터베이스**: PostgreSQL (Supabase)
- **인증**: JWT, OAuth 2.0
- **보안**: bcryptjs, CORS
- **HTTP 클라이언트**: axios

---

## 📡 API 엔드포인트 요약

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보
- `GET /api/auth/google` - Google OAuth 시작
- `GET /api/auth/google/callback` - Google OAuth 콜백
- `GET /api/auth/naver` - 네이버 OAuth 시작
- `GET /api/auth/naver/callback` - 네이버 OAuth 콜백
- `PUT /api/auth/profile` - 프로필 수정
- `POST /api/auth/profile/image` - 프로필 이미지 업로드

### 도서 관리
- `GET /api/books` - 도서 목록
- `GET /api/books/:id` - 도서 상세
- `POST /api/books` - 도서 추가
- `PUT /api/books/:id` - 도서 수정
- `DELETE /api/books/:id` - 도서 삭제

### 독서 세션
- `GET /api/reading-sessions/active` - 활성 세션 조회
- `GET /api/reading-sessions` - 세션 목록
- `POST /api/reading-sessions` - 세션 시작
- `PUT /api/reading-sessions/:id` - 세션 종료

### 포스팅
- `GET /api/postings` - 포스팅 목록
- `GET /api/postings/:id` - 포스팅 상세
- `POST /api/postings` - 포스팅 작성
- `PUT /api/postings/:id` - 포스팅 수정
- `DELETE /api/postings/:id` - 포스팅 삭제

---

## 🎯 주요 사용 사례

1. **독서 관리**
   - 읽고 싶은 책 목록 관리
   - 현재 읽고 있는 책 추적
   - 읽은 책 기록 및 통계

2. **독서 활동 기록**
   - 독서 시간 추적
   - 읽은 페이지 기록
   - 독서 습관 분석

3. **커뮤니티 활동**
   - 책에 대한 리뷰 작성
   - 다른 사용자의 리뷰 읽기
   - 좋아요 및 댓글으로 소통

4. **프로필 관리**
   - 개인 정보 수정
   - 프로필 이미지 설정
   - 독서 통계 확인

---

## 📝 참고사항

- 모든 API는 JWT 토큰 인증이 필요합니다 (인증 관련 API 제외)
- OAuth 로그인은 백엔드에서 처리되며, 프론트엔드는 콜백 URL로 리디렉션됩니다
- 데이터베이스는 PostgreSQL을 사용하며, Supabase를 통해 호스팅할 수 있습니다
- 프로덕션 환경에서는 반드시 환경 변수를 안전하게 관리하세요

