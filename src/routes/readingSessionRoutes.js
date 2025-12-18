import express from 'express'
import {
  startSession,
  endSession,
  getActiveSession,
  getSessions,
} from '../controllers/readingSessionController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 모든 라우트는 인증 필요
router.use(authenticate)

router.get('/active', getActiveSession)
router.get('/', getSessions)
router.post('/', startSession)
router.put('/:id', endSession)

export default router



