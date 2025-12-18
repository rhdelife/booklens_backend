import express from 'express'
import {
  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
} from '../controllers/bookController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 모든 라우트는 인증 필요
router.use(authenticate)

router.get('/', getBooks)
router.get('/:id', getBookById)
router.post('/', addBook)
router.put('/:id', updateBook)
router.delete('/:id', deleteBook)

export default router



