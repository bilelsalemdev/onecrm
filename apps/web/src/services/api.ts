import type { Service, Contact, ServiceFormData, FieldMapping, ReviewStatus, Priority, ReviewMeta, ReviewableContact, ReviewableOrder } from '@onecrm/shared'

const API = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getServices(): Promise<Service[]> {
  return request<Service[]>('/services')
}

export async function getService(id: string): Promise<Service | undefined> {
  try {
    return await request<Service>(`/services/${id}`)
  } catch {
    return undefined
  }
}

export async function getContacts(serviceId: string): Promise<ReviewableContact[]> {
  try {
    return await request<ReviewableContact[]>(`/services/${serviceId}/contacts`)
  } catch {
    return []
  }
}

export async function getOrders(serviceId: string): Promise<ReviewableOrder[]> {
  try {
    return await request<ReviewableOrder[]>(`/services/${serviceId}/orders`)
  } catch {
    return []
  }
}

export async function updateReview(
  serviceId: string,
  type: 'contacts' | 'orders',
  itemId: string,
  data: { reviewStatus?: ReviewStatus; priority?: Priority; assignees?: string[]; assignedTo?: string; note?: string }
): Promise<ReviewMeta> {
  return request<ReviewMeta>(`/services/${serviceId}/reviews/${type}/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function getAllContacts(): Promise<Contact[]> {
  const services = await getServices()
  const results = await Promise.allSettled(
    services.map((s) => getContacts(s.id))
  )
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}

export async function createService(data: ServiceFormData): Promise<Service> {
  return request<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateService(id: string, data: ServiceFormData): Promise<Service> {
  return request<Service>(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteService(id: string): Promise<void> {
  await request<unknown>(`/services/${id}`, { method: 'DELETE' })
}

export async function uploadLogo(serviceId: string, file: File): Promise<Service> {
  const formData = new FormData()
  formData.append('logo', file)
  const res = await fetch(`${API}/services/${serviceId}/logo`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Logo upload failed')
  return res.json() as Promise<Service>
}

export async function testEndpoint(serviceId: string, type: 'contacts' | 'orders'): Promise<{ fields: string[]; sample: Record<string, unknown> }> {
  return request(`/services/${serviceId}/test-endpoint`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  })
}

export async function saveMapping(serviceId: string, type: 'contacts' | 'orders', mapping: FieldMapping): Promise<Service> {
  return request<Service>(`/services/${serviceId}/mapping`, {
    method: 'PUT',
    body: JSON.stringify({ type, mapping }),
  })
}
