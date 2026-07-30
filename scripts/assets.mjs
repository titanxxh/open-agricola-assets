import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = path.join(root, 'dist')
const shaPattern = /^[0-9a-f]{40}$/
const imagePattern = /\.(jpg|png|webp)$/

const assertSha = (sha) => {
  if (!shaPattern.test(sha)) throw new Error(`Invalid commit SHA: ${sha}`)
}

const walk = async (directory) => {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(fullPath))
    else if (entry.isFile()) files.push(fullPath)
    else throw new Error(`Unsupported filesystem entry: ${fullPath}`)
  }
  return files
}

const assertAssetPaths = (files) => {
  if (files.length === 0) throw new Error('No assets found')
  if (new Set(files).size !== files.length) throw new Error('Duplicate asset path')
  for (const file of files) {
    const segments = file.split('/')
    if (
      !file.startsWith('assets/')
      || segments.some((segment) => segment === '' || segment === '.' || segment === '..')
      || file.includes('\\')
      || file.includes('?')
      || file.includes('#')
      || !imagePattern.test(file)
    ) {
      throw new Error(`Invalid asset path: ${file}`)
    }
  }
}

const listAssets = async (baseRoot) => {
  const assetsRoot = path.join(baseRoot, 'assets')
  const files = (await walk(assetsRoot))
    .map((file) => path.relative(baseRoot, file).split(path.sep).join('/'))
    .sort()
  assertAssetPaths(files)
  return files
}

const assertSameFiles = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} does not match the source asset tree`)
  }
}

const build = async (sha) => {
  assertSha(sha)
  const files = await listAssets(root)
  await rm(distRoot, { recursive: true, force: true })
  await mkdir(distRoot, { recursive: true })
  await cp(path.join(root, 'assets'), path.join(distRoot, 'assets'), { recursive: true })

  const copiedFiles = await listAssets(distRoot)
  assertSameFiles(copiedFiles, files, 'Pages artifact')
  for (const file of files) {
    const [source, copied] = await Promise.all([
      readFile(path.join(root, file)),
      readFile(path.join(distRoot, file)),
    ])
    if (!source.equals(copied)) throw new Error(`Copied bytes differ: ${file}`)
  }

  await Promise.all([
    writeFile(path.join(distRoot, 'asset-version.txt'), `${sha}\n`),
    writeFile(
      path.join(distRoot, 'asset-manifest.json'),
      `${JSON.stringify({ version: sha, files })}\n`,
    ),
  ])
  console.log(`Built ${files.length} assets for ${sha}`)
}

const fetchOk = async (url) => {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache' },
  })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response
}

const verify = async (base, sha) => {
  assertSha(sha)
  const baseUrl = new URL(base)
  if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new Error(`Invalid Pages URL: ${base}`)
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/`
  baseUrl.search = ''
  baseUrl.hash = ''

  const versionUrl = new URL('asset-version.txt', baseUrl)
  const manifestUrl = new URL('asset-manifest.json', baseUrl)
  const [version, manifestText] = await Promise.all([
    (await fetchOk(versionUrl)).text(),
    (await fetchOk(manifestUrl)).text(),
  ])
  if (version !== `${sha}\n`) throw new Error(`Live version does not match ${sha}`)

  const manifest = JSON.parse(manifestText)
  if (
    !manifest
    || typeof manifest !== 'object'
    || Array.isArray(manifest)
    || Object.keys(manifest).sort().join(',') !== 'files,version'
    || manifest.version !== sha
    || !Array.isArray(manifest.files)
    || manifest.files.some((file) => typeof file !== 'string')
  ) {
    throw new Error('Invalid live manifest')
  }
  assertAssetPaths(manifest.files)
  assertSameFiles(manifest.files, await listAssets(root), 'Live manifest')

  let next = 0
  let bytes = 0
  const workers = Array.from({ length: 12 }, async () => {
    while (next < manifest.files.length) {
      const file = manifest.files[next]
      next += 1
      const url = new URL(file, baseUrl)
      url.searchParams.set('v', sha)
      const [local, response] = await Promise.all([
        readFile(path.join(root, file)),
        fetchOk(url),
      ])
      const live = Buffer.from(await response.arrayBuffer())
      if (!local.equals(live)) throw new Error(`Live bytes differ: ${file}`)
      bytes += live.length
    }
  })
  await Promise.all(workers)
  console.log(`Verified ${manifest.files.length} live assets (${bytes} bytes) for ${sha}`)
}

const main = async () => {
  const [command, value, sha] = process.argv.slice(2)
  if (command === 'build') await build(value)
  else if (command === 'verify') await verify(value, sha)
  else throw new Error('Usage: assets.mjs build <sha> | verify <base-url> <sha>')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
