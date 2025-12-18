import pool from '../config/database.js'

// 내 도서 목록
export const getBooks = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const result = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )

    res.json({ books: result.rows })
  } catch (error) {
    next(error)
  }
}

// 책 상세 정보
export const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const result = await pool.query(
      'SELECT * FROM books WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json({ book: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 책 추가
export const addBook = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const {
      title,
      author,
      total_page,
      read_page,
      status,
      memo,
      thumbnail,
      isbn10,
      isbn13,
      publisher,
      published_date,
    } = req.body

    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required' })
    }

    const progress = total_page > 0 ? (read_page / total_page) * 100 : 0

    const result = await pool.query(
      `INSERT INTO books (
        user_id, title, author, total_page, read_page, progress, status, memo,
        thumbnail, isbn10, isbn13, publisher, published_date, start_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        userId,
        title,
        author,
        total_page || 0,
        read_page || 0,
        progress,
        status || 'not_started',
        memo || '',
        thumbnail || '',
        isbn10 || '',
        isbn13 || '',
        publisher || '',
        published_date || '',
        status === 'reading' || status === 'completed' ? new Date() : null,
      ]
    )

    res.status(201).json({ book: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 책 수정
export const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const {
      title,
      author,
      total_page,
      read_page,
      status,
      memo,
      thumbnail,
      publisher,
      published_date,
    } = req.body

    // 책 소유권 확인
    const bookCheck = await pool.query(
      'SELECT id FROM books WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }

    const progress = total_page > 0 ? (read_page / total_page) * 100 : 0
    const completedDate = status === 'completed' ? new Date() : null

    const result = await pool.query(
      `UPDATE books SET
        title = COALESCE($1, title),
        author = COALESCE($2, author),
        total_page = COALESCE($3, total_page),
        read_page = COALESCE($4, read_page),
        progress = $5,
        status = COALESCE($6, status),
        memo = COALESCE($7, memo),
        thumbnail = COALESCE($8, thumbnail),
        publisher = COALESCE($9, publisher),
        published_date = COALESCE($10, published_date),
        completed_date = $11,
        updated_at = NOW()
      WHERE id = $12 AND user_id = $13
      RETURNING *`,
      [
        title,
        author,
        total_page,
        read_page,
        progress,
        status,
        memo,
        thumbnail,
        publisher,
        published_date,
        completedDate,
        id,
        userId,
      ]
    )

    res.json({ book: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 책 삭제
export const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const result = await pool.query(
      'DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json({ message: 'Book deleted successfully' })
  } catch (error) {
    next(error)
  }
}



