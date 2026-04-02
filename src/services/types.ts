export type AuthType = 'none' | 'api-key' | 'basic' | 'bearer'

export type AuthConfig =
  | { type: 'none' }
  | { type: 'api-key'; apiKey: string; headerName: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }

export interface Service {
  id: string
  name: string
  description: string
  icon: string
  endpoint: string
  authType: AuthType
}

export interface ServiceFormData {
  name: string
  description: string
  icon: string
  endpoint: string
  auth: AuthConfig
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
