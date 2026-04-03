import type { EmailConfig } from '@onecrm/shared'

// For now, just log. Real SMTP can be added later.
export async function sendAssignmentEmail(
  to: string,
  serviceName: string,
  itemType: 'contact' | 'order',
  itemName: string,
): Promise<void> {
  // TODO: Replace with real SMTP when configured
  console.log(`[EMAIL] Assignment notification:`)
  console.log(`  To: ${to}`)
  console.log(`  Subject: You've been assigned a ${itemType} from ${serviceName}`)
  console.log(`  Body: "${itemName}" has been assigned to you for review.`)
}
