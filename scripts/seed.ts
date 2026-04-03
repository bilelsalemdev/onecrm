const API = 'http://localhost:3001/api'

const services = [
  {
    name: 'MD3W',
    description: 'Web development platform',
    icon: 'Globe',
    endpoint: 'https://md3w.com/api/contacts',
    auth: { type: 'api-key' as const, apiKey: 'sk-md3w-demo-key', headerName: 'X-API-Key' },
  },
  {
    name: 'Aalii',
    description: 'Digital solutions service',
    icon: 'Sparkles',
    endpoint: 'https://aalii.app/api/contacts',
    auth: { type: 'bearer' as const, token: 'aalii-demo-token-2026' },
  },
  {
    name: 'InvFunds',
    description: 'Investment funds management',
    icon: 'TrendingUp',
    endpoint: 'https://invfunds.io/api/v1/leads',
    auth: { type: 'basic' as const, username: 'admin', password: 'invfunds-pass' },
  },
  {
    name: 'WalaPoints',
    description: 'Loyalty points system',
    icon: 'Award',
    endpoint: 'https://walapoints.com/api/contacts',
    auth: { type: 'api-key' as const, apiKey: 'wp-key-demo-123', headerName: 'Authorization' },
  },
  {
    name: 'Masejed',
    description: 'Mosque management platform',
    icon: 'Building',
    endpoint: 'https://masejed.org/api/inquiries',
    auth: { type: 'none' as const },
  },
]

async function seed() {
  console.log('Seeding services...\n')

  for (const service of services) {
    const res = await fetch(`${API}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    })

    if (res.ok) {
      const data = await res.json()
      console.log(`  ✓ ${(data as { name: string }).name}`)
    } else {
      const err = await res.json()
      console.log(`  ✗ ${service.name}: ${(err as { error: string }).error}`)
    }
  }

  console.log('\nDone! Check http://localhost:3000')
}

seed()
