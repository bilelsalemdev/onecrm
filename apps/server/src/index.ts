import { readServices, writeServices } from './storage'
import { stripCredentials } from '@onecrm/shared'
import type { ServiceConfig, AuthConfig } from '@onecrm/shared'
import { proxyContacts } from './proxy'

const PORT = 3001

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function generateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // CORS for dev
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    try {
      // GET /api/services
      if (path === '/api/services' && method === 'GET') {
        const services = await readServices()
        return json(services.map(stripCredentials))
      }

      // POST /api/services
      if (path === '/api/services' && method === 'POST') {
        const body = await req.json() as Omit<ServiceConfig, 'id'>
        const services = await readServices()
        const id = generateId(body.name)

        if (services.some((s) => s.id === id)) {
          return json({ error: `Service with id "${id}" already exists` }, 409)
        }

        const newService: ServiceConfig = { id, ...body }
        services.push(newService)
        await writeServices(services)
        return json(stripCredentials(newService), 201)
      }

      // Routes with :id
      const serviceMatch = path.match(/^\/api\/services\/([^/]+)$/)
      const contactsMatch = path.match(/^\/api\/services\/([^/]+)\/contacts$/)

      // GET /api/services/:id/contacts
      if (contactsMatch && method === 'GET') {
        const id = contactsMatch[1]
        const services = await readServices()
        const service = services.find((s) => s.id === id)
        if (!service) return json({ error: 'Service not found' }, 404)

        const contacts = await proxyContacts(service)
        return json(contacts)
      }

      // GET /api/services/:id
      if (serviceMatch && method === 'GET') {
        const id = serviceMatch[1]
        const services = await readServices()
        const service = services.find((s) => s.id === id)
        if (!service) return json({ error: 'Service not found' }, 404)
        return json(stripCredentials(service))
      }

      // PUT /api/services/:id
      if (serviceMatch && method === 'PUT') {
        const id = serviceMatch[1]
        const body = await req.json() as Partial<Omit<ServiceConfig, 'id'>>
        const services = await readServices()
        const index = services.findIndex((s) => s.id === id)
        if (index === -1) return json({ error: 'Service not found' }, 404)

        const existing = services[index]
        let mergedAuth: AuthConfig = existing.auth
        if (body.auth) {
          if (body.auth.type !== existing.auth.type) {
            mergedAuth = body.auth
          } else {
            mergedAuth = { ...existing.auth }
            for (const [key, value] of Object.entries(body.auth)) {
              if (key !== 'type' && value !== '') {
                (mergedAuth as Record<string, string>)[key] = value as string
              }
            }
          }
        }

        services[index] = {
          ...existing,
          ...body,
          id,
          auth: mergedAuth,
        }
        await writeServices(services)
        return json(stripCredentials(services[index]))
      }

      // DELETE /api/services/:id
      if (serviceMatch && method === 'DELETE') {
        const id = serviceMatch[1]
        const services = await readServices()
        const index = services.findIndex((s) => s.id === id)
        if (index === -1) return json({ error: 'Service not found' }, 404)
        services.splice(index, 1)
        await writeServices(services)
        return json({ ok: true })
      }

      return json({ error: 'Not found' }, 404)
    } catch (err) {
      console.error(err)
      return json({ error: 'Internal server error' }, 500)
    }
  },
})

console.log(`OneCRM API server running on http://localhost:${PORT}`)
