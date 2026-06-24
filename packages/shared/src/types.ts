// Auth
export type AuthType = 'none' | 'api-key' | 'basic' | 'bearer' | 'login'

export type AuthConfig =
  | { type: 'none' }
  | { type: 'api-key'; apiKey: string; headerName: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }
  // Logs in with username/password to obtain a (JWT) token, then sends it as a
  // header on each request. The token is cached and refreshed on a 401.
  | {
      type: 'login'
      loginUrl: string
      username: string
      password: string
      usernameField?: string // login body field for the username (default 'email')
      passwordField?: string // login body field for the password (default 'password')
      tokenPath?: string // dot-path to the token in the response (default: auto-detect)
      header?: string // header to send the token in (default 'Authorization')
      scheme?: string // token scheme prefix (default 'Bearer'; '' for none)
    }

// Field mapping: maps our field names to external API field names
export type FieldMapping = Record<string, string>

// Service — full config (server-side, contains credentials)
export interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: string
  color?: string
  logo?: string
  endpoint: string
  ordersEndpoint?: string
  resultsPath?: string // dot-path to the array in a wrapped response (default: auto-detect)
  contactsMapping?: FieldMapping
  ordersMapping?: FieldMapping
  auth: AuthConfig
}

// Service — public view (returned to frontend, credentials stripped)
export interface Service {
  id: string
  name: string
  description: string
  icon: string
  color?: string
  logo?: string
  endpoint: string
  ordersEndpoint?: string
  resultsPath?: string
  contactsMapping?: FieldMapping
  ordersMapping?: FieldMapping
  authType: AuthType
}

// Service — form data (sent from frontend to create/update)
export interface ServiceFormData {
  name: string
  description: string
  icon: string
  color?: string
  logo?: string
  endpoint: string
  ordersEndpoint?: string
  resultsPath?: string
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

// Review system — Kanban statuses
export type ReviewStatus = 'to-review' | 'under-review' | 'completed'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface ReviewMeta {
  reviewStatus: ReviewStatus
  priority?: Priority
  assignees?: string[] // emails
  assignedTo?: string // legacy single assignee
  assignedAt?: string // ISO date
  note?: string
}

// A contact/order enriched with review metadata
export type ReviewableContact = Contact & ReviewMeta
export type ReviewableOrder = Order & ReviewMeta

// Email config for notifications
export interface EmailConfig {
  enabled: boolean
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPass?: string
  fromEmail?: string
}

// Utilities
export function stripCredentials(config: ServiceConfig): Service {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    icon: config.icon,
    color: config.color,
    logo: config.logo,
    endpoint: config.endpoint,
    ordersEndpoint: config.ordersEndpoint,
    resultsPath: config.resultsPath,
    contactsMapping: config.contactsMapping,
    ordersMapping: config.ordersMapping,
    authType: config.auth.type,
  }
}
