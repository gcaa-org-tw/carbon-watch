import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join, dirname, relative, sep } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', '.output', 'public')
const MIRROR_DIR = join(__dirname, '..', '.mirror')
const SITE_DIR = join(MIRROR_DIR, 'site')
const PAGE_TITLE = '主站鏡像測試'
const BATCH_SIZE = 250
const SKELETON_OVERRIDE = '<style>body{background:revert-layer;color:revert-layer;font:revert-layer}</style>'

interface PublishFile {
  path: string
  contentType?: string
}

function listFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => relative(SITE_DIR, join(entry.parentPath, entry.name)).split(sep).join('/'))
}

function extract(html: string, pattern: RegExp, label: string): string {
  const match = html.match(pattern)
  if (!match?.[1]) {
    console.error(`Missing ${label} in index.html. Run with MIRROR_BUILD=true.`)
    process.exit(1)
  }
  return match[1]
}

function copyAssets() {
  cpSync(join(PUBLIC_DIR, 'nuxt'), join(SITE_DIR, 'nuxt'), { recursive: true })
  cpSync(join(PUBLIC_DIR, 'fonts'), join(SITE_DIR, 'fonts'), { recursive: true })
  cpSync(join(PUBLIC_DIR, '__nuxt_content'), join(SITE_DIR, 'nuxt-content'), { recursive: true })

  for (const name of readdirSync(join(SITE_DIR, 'nuxt'))) {
    if (!name.endsWith('.js')) continue
    const filePath = join(SITE_DIR, 'nuxt', name)
    const js = readFileSync(filePath, 'utf-8')
    if (js.includes('/__nuxt_content/')) writeFileSync(filePath, js.replaceAll('/__nuxt_content/', '/nuxt-content/'))
  }
}

function buildPage(): string {
  const html = readFileSync(join(PUBLIC_DIR, 'index.html'), 'utf-8')
  const head = extract(html, /<head>([\s\S]*)<\/head>/, '<head>')
  const body = extract(html, /<body>([\s\S]*)<\/body>/, '<body>')
  if (!body.includes('window.__NUXT__.config=')) {
    console.error('Missing window.__NUXT__.config in index.html.')
    process.exit(1)
  }

  return [
    `<title>${PAGE_TITLE}</title>`,
    SKELETON_OVERRIDE,
    head
      .replace(/<meta charset="utf-8">/, '')
      .replace(/<meta name="viewport"[^>]*>/, '')
      .replaceAll('"/nuxt/', '"./nuxt/'),
    body.replace(
      /(window\.__NUXT__\.config=[\s\S]*?)<\/script>/,
      '$1;window.__NUXT__.config.app.baseURL=location.pathname.replace(/[^/]*$/,"")</script>',
    ),
  ].join('\n')
}

function main() {
  if (!existsSync(join(PUBLIC_DIR, 'nuxt'))) {
    console.error(`Missing ${join(PUBLIC_DIR, 'nuxt')}. Run MIRROR_BUILD=true nuxt generate first.`)
    process.exit(1)
  }

  rmSync(MIRROR_DIR, { recursive: true, force: true })
  mkdirSync(SITE_DIR, { recursive: true })
  copyAssets()

  const files: PublishFile[] = listFiles(SITE_DIR)
    .sort()
    .map(path => (path.endsWith('.wasm') ? { path, contentType: 'application/wasm' } : { path }))

  writeFileSync(join(SITE_DIR, 'index.html'), buildPage())

  const batchCount = Math.ceil(files.length / BATCH_SIZE)
  for (let i = 0; i < batchCount; i++) {
    const batch = files.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
    writeFileSync(join(MIRROR_DIR, `files-${i + 1}.json`), JSON.stringify(batch))
  }

  console.log(`Mirror: ${SITE_DIR}/index.html + ${files.length} files in ${batchCount} batches`)
}

main()
