import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'atomquest-secret-key-2025'

export function signToken(payload: { id: string; role: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string; email: string }
  } catch {
    return null
  }
}