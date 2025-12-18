-- 프로필 필드 추가 마이그레이션
-- 기존 데이터베이스에 프로필 필드를 추가하는 스크립트

-- users 테이블에 프로필 필드 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100),
ADD COLUMN IF NOT EXISTS alias VARCHAR(50),
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 기존 사용자의 nickname을 name으로 초기화 (선택사항)
UPDATE users 
SET nickname = name 
WHERE nickname IS NULL AND name IS NOT NULL;



