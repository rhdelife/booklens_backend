import pool from '../config/database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import crypto from 'crypto'

// JWT 토큰 생성
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// CSRF 방지를 위한 state 생성
const generateState = () => {
  return crypto.randomBytes(32).toString('hex')
}

// 구글 OAuth 시작
export const startGoogleOAuth = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID

    // 필수 환경 변수 확인
    if (!clientId) {
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173'
      return res.redirect(`${frontendUrl}/auth/callback?error=config_error&message=Google OAuth client ID is not configured`)
    }

    // redirect_uri 설정: 환경 변수 우선, 없으면 BACKEND_URL 기반으로 생성
    // OAuth 제공자에 등록된 정확한 URL과 일치해야 함
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
      process.env.GOOGLE_CALLBACK_URL ||
      `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`

    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173'
    const state = generateState()

    // redirect_uri 로깅 (디버깅용)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Google OAuth redirect_uri:', redirectUri)
    }

    // state를 세션에 저장 (실제로는 Redis나 세션 스토어 사용 권장)
    // 여기서는 간단하게 쿠키에 저장
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600000 // 10분
    })

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
      access_type: 'offline',
      prompt: 'consent',
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    res.redirect(authUrl)
  } catch (error) {
    next(error)
  }
}

// 네이버 OAuth 시작
export const startNaverOAuth = async (req, res, next) => {
  try {
    const clientId = process.env.NAVER_CLIENT_ID

    // redirect_uri 설정: 환경 변수 우선, 없으면 BACKEND_URL 기반으로 생성
    // 네이버 개발자 센터에 등록된 정확한 URL과 일치해야 함
    const redirectUri = process.env.NAVER_REDIRECT_URI ||
      process.env.NAVER_CALLBACK_URL ||
      `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/naver/callback`

    const state = generateState()

    // redirect_uri 로깅 (디버깅용)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Naver OAuth redirect_uri:', redirectUri)
    }

    // state를 쿠키에 저장
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600000 // 10분
    })

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
    })

    const authUrl = `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`
    res.redirect(authUrl)
  } catch (error) {
    next(error)
  }
}

// 로그인
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // 사용자 조회
    const result = await pool.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // 토큰 생성
    const token = generateToken(user.id)

    // 사용자 정보 반환 (비밀번호 제외)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })
  } catch (error) {
    next(error)
  }
}

// 회원가입
export const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // 이메일 중복 확인
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' })
    }

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, 10)

    // 사용자 생성
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name || email.split('@')[0]]
    )

    const user = result.rows[0]

    // 토큰 생성
    const token = generateToken(user.id)

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })
  } catch (error) {
    next(error)
  }
}

