import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname, relative, sep } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', '.output', 'public')
const SITE_URL = 'https://thaubing-esg.gcaa.org.tw'
const SKIPPED_DIRS = new Set(['_nuxt', '_payload'])
const NOINDEX_PATTERN = /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i
const NOINDEX_PATTERN_REVERSED = /<meta\b[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i

function isSkippedDir(name: string): boolean {
  return SKIPPED_DIRS.has(name) || name.startsWith('__nuxt')
}

function collectIndexFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (isSkippedDir(entry.name)) continue
      files.push(...collectIndexFiles(fullPath))
      continue
    }
    if (entry.name === 'index.html') files.push(fullPath)
  }
  return files
}

function isNoindex(html: string): boolean {
  return NOINDEX_PATTERN.test(html) || NOINDEX_PATTERN_REVERSED.test(html)
}

function toUrl(filePath: string): string {
  const dirPath = relative(PUBLIC_DIR, dirname(filePath)).split(sep).join('/')
  return dirPath === '' ? `${SITE_URL}/` : `${SITE_URL}/${encodeURI(dirPath)}/`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function main() {
  if (!existsSync(PUBLIC_DIR)) {
    console.error(`Missing ${PUBLIC_DIR}. Run nuxt generate first.`)
    process.exit(1)
  }

  const indexFiles = collectIndexFiles(PUBLIC_DIR)
  const urls: string[] = []
  let skipped = 0

  for (const filePath of indexFiles) {
    if (isNoindex(readFileSync(filePath, 'utf-8'))) {
      skipped++
      continue
    }
    urls.push(toUrl(filePath))
  }

  urls.sort()

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n')

  writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), xml, 'utf-8')
  console.log(`sitemap.xml: ${urls.length} URLs (${skipped} noindex pages skipped)`)
}

main()
