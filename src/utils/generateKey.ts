import crypto from 'crypto'

export function generateKey(length = 8): string {
  const bytes = crypto.randomBytes(length * 2)
  const base64 = bytes.toString('base64')
  const alphaNum = base64.replace(/[^\da-z]/gi, '')
  return alphaNum.slice(0, length)
}
