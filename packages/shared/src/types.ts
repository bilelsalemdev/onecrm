// Auth
export type AuthType = 'none' | 'api-key' | 'basic' | 'bearer'

export type AuthConfig =
  | { type: 'none' }
  | { type: 'api-key'; apiKey: string; headerName: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }

// Service — full config (server-side, contains credentials)
export interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: string
  logo?: string
  endpoint: string
  ordersEndpoint?: string
  auth: AuthConfig
}

// Service — public view (returned to frontend, credentials stripped)
export interface Service {
  id: string
  name: string
  description: string
  icon: string
  logo?: string
  endpoint: string
  ordersEndpoint?: string
  authType: AuthType
}

// Service — form data (sent from frontend to create/update)
export interface ServiceFormData {
  name: string
  description: string
  icon: string
  logo?: string
  endpoint: string
  ordersEndpoint?: string
  auth: AuthConfig
}

// Order
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'

export interface Order {
  id: string
  serviceId: string
  customerName: string
  customerEmail: string
  product: string
  amount: number
  currency: string
  date: string
  status: OrderStatus
}

// Contact
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

// Utilities
export function stripCredentials(config: ServiceConfig): Service {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    icon: config.icon,
    logo: config.logo,
    endpoint: config.endpoint,
    ordersEndpoint: config.ordersEndpoint,
    authType: config.auth.type,
  }
}
