import express from 'express'
import {
  getPostings,
  getPostingById,
  createPosting,
  updatePosting,
  deletePosting,
} from '../controllers/postingController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 모든 라우트는 인증 필요
router.use(authenticate)

router.get('/', getPostings)
router.get('/:id', getPostingById)
router.post('/', createPosting)
router.put('/:id', updatePosting)
router.delete('/:id', deletePosting)

export default router



