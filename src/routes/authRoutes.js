import express from 'express'
import {
  login,
  signup,
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

// OAuth 인증
router.get('/google/callback', googleCallback)
router.get('/naver/callback', naverCallback)

export default router

