import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import type { ServiceConfig } from '@onecrm/shared'

const DATA_DIR = './data'
const DATA_FILE = `${DATA_DIR}/services.json`

interface StorageData {
  services: ServiceConfig[]
}

async function ensureDataFile(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
  if (!existsSync(DATA_FILE)) {
    await writeFile(DATA_FILE, JSON.stringify({ services: [] }, null, 2))
  }
}

export async function readServices(): Promise<ServiceConfig[]> {
  await ensureDataFile()
  const raw = await readFile(DATA_FILE, 'utf-8')
  const data: StorageData = JSON.parse(raw)
  return data.services
}

export async function writeServices(services: ServiceConfig[]): Promise<void> {
  await ensureDataFile()
  const data: StorageData = { services }
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}
