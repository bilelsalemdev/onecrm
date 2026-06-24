import type { ServiceConfig, FieldMapping } from '@onecrm/shared'

// In-memory token cache for 'login' auth, keyed by service id.
// Tokens are refreshed lazily on a 401 (see proxyRequest).
const tokenCache = new Map<string, string>()

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]),
    obj,
  )
}

// --- Login auth -------------------------------------------------------------

const TOKEN_KEYS = ['access', 'accessToken', 'access_token', 'token', 'jwt', 'id_token', 'key']

function extractToken(data: unknown, tokenPath?: string): string | undefined {
  if (tokenPath) {
    const t = getPath(data, tokenPath)
    if (typeof t === 'string') return t
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const k of TOKEN_KEYS) if (typeof obj[k] === 'string') return obj[k] as string
    // one level down (e.g. { data: { access: ... } } / { tokens: { access: ... } })
    for (const wrap of ['data', 'result', 'tokens', 'auth']) {
      const inner = obj[wrap]
      if (inner && typeof inner === 'object') {
        const io = inner as Record<string, unknown>
        for (const k of TOKEN_KEYS) if (typeof io[k] === 'string') return io[k] as string
      }
    }
  }
  return undefined
}

async function loginAndGetToken(service: ServiceConfig): Promise<string> {
  if (service.auth.type !== 'login') throw new Error('service is not configured for login auth')
  const auth = service.auth
  const body: Record<string, string> = {
    [auth.usernameField || 'email']: auth.username,
    [auth.passwordField || 'password']: auth.password,
  }
  const res = await fetch(auth.loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Login failed (${res.status} ${res.statusText}) at ${auth.loginUrl}`)
  }
  const data = await res.json()
  const token = extractToken(data, auth.tokenPath)
  if (!token) {
    throw new Error('Login succeeded but no token was found in the response')
  }
  return token
}

async function authHeaders(service: ServiceConfig, forceLogin = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: 'application/json' }

  switch (service.auth.type) {
    case 'api-key':
      headers[service.auth.headerName] = service.auth.apiKey
      break
    case 'basic':
      headers['Authorization'] = `Basic ${btoa(`${service.auth.username}:${service.auth.password}`)}`
      break
    case 'bearer':
      headers['Authorization'] = `Bearer ${service.auth.token}`
      break
    case 'login': {
      let token = forceLogin ? undefined : tokenCache.get(service.id)
      if (!token) {
        token = await loginAndGetToken(service)
        tokenCache.set(service.id, token)
      }
      const header = service.auth.header || 'Authorization'
      const scheme = service.auth.scheme === undefined ? 'Bearer' : service.auth.scheme
      headers[header] = scheme ? `${scheme} ${token}` : token
      break
    }
    case 'none':
      break
  }

  return headers
}

// --- Response unwrapping -----------------------------------------------------

const ARRAY_KEYS = ['results', 'items', 'data', 'records', 'rows', 'content', 'list']

// Pull the list of records out of a response that may be a bare array or a
// paginated envelope like { results: [...] } / { items: [...], total } /
// { data: { results: [...] } }. An explicit resultsPath wins.
function extractArray(data: unknown, resultsPath?: string): unknown[] {
  if (resultsPath) {
    const v = getPath(data, resultsPath)
    if (Array.isArray(v)) return v
  }
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const k of ARRAY_KEYS) if (Array.isArray(obj[k])) return obj[k] as unknown[]
    // one level down (e.g. { data: { results: [...] } })
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const inner = v as Record<string, unknown>
        for (const k of ARRAY_KEYS) if (Array.isArray(inner[k])) return inner[k] as unknown[]
      }
    }
    // last resort: the first array-valued property, else treat as a single record
    for (const v of Object.values(obj)) if (Array.isArray(v)) return v as unknown[]
    return [data]
  }
  return []
}

async function proxyRequest(url: string, service: ServiceConfig): Promise<unknown[]> {
  let res = await fetch(url, { headers: await authHeaders(service) })
  // Token expired/invalid — drop the cached token, re-login once, and retry.
  if (res.status === 401 && service.auth.type === 'login') {
    tokenCache.delete(service.id)
    res = await fetch(url, { headers: await authHeaders(service, true) })
  }
  if (!res.ok) {
    throw new Error(`External API error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return extractArray(data, service.resultsPath)
}

// --- Field mapping -----------------------------------------------------------

function applyMapping(records: unknown[], mapping: FieldMapping | undefined): unknown[] {
  if (!mapping || Object.keys(mapping).length === 0) return records

  return records.map((record) => {
    if (typeof record !== 'object' || record === null) return record
    const source = record as Record<string, unknown>
    const mapped: Record<string, unknown> = {}

    for (const [ourField, externalField] of Object.entries(mapping)) {
      if (!externalField) continue
      if (externalField.includes(' ')) {
        // Join several source fields, e.g. "firstName lastName" -> "Ada Lovelace"
        const joined = externalField
          .split(/\s+/)
          .map((f) => source[f])
          .filter((v) => v != null && v !== '')
          .join(' ')
        if (joined) mapped[ourField] = joined
      } else if (externalField in source) {
        mapped[ourField] = source[externalField]
      }
    }

    // Keep unmapped source fields as-is for any fields not in the mapping
    for (const [key, value] of Object.entries(source)) {
      if (!Object.values(mapping).includes(key) && !(key in mapped)) {
        mapped[key] = value
      }
    }

    return mapped
  })
}

export async function proxyContacts(service: ServiceConfig): Promise<unknown[]> {
  const raw = await proxyRequest(service.endpoint, service)
  return applyMapping(raw, service.contactsMapping)
}

export async function proxyOrders(service: ServiceConfig): Promise<unknown[]> {
  if (!service.ordersEndpoint) return []
  const raw = await proxyRequest(service.ordersEndpoint, service)
  return applyMapping(raw, service.ordersMapping)
}

// Fetch raw sample from an endpoint — returns field names from first record
export async function fetchSampleFields(
  service: ServiceConfig,
  endpointType: 'contacts' | 'orders',
): Promise<{ fields: string[]; sample: Record<string, unknown> }> {
  const url = endpointType === 'orders' ? service.ordersEndpoint : service.endpoint
  if (!url) return { fields: [], sample: {} }

  const raw = await proxyRequest(url, service)
  if (raw.length === 0) return { fields: [], sample: {} }

  const first = raw[0] as Record<string, unknown>
  return { fields: Object.keys(first), sample: first }
}
