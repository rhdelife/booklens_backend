import express from 'express'
import {
  login,
  signup,
  startGoogleOAuth,
  startNaverOAuth,
  googleCallback,
  naverCallback,
  getCurrentUser,
  updateProfile,
  uploadProfileImage,
} from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 일반 인증
router.post('/login', login)
router.post('/signup', signup)
router.get('/me', authenticate, getCurrentUser)

// 프로필 관리 (인증 필요)
router.put('/profile', authenticate, updateProfile)
router.post('/profile/image', authenticate, uploadProfileImage)

// OAuth 인증 시작
router.get('/google', startGoogleOAuth)
router.get('/naver', startNaverOAuth)

// OAuth 콜백 (GET으로 변경 - OAuth 제공자가 GET으로 리다이렉트)
router.get('/google/callback', googleCallback)
router.get('/naver/callback', naverCallback)

export default router

