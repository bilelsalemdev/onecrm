import type { Service, Contact, ServiceFormData } from './types'

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

export async function getContacts(serviceId: string): Promise<Contact[]> {
  try {
    return await request<Contact[]>(`/services/${serviceId}/contacts`)
  } catch {
    return []
  }
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
