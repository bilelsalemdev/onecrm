export interface Service {
  id: string
  name: string
  description: string
  icon: string
  contactCount: number
}

export type ContactStatus = 'new' | 'contacted' | 'converted' | 'archived'

export interface Contact {
  id: string
  serviceId: string
  name: string
  email: string
  phone: string
  message: string
  date: string
  status: ContactStatus
}
