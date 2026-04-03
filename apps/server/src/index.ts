import { readServices, writeServices } from './storage'
import { stripCredentials } from '@onecrm/shared'
import type { ServiceConfig, AuthConfig, ReviewStatus } from '@onecrm/shared'
import { proxyContacts, proxyOrders, fetchSampleFields } from './proxy'
import { getReviews, setReview } from './reviews'
import { sendAssignmentEmail } from './email'
import { mkdir as mkdirNode } from 'fs/promises'
import { existsSync } from 'fs'

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
    const urlPath = url.pathname
    const method = req.method

    // CORS for dev
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    try {
      // GET /api/mock/contacts — returns fake contacts for demo/seeding
      if (urlPath === '/api/mock/contacts' && method === 'GET') {
        const names = ['Ahmed Benali', 'Fatima Khoury', 'Omar Mansouri', 'Yasmine Haddad', 'Karim Zahra', 'Nour Dridi', 'Bilel Bouazizi', 'Sara Jaziri', 'Mehdi Trabelsi', 'Amina Sfar', 'Rami Bouzid', 'Leila Cherif']
        const messages = ['Interested in your services', 'Can you provide a demo?', 'Need help with integration', 'Looking for enterprise pricing', 'Partnership opportunity', 'Question about API access', 'Want to upgrade my plan', 'Having issues with my account']
        const contacts = names.map((name, i) => {
          const [first, last] = name.split(' ')
          const daysAgo = Math.floor(Math.random() * 60)
          const d = new Date(); d.setDate(d.getDate() - daysAgo)
          return {
            id: String(i + 1),
            name,
            email: `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`,
            phone: `+213 ${String(Math.floor(Math.random() * 900000000 + 100000000))}`,
            message: messages[i % messages.length],
            date: d.toISOString().split('T')[0],
            status: ['new', 'contacted', 'converted', 'archived'][i % 4],
          }
        })
        return json(contacts)
      }

      // GET /api/mock/orders — returns fake orders for demo/seeding
      if (urlPath === '/api/mock/orders' && method === 'GET') {
        const customers = ['Ahmed Benali', 'Fatima Khoury', 'Omar Mansouri', 'Yasmine Haddad', 'Karim Zahra', 'Nour Dridi', 'Bilel Bouazizi', 'Sara Jaziri']
        const products = ['Basic Plan', 'Pro Plan', 'Enterprise License', 'Consulting Package', 'API Access', 'Premium Support', 'Custom Integration', 'Training Session']
        const orders = customers.map((name, i) => {
          const [first, last] = name.split(' ')
          const daysAgo = Math.floor(Math.random() * 60)
          const d = new Date(); d.setDate(d.getDate() - daysAgo)
          return {
            id: String(i + 1),
            customerName: name,
            customerEmail: `${first.toLowerCase()}.${last.toLowerCase()}@company.com`,
            product: products[i % products.length],
            amount: Math.floor(Math.random() * 5000 + 100),
            currency: 'DZD',
            date: d.toISOString().split('T')[0],
            status: ['pending', 'processing', 'completed', 'cancelled'][i % 4],
          }
        })
        return json(orders)
      }

      // GET /api/logos/:filename — serve uploaded logos
      const logoMatch = urlPath.match(/^\/api\/logos\/(.+)$/)
      if (logoMatch && method === 'GET') {
        const filename = logoMatch[1]
        const filePath = `./data/logos/${filename}`
        if (!existsSync(filePath)) return json({ error: 'Logo not found' }, 404)
        const file = Bun.file(filePath)
        const ext = filename.split('.').pop()?.toLowerCase()
        const mimeTypes: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', ico: 'image/x-icon',
        }
        return new Response(file, {
          headers: { 'Content-Type': mimeTypes[ext ?? ''] ?? 'application/octet-stream' },
        })
      }

      // POST /api/services/:id/logo — upload logo
      const logoUploadMatch = urlPath.match(/^\/api\/services\/([^/]+)\/logo$/)
      if (logoUploadMatch && method === 'POST') {
        const id = logoUploadMatch[1]
        const services = await readServices()
        const index = services.findIndex((s) => s.id === id)
        if (index === -1) return json({ error: 'Service not found' }, 404)

        const formData = await req.formData()
        const file = formData.get('logo')
        if (!file || !(file instanceof File)) return json({ error: 'No logo file provided' }, 400)

        const logosDir = './data/logos'
        if (!existsSync(logosDir)) await mkdirNode(logosDir, { recursive: true })

        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
        const filename = `${id}-${Date.now()}.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        await Bun.write(`${logosDir}/${filename}`, buffer)

        services[index].logo = `/api/logos/${filename}`
        await writeServices(services)
        return json(stripCredentials(services[index]))
      }

      // GET /api/services
      if (urlPath === '/api/services' && method === 'GET') {
        const services = await readServices()
        return json(services.map(stripCredentials))
      }

      // POST /api/services
      if (urlPath === '/api/services' && method === 'POST') {
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

      // POST /api/services/:id/test-endpoint — fetch sample fields from endpoint
      const testMatch = urlPath.match(/^\/api\/services\/([^/]+)\/test-endpoint$/)
      if (testMatch && method === 'POST') {
        const id = testMatch[1]
        const services = await readServices()
        const service = services.find((s) => s.id === id)
        if (!service) return json({ error: 'Service not found' }, 404)

        const body = await req.json() as { type: 'contacts' | 'orders' }
        const result = await fetchSampleFields(service, body.type)
        return json(result)
      }

      // PUT /api/services/:id/mapping — save field mapping
      const mappingMatch = urlPath.match(/^\/api\/services\/([^/]+)\/mapping$/)
      if (mappingMatch && method === 'PUT') {
        const id = mappingMatch[1]
        const services = await readServices()
        const index = services.findIndex((s) => s.id === id)
        if (index === -1) return json({ error: 'Service not found' }, 404)

        const body = await req.json() as { type: 'contacts' | 'orders'; mapping: Record<string, string> }
        if (body.type === 'contacts') {
          services[index].contactsMapping = body.mapping
        } else {
          services[index].ordersMapping = body.mapping
        }
        await writeServices(services)
        return json(stripCredentials(services[index]))
      }

      // Routes with :id
      const serviceMatch = urlPath.match(/^\/api\/services\/([^/]+)$/)
      const contactsMatch = urlPath.match(/^\/api\/services\/([^/]+)\/contacts$/)
      const ordersMatch = urlPath.match(/^\/api\/services\/([^/]+)\/orders$/)

      // GET /api/services/:id/orders
      if (ordersMatch && method === 'GET') {
        const id = ordersMatch[1]
        const services = await readServices()
        const service = services.find((s) => s.id === id)
        if (!service) return json({ error: 'Service not found' }, 404)

        const orders = await proxyOrders(service) as Record<string, unknown>[]
        const reviews = await getReviews(id, 'orders')

        const enriched = orders.map((o, i) => {
          const itemId = String((o as Record<string, unknown>).id ?? i)
          const meta = reviews[itemId]
          return {
            ...o,
            serviceId: id,
            reviewStatus: meta?.reviewStatus ?? 'to-review',
            assignedTo: meta?.assignedTo,
            assignedAt: meta?.assignedAt,
            note: meta?.note,
          }
        })

        return json(enriched)
      }

      // GET /api/services/:id/contacts
      if (contactsMatch && method === 'GET') {
        const id = contactsMatch[1]
        const services = await readServices()
        const service = services.find((s) => s.id === id)
        if (!service) return json({ error: 'Service not found' }, 404)

        const contacts = await proxyContacts(service) as Record<string, unknown>[]
        const reviews = await getReviews(id, 'contacts')

        // Merge review metadata into contacts
        const enriched = contacts.map((c, i) => {
          const itemId = String((c as Record<string, unknown>).id ?? i)
          const meta = reviews[itemId]
          return {
            ...c,
            serviceId: id,
            reviewStatus: meta?.reviewStatus ?? 'to-review',
            assignedTo: meta?.assignedTo,
            assignedAt: meta?.assignedAt,
            note: meta?.note,
          }
        })

        return json(enriched)
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

      // PATCH /api/services/:id/reviews/:type/:itemId — update review status
      const reviewMatch = urlPath.match(/^\/api\/services\/([^/]+)\/reviews\/(contacts|orders)\/([^/]+)$/)
      if (reviewMatch && method === 'PATCH') {
        const [, serviceId, type, itemId] = reviewMatch
        const body = await req.json() as { reviewStatus?: ReviewStatus; assignedTo?: string; note?: string }

        const meta: Record<string, unknown> = {}
        if (body.reviewStatus) meta.reviewStatus = body.reviewStatus
        if (body.note !== undefined) meta.note = body.note

        if (body.assignedTo) {
          meta.assignedTo = body.assignedTo
          meta.assignedAt = new Date().toISOString()

          // Send email notification
          const services = await readServices()
          const service = services.find((s) => s.id === serviceId)
          const serviceName = service?.name ?? serviceId
          await sendAssignmentEmail(body.assignedTo, serviceName, type === 'contacts' ? 'contact' : 'order', itemId)
        }

        const updated = await setReview(serviceId, type as 'contacts' | 'orders', itemId, meta)
        return json(updated)
      }

      return json({ error: 'Not found' }, 404)
    } catch (err) {
      console.error(err)
      return json({ error: 'Internal server error' }, 500)
    }
  },
})

console.log(`OneCRM API server running on http://localhost:${PORT}`)
