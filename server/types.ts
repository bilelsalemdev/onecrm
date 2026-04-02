export type AuthConfig =
  | { type: 'none' }
  | { type: 'api-key'; apiKey: string; headerName: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }

export interface ServiceConfig {
  id: string
  name: string
  description: string
  icon: string
  endpoint: string
  auth: AuthConfig
}

export interface ServicePublic {
  id: string
  name: string
  description: string
  icon: string
  endpoint: string
  authType: AuthConfig['type']
}

export function stripCredentials(config: ServiceConfig): ServicePublic {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    icon: config.icon,
    endpoint: config.endpoint,
    authType: config.auth.type,
  }
}
