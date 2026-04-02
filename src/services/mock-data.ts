import type { Service, Contact } from './types'

export const services: Service[] = [
  {
    id: 'md3w',
    name: 'MD3W',
    description: 'Web development platform',
    icon: 'Globe',
    contactCount: 24,
  },
  {
    id: 'aalii',
    name: 'Aalii',
    description: 'Digital solutions service',
    icon: 'Sparkles',
    contactCount: 18,
  },
  {
    id: 'invfunds',
    name: 'InvFunds',
    description: 'Investment funds management',
    icon: 'TrendingUp',
    contactCount: 31,
  },
  {
    id: 'walapoints',
    name: 'WalaPoints',
    description: 'Loyalty points system',
    icon: 'Award',
    contactCount: 12,
  },
  {
    id: 'masejed',
    name: 'Masejed',
    description: 'Mosque management platform',
    icon: 'Building',
    contactCount: 9,
  },
]

const firstNames = ['Ahmed', 'Fatima', 'Omar', 'Yasmine', 'Karim', 'Nour', 'Bilel', 'Sara', 'Mehdi', 'Amina']
const lastNames = ['Benali', 'Khoury', 'Mansouri', 'Haddad', 'Zahra', 'Dridi', 'Bouazizi', 'Jaziri', 'Trabelsi', 'Sfar']
const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'company.com']
const messages = [
  'I would like to learn more about your services.',
  'Can you provide a demo of the platform?',
  'Interested in enterprise pricing.',
  'Need help with integration.',
  'Looking for a partnership opportunity.',
  'Having issues with my account.',
  'Want to upgrade my plan.',
  'Question about API access.',
]
const statuses: Contact['status'][] = ['new', 'contacted', 'converted', 'archived']

function generateContacts(): Contact[] {
  const contacts: Contact[] = []
  let id = 1

  for (const service of services) {
    for (let i = 0; i < service.contactCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const domain = domains[Math.floor(Math.random() * domains.length)]
      const daysAgo = Math.floor(Math.random() * 90)
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)

      contacts.push({
        id: String(id++),
        serviceId: service.id,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
        phone: `+213 ${String(Math.floor(Math.random() * 900000000 + 100000000))}`,
        message: messages[Math.floor(Math.random() * messages.length)],
        date: date.toISOString().split('T')[0],
        status: statuses[Math.floor(Math.random() * statuses.length)],
      })
    }
  }

  return contacts.sort((a, b) => b.date.localeCompare(a.date))
}

export const contacts: Contact[] = generateContacts()