// 구글 OAuth 콜백
export const googleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query
    const savedState = req.cookies?.oauth_state
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173'

    // state 검증
    if (!savedState || savedState !== state) {
      return res.redirect(`${frontendUrl}/auth/callback?error=invalid_state&message=Invalid state parameter`)
    }

    // 쿠키 삭제
    res.clearCookie('oauth_state')

    if (!code) {
      return res.redirect(`${frontendUrl}/auth/callback?error=no_code&message=Authorization code is required`)
    }

    // 구글에서 액세스 토큰 교환
    // redirect_uri는 startGoogleOAuth에서 사용한 것과 정확히 동일해야 함
    // OAuth 제공자에 등록된 URL과 일치해야 함
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
      process.env.GOOGLE_CALLBACK_URL ||
      `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`

    // 필수 환경 변수 확인
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${frontendUrl}/auth/callback?error=config_error&message=Google OAuth credentials are not configured`)
    }

    // redirect_uri 로깅 (디버깅용)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Google OAuth callback redirect_uri:', redirectUri)
      console.log('Google OAuth client_id:', process.env.GOOGLE_CLIENT_ID ? 'set' : 'missing')
    }

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    })

    const { access_token } = tokenResponse.data

    // 구글 사용자 정보 가져오기
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const { id: googleId, email, name, picture } = userResponse.data

    if (!email) {
      return res.redirect(`${frontendUrl}/auth/callback?error=no_email&message=Email not provided by Google`)
    }

    // 기존 사용자 확인 또는 생성
    let user
    try {
      const userResult = await pool.query(
        'SELECT id, email, name FROM users WHERE email = $1',
        [email]
      )

      if (userResult.rows.length === 0) {
        // 새 사용자 생성
        const result = await pool.query(
          'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
          [email, name || email.split('@')[0], 'oauth_user'] // OAuth 사용자는 비밀번호 없음
        )
        user = result.rows[0]
      } else {
        user = userResult.rows[0]
      }
    } catch (dbError) {
      console.error('Database error in OAuth callback:', dbError)
      return res.redirect(`${frontendUrl}/auth/callback?error=db_error&message=Database connection failed. Please check your database settings.`)
    }

    // 토큰 생성
    const token = generateToken(user.id)

    // 프론트엔드로 리다이렉트 (토큰과 사용자 정보 포함)
    // 프론트엔드에서 URL 파라미터로 받아서 처리
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
    }))
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userData}`)
  } catch (error) {
    // 상세한 에러 로깅 (참고 저장소 방식)
    const errorDetails = {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ||
        process.env.GOOGLE_CALLBACK_URL ||
        `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`,
      client_id: process.env.GOOGLE_CLIENT_ID ? 'set' : 'missing',
    }
    console.error('Google OAuth error:', errorDetails)

    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173'
    const errorMessage = encodeURIComponent(error.response?.data?.error || error.message || 'OAuth 인증에 실패했습니다.')
    res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed&message=${errorMessage}`)
  }
}

// 네이버 OAuth 콜백
export const naverCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query
    const savedState = req.cookies?.oauth_state
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173'

    // state 검증
    if (!savedState || savedState !== state) {
      return res.redirect(`${frontendUrl}/auth/callback?error=invalid_state&message=Invalid state parameter`)
    }

    // 쿠키 삭제
    res.clearCookie('oauth_state')

    if (!code) {
      return res.redirect(`${frontendUrl}/auth/callback?error=no_code&message=Authorization code is required`)
    }

    // 네이버에서 액세스 토큰 교환
    const tokenResponse = await axios.post(
      'https://nid.naver.com/oauth2.0/token',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.NAVER_CLIENT_ID,
          client_secret: process.env.NAVER_CLIENT_SECRET,
          code,
          state,
        },
      }
    )

    const { access_token } = tokenResponse.data

    // 네이버 사용자 정보 가져오기
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const { id: naverId, email, name, nickname } = userResponse.data.response

    if (!email) {
      return res.redirect(`${frontendUrl}/auth/callback?error=no_email&message=Email not provided by Naver`)
    }

    // 기존 사용자 확인 또는 생성
    let user = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    )

    if (user.rows.length === 0) {
      // 새 사용자 생성
      const result = await pool.query(
        'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email, name || nickname || email.split('@')[0], 'oauth_user'] // OAuth 사용자는 비밀번호 없음
      )
      user = result.rows[0]
    } else {
      user = user.rows[0]
    }

    // 토큰 생성
    const token = generateToken(user.id)

    // 프론트엔드로 리다이렉트 (토큰 포함)
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`)
  } catch (error) {
    console.error('Naver OAuth error:', error.response?.data || error.message)
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173'
    const errorMessage = encodeURIComponent(error.response?.data?.error || error.message || 'OAuth 인증에 실패했습니다.')
    res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed&message=${errorMessage}`)
  }
}

// 현재 사용자 정보
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const result = await pool.query(
      'SELECT id, email, name, nickname, alias, profile_image_url, bio, created_at FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 프로필 업데이트
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { name, nickname, alias, bio, profile_image_url } = req.body

    // 업데이트할 필드만 포함
    const updates = []
    const values = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`)
      values.push(name)
      paramCount++
    }

    if (nickname !== undefined) {
      updates.push(`nickname = $${paramCount}`)
      values.push(nickname)
      paramCount++
    }

    if (alias !== undefined) {
      updates.push(`alias = $${paramCount}`)
      values.push(alias)
      paramCount++
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount}`)
      values.push(bio)
      paramCount++
    }

    if (profile_image_url !== undefined) {
      updates.push(`profile_image_url = $${paramCount}`)
      values.push(profile_image_url)
      paramCount++
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    values.push(userId)

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, email, name, nickname, alias, profile_image_url, bio, created_at
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

// 프로필 이미지 업로드 (Base64 또는 URL)
export const uploadProfileImage = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { image } = req.body // Base64 이미지 데이터

    if (!image) {
      return res.status(400).json({ error: 'Image is required' })
    }

    // Base64 이미지인 경우 데이터 URL에서 실제 데이터 추출
    let imageUrl = image
    if (image.startsWith('data:image')) {
      // 실제 프로덕션에서는 이미지를 서버에 저장하거나 클라우드 스토리지에 업로드
      // 여기서는 Base64 데이터를 그대로 저장 (간단한 구현)
      // 프로덕션에서는 multer, cloudinary, AWS S3 등을 사용하는 것을 권장
      imageUrl = image
    }

    const result = await pool.query(
      'UPDATE users SET profile_image_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, nickname, alias, profile_image_url, bio',
      [imageUrl, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: result.rows[0],
      message: 'Profile image uploaded successfully'
    })
  } catch (error) {
    next(error)
  }
}

