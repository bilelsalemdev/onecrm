import type { Service, Contact } from './types'
import { services, contacts } from './mock-data'

export async function getServices(): Promise<Service[]> {
  return services
}

export async function getService(id: string): Promise<Service | undefined> {
  return services.find((s) => s.id === id)
}

export async function getContacts(serviceId: string): Promise<Contact[]> {
  return contacts.filter((c) => c.serviceId === serviceId)
}

export async function getAllContacts(): Promise<Contact[]> {
  return contacts
}
