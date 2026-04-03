import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import type { ReviewMeta, ReviewStatus } from '@onecrm/shared'

const REVIEWS_DIR = './data/reviews'

interface ReviewsData {
  [itemId: string]: ReviewMeta
}

async function ensureDir(): Promise<void> {
  if (!existsSync(REVIEWS_DIR)) {
    await mkdir(REVIEWS_DIR, { recursive: true })
  }
}

function filePath(serviceId: string, type: 'contacts' | 'orders'): string {
  return `${REVIEWS_DIR}/${serviceId}-${type}.json`
}

export async function getReviews(serviceId: string, type: 'contacts' | 'orders'): Promise<ReviewsData> {
  await ensureDir()
  const path = filePath(serviceId, type)
  if (!existsSync(path)) return {}
  const raw = await readFile(path, 'utf-8')
  return JSON.parse(raw) as ReviewsData
}

export async function setReview(
  serviceId: string,
  type: 'contacts' | 'orders',
  itemId: string,
  meta: Partial<ReviewMeta>
): Promise<ReviewMeta> {
  const reviews = await getReviews(serviceId, type)
  const existing = reviews[itemId] ?? { reviewStatus: 'to-review' as ReviewStatus }
  const updated: ReviewMeta = { ...existing, ...meta }
  reviews[itemId] = updated
  await ensureDir()
  await writeFile(filePath(serviceId, type), JSON.stringify(reviews, null, 2))
  return updated
}
