import pool from '../config/database.js'

// 독서 세션 시작
export const startSession = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { book_id, start_page } = req.body

    if (!book_id) {
      return res.status(400).json({ error: 'Book ID is required' })
    }

    const result = await pool.query(
      `INSERT INTO reading_sessions (user_id, book_id, start_time, start_page)
       VALUES ($1, $2, NOW(), $3)
       RETURNING *`,
      [userId, book_id, start_page || 0]
    )

    res.status(201).json({ session: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 독서 세션 종료
export const endSession = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const { pages_read } = req.body

    // 세션 조회
    const sessionResult = await pool.query(
      'SELECT * FROM reading_sessions WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const session = sessionResult.rows[0]
    const startTime = new Date(session.start_time)
    const endTime = new Date()
    const durationSeconds = Math.floor((endTime - startTime) / 1000)

    const endPage = session.start_page + (pages_read || 0)

    // 세션 업데이트
    const result = await pool.query(
      `UPDATE reading_sessions SET
        end_time = NOW(),
        duration_seconds = $1,
        end_page = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *`,
      [durationSeconds, endPage, id, userId]
    )

    // 책의 읽은 페이지 업데이트
    if (pages_read > 0) {
      await pool.query(
        `UPDATE books SET
          read_page = read_page + $1,
          total_reading_time = total_reading_time + $2,
          progress = CASE
            WHEN total_page > 0 THEN ((read_page + $1)::NUMERIC / total_page * 100)
            ELSE progress
          END,
          updated_at = NOW()
        WHERE id = $3 AND user_id = $4`,
        [pages_read, durationSeconds, session.book_id, userId]
      )
    }

    res.json({ session: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 활성 세션 조회
export const getActiveSession = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const result = await pool.query(
      `SELECT * FROM reading_sessions
       WHERE user_id = $1 AND end_time IS NULL
       ORDER BY start_time DESC
       LIMIT 1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.json({ session: null })
    }

    res.json({ session: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 세션 목록 조회
export const getSessions = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { book_id } = req.query

    let query = 'SELECT * FROM reading_sessions WHERE user_id = $1'
    const params = [userId]

    if (book_id) {
      query += ' AND book_id = $2'
      params.push(book_id)
    }

    query += ' ORDER BY start_time DESC'

    const result = await pool.query(query, params)
    res.json({ sessions: result.rows })
  } catch (error) {
    next(error)
  }
}



