import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Contact } from '@onecrm/shared'

const statusVariant: Record<Contact['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  contacted: 'secondary',
  converted: 'outline',
  archived: 'destructive',
}

export function RecentContacts({ contacts }: { contacts: Contact[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.slice(0, 10).map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">{contact.name}</TableCell>
            <TableCell>{contact.email}</TableCell>
            <TableCell>{contact.serviceId}</TableCell>
            <TableCell>{contact.date}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[contact.status]}>
                {contact.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
