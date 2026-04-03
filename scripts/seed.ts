const API = 'http://localhost:3001/api'

const services = [
  {
    name: 'MD3W',
    description: 'Web development platform',
    icon: 'Globe',
    endpoint: `${API}/mock/contacts`,
    ordersEndpoint: `${API}/mock/orders`,
    auth: { type: 'none' as const },
  },
  {
    name: 'Aalii',
    description: 'Digital solutions service',
    icon: 'Sparkles',
    endpoint: `${API}/mock/contacts`,
    ordersEndpoint: `${API}/mock/orders`,
    auth: { type: 'none' as const },
  },
  {
    name: 'InvFunds',
    description: 'Investment funds management',
    icon: 'TrendingUp',
    endpoint: `${API}/mock/contacts`,
    ordersEndpoint: `${API}/mock/orders`,
    auth: { type: 'none' as const },
  },
  {
    name: 'WalaPoints',
    description: 'Loyalty points system',
    icon: 'Award',
    endpoint: `${API}/mock/contacts`,
    auth: { type: 'none' as const },
  },
  {
    name: 'Masejed',
    description: 'Mosque management platform',
    icon: 'Building',
    endpoint: `${API}/mock/contacts`,
    auth: { type: 'none' as const },
  },
]

// Review statuses to distribute across kanban columns
const reviewStatuses = ['to-review', 'under-review', 'completed'] as const
const assignees = ['bilel@neov.dz', 'ahmed@neov.dz', 'sara@neov.dz']

async function seed() {
  console.log('Seeding services...\n')

  const serviceIds: string[] = []

  for (const service of services) {
    const res = await fetch(`${API}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    })

    if (res.ok) {
      const data = await res.json() as { id: string; name: string }
      console.log(`  ✓ ${data.name}`)
      serviceIds.push(data.id)
    } else {
      const err = await res.json() as { error: string }
      console.log(`  ✗ ${service.name}: ${err.error}`)
      // Still track the ID for review seeding
      serviceIds.push(service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    }
  }

  console.log('\nSeeding review statuses...\n')

  for (const serviceId of serviceIds) {
    // Seed contact reviews — spread across columns
    for (let i = 1; i <= 12; i++) {
      const status = reviewStatuses[i % 3]
      const body: Record<string, string> = { reviewStatus: status }

      // Assign some items
      if (i % 4 === 0) {
        body.assignedTo = assignees[i % assignees.length]
      }

      const res = await fetch(`${API}/services/${serviceId}/reviews/contacts/${i}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const assigned = body.assignedTo ? ` → ${body.assignedTo}` : ''
        console.log(`  ✓ ${serviceId}/contact/${i}: ${status}${assigned}`)
      }
    }

    // Seed order reviews for services that have orders endpoint
    const service = services.find(s => s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === serviceId)
    if (service && 'ordersEndpoint' in service && service.ordersEndpoint) {
      for (let i = 1; i <= 8; i++) {
        const status = reviewStatuses[(i + 1) % 3]
        const body: Record<string, string> = { reviewStatus: status }

        if (i % 3 === 0) {
          body.assignedTo = assignees[i % assignees.length]
        }

        await fetch(`${API}/services/${serviceId}/reviews/orders/${i}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      console.log(`  ✓ ${serviceId}/orders: 8 reviews seeded`)
    }
  }

  console.log('\nDone! Check http://localhost:3000')
}

seed()
