import pool from '../config/database.js'

// 포스팅 목록
export const getPostings = async (req, res, next) => {
  try {
    const { sortBy = 'latest', tag, search } = req.query

    let query = `
      SELECT 
        p.*,
        u.name as author_name,
        b.title as book_title,
        b.author as book_author,
        b.thumbnail as book_thumbnail,
        (SELECT COUNT(*) FROM likes l WHERE l.posting_id = p.id) as like_count
      FROM postings p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN books b ON p.book_id = b.id
      WHERE 1=1
    `

    const params = []
    let paramCount = 1

    if (search) {
      query += ` AND (p.title ILIKE $${paramCount} OR p.content ILIKE $${paramCount})`
      params.push(`%${search}%`)
      paramCount++
    }

    if (tag) {
      query += `
        AND p.id IN (
          SELECT posting_id FROM posting_tags pt
          JOIN tags t ON pt.tag_id = t.id
          WHERE t.name = $${paramCount}
        )
      `
      params.push(tag)
      paramCount++
    }

    if (sortBy === 'latest') {
      query += ' ORDER BY p.created_at DESC'
    } else if (sortBy === 'popular') {
      query += ' ORDER BY like_count DESC, p.created_at DESC'
    }

    const result = await pool.query(query, params)
    res.json({ postings: result.rows })
  } catch (error) {
    next(error)
  }
}

// 포스팅 상세
export const getPostingById = async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT 
        p.*,
        u.name as author_name,
        b.title as book_title,
        b.author as book_author,
        b.thumbnail as book_thumbnail,
        (SELECT COUNT(*) FROM likes l WHERE l.posting_id = p.id) as like_count
      FROM postings p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN books b ON p.book_id = b.id
      WHERE p.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Posting not found' })
    }

    res.json({ posting: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 포스팅 작성
export const createPosting = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const {
      book_id,
      book_title,
      book_author,
      book_thumbnail,
      title,
      content,
      rating,
      completed_date,
    } = req.body

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' })
    }

    const result = await pool.query(
      `INSERT INTO postings (
        user_id, book_id, book_title, book_author, book_thumbnail,
        title, content, rating, completed_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        userId,
        book_id || null,
        book_title || '',
        book_author || '',
        book_thumbnail || '',
        title,
        content,
        rating || null,
        completed_date || null,
      ]
    )

    res.status(201).json({ posting: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 포스팅 수정
export const updatePosting = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const { title, content, rating } = req.body

    // 소유권 확인
    const postingCheck = await pool.query(
      'SELECT id FROM postings WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (postingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Posting not found' })
    }

    const result = await pool.query(
      `UPDATE postings SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        rating = COALESCE($3, rating),
        updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING *`,
      [title, content, rating, id, userId]
    )

    res.json({ posting: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 포스팅 삭제
export const deletePosting = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const result = await pool.query(
      'DELETE FROM postings WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Posting not found' })
    }

    res.json({ message: 'Posting deleted successfully' })
  } catch (error) {
    next(error)
  }
}



