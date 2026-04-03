import type { ServiceConfig, FieldMapping } from '@onecrm/shared'

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

async function proxyRequest(url: string, headers: Record<string, string>): Promise<unknown[]> {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`External API error: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  return Array.isArray(data) ? data : [data]
}

function applyMapping(records: unknown[], mapping: FieldMapping | undefined): unknown[] {
  if (!mapping || Object.keys(mapping).length === 0) return records

  return records.map((record) => {
    if (typeof record !== 'object' || record === null) return record
    const source = record as Record<string, unknown>
    const mapped: Record<string, unknown> = {}

    for (const [ourField, externalField] of Object.entries(mapping)) {
      if (externalField && externalField in source) {
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
  const raw = await proxyRequest(service.endpoint, buildAuthHeaders(service))
  return applyMapping(raw, service.contactsMapping)
}

export async function proxyOrders(service: ServiceConfig): Promise<unknown[]> {
  if (!service.ordersEndpoint) return []
  const raw = await proxyRequest(service.ordersEndpoint, buildAuthHeaders(service))
  return applyMapping(raw, service.ordersMapping)
}

// Fetch raw sample from an endpoint — returns field names from first record
export async function fetchSampleFields(service: ServiceConfig, endpointType: 'contacts' | 'orders'): Promise<{ fields: string[]; sample: Record<string, unknown> }> {
  const url = endpointType === 'orders' ? service.ordersEndpoint : service.endpoint
  if (!url) return { fields: [], sample: {} }

  const raw = await proxyRequest(url, buildAuthHeaders(service))
  if (raw.length === 0) return { fields: [], sample: {} }

  const first = raw[0] as Record<string, unknown>
  return { fields: Object.keys(first), sample: first }
}
