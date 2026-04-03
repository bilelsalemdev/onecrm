import type { ServiceConfig } from '@onecrm/shared'

function buildAuthHeaders(service: ServiceConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Accept': 'application/json' }

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

  return headers
}

async function proxyRequest(url: string, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`External API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export async function proxyContacts(service: ServiceConfig): Promise<unknown> {
  return proxyRequest(service.endpoint, buildAuthHeaders(service))
}

export async function proxyOrders(service: ServiceConfig): Promise<unknown> {
  if (!service.ordersEndpoint) {
    return []
  }
  return proxyRequest(service.ordersEndpoint, buildAuthHeaders(service))
}
