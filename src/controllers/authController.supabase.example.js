/**
 * Supabase를 사용한 인증 컨트롤러 예시
 * 기존 authController.js를 이 방식으로 변경하세요
 */

import supabase from '../config/supabase.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import axios from 'axios'

// JWT 토큰 생성
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// 로그인 (Supabase 쿼리 사용)
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // 사용자 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, name, nickname, alias, profile_image_url, bio')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // 토큰 생성
    const token = generateToken(user.id)

    // 비밀번호 제외하고 반환
    const { password_hash, ...userWithoutPassword } = user

    res.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    next(error)
  }
}

// 회원가입 (Supabase 쿼리 사용)
export const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // 이메일 중복 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' })
    }

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, 10)

    // 사용자 생성
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name: name || email.split('@')[0],
      })
      .select('id, email, name, nickname, alias, profile_image_url, bio')
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    // 토큰 생성
    const token = generateToken(user.id)

    res.status(201).json({
      user,
      token,
    })
  } catch (error) {
    next(error)
  }
}

// 프로필 업데이트 (Supabase 쿼리 사용)
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { name, nickname, alias, bio, profile_image_url } = req.body

    // 업데이트할 데이터 준비
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (nickname !== undefined) updateData.nickname = nickname
    if (alias !== undefined) updateData.alias = alias
    if (bio !== undefined) updateData.bio = bio
    if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    // 업데이트
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, nickname, alias, profile_image_url, bio, created_at')
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
}

// 현재 사용자 정보 (Supabase 쿼리 사용)
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, nickname, alias, profile_image_url, bio, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
}

// 구글 OAuth 콜백 (Supabase 사용)
export const googleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' })
    }

    // 구글에서 액세스 토큰 교환
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/auth/google/callback`,
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
      return res.status(400).json({ error: 'Email not provided by Google' })
    }

    // 기존 사용자 확인 또는 생성
    let { data: user } = await supabase
      .from('users')
      .select('id, email, name, nickname, alias, profile_image_url, bio')
      .eq('email', email)
      .single()

    if (!user) {
      // 새 사용자 생성
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          name: name || email.split('@')[0],
          password_hash: 'oauth_user', // OAuth 사용자는 비밀번호 없음
          profile_image_url: picture || null,
        })
        .select('id, email, name, nickname, alias, profile_image_url, bio')
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      user = newUser
    }

    // 토큰 생성
    const token = generateToken(user.id)

    res.json({
      user,
      token,
    })
  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message)
    next(error)
  }
}



