import type { ServiceConfig } from '@onecrm/shared'

export async function proxyContacts(service: ServiceConfig): Promise<unknown> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }

  switch (service.auth.type) {
    case 'api-key':
      headers[service.auth.headerName] = service.auth.apiKey
      break
    case 'basic': {
      const encoded = btoa(`${service.auth.username}:${service.auth.password}`)
      headers['Authorization'] = `Basic ${encoded}`
      break
    }
    case 'bearer':
      headers['Authorization'] = `Bearer ${service.auth.token}`
      break
    case 'none':
      break
  }

  const response = await fetch(service.endpoint, { headers })

  if (!response.ok) {
    throw new Error(`External API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
