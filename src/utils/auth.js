export function getAccessToken() {
  return localStorage.getItem('raspy_access_token2') || ''
}

export function parseJwt(token) {
  try {
    const [, payloadB64] = token.split('.')
    if (!payloadB64) return null
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(
      Array.prototype.map.call(json, c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ))
  } catch (e) {
    try {
      // fallback: basic base64 decode
      const [, payloadB64] = token.split('.')
      if (!payloadB64) return null
      return JSON.parse(atob(payloadB64))
    } catch {
      return null
    }
  }
}

export function getRolesFromToken(token) {
  const payload = parseJwt(token)
  if (!payload) return []
  const roles = payload.roles || payload.authorities || []
  if (Array.isArray(roles)) return roles
  if (typeof roles === 'string') return roles.split(',')
  return []
}

export function isAdmin() {
  const token = getAccessToken()
  if (!token) return false
  const roles = getRolesFromToken(token)
  return roles.includes('ROLE_ADMIN')
}


