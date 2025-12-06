import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

interface ToolMetadata {
  id: string
  name: string
  category: string
  componentName: string
}

interface ToolRoute {
  slug: string
  filePath: string
  componentName?: string
  componentImportPath?: string
}

interface ComponentAnalysis {
  componentName: string | null
  filePath: string
  slug: string
  type: 'ai' | 'calculator'
  usesAutoFillData: boolean
  usesAISuggestions: boolean
  usesCallAIUtility: boolean
  usesDataProvider: boolean
  usesDomainCRUD: boolean
  usesSupabaseClient: boolean
  fetchEndpoints: string[]
  usesMockKeyword: boolean
  hasTodoComment: boolean
  hasComingSoonKeyword: boolean
}

interface ToolReport {
  id: string
  name: string
  category: string
  type: 'AI Tool' | 'Calculator/Utility'
  componentPath: string
  routes: string[]
  status: {
    implementation: 'backend-connected' | 'client-only' | 'needs-backend' | 'unknown'
    aiIntegration: 'present' | 'missing' | 'not-applicable'
    autoFill: 'present' | 'missing' | 'not-applicable'
  }
  signals: {
    usesAutoFillData: boolean
    usesAISuggestions: boolean
    usesCallAIUtility: boolean
    usesDataProvider: boolean
    usesDomainCRUD: boolean
    usesSupabaseClient: boolean
    fetchEndpoints: string[]
    flags: string[]
  }
}

interface ApiRouteReport {
  id: string
  path: string
  filePath: string
  methods: string[]
  usesOpenAI: boolean
  usesSupabase: boolean
  hasTodoComment: boolean
  notes: string[]
}

interface AuditReport {
  generatedAt: string
  summary: {
    totalComponents: number
    aiComponents: number
    calculatorComponents: number
    toolsMappedViaAllTools: number
    apiRoutes: number
  }
  tools: ToolReport[]
  apiRoutes: ApiRouteReport[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const COMPONENTS_DIR = path.join(ROOT_DIR, 'components', 'tools')
const APP_TOOLS_DIR = path.join(ROOT_DIR, 'app', 'tools')
const API_TOOLS_DIR = path.join(ROOT_DIR, 'app', 'api', 'ai-tools')
const ALL_TOOLS_PAGE = path.join(APP_TOOLS_DIR, 'page.tsx')
const REPORTS_DIR = path.join(ROOT_DIR, 'reports')
const OUTPUT_FILE = path.join(REPORTS_DIR, 'tools-status.json')

async function readFileSafe(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch (error) {
    return ''
  }
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const result: string[] = []
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const childFiles = await listFilesRecursive(entryPath)
        result.push(...childFiles)
      } else if (entry.isFile()) {
        result.push(entryPath)
      }
    }
  } catch (error) {
    // ignore missing directories
  }
  return result
}

function toUnixPath(filePath: string): string {
  return filePath.split(path.sep).join('/')
}

function deriveSlug(filePath: string): string {
  const fileName = path.basename(filePath, path.extname(filePath))
  return fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function detectComponentName(content: string): string | null {
  const exportFunctionMatch = content.match(/export\s+function\s+(\w+)/)
  if (exportFunctionMatch) {
    return exportFunctionMatch[1]
  }

  const exportConstMatch = content.match(/export\s+const\s+(\w+)/)
  if (exportConstMatch) {
    return exportConstMatch[1]
  }

  const defaultFunctionMatch = content.match(/export\s+default\s+function\s+(\w+)/)
  if (defaultFunctionMatch) {
    return defaultFunctionMatch[1]
  }

  return null
}

function extractFetchEndpoints(content: string): string[] {
  const matches = [...content.matchAll(/fetch\(\s*['"`]([^'"`]+)['"`]/g)]
  return Array.from(new Set(matches.filter(match => match[1].startsWith('/api')).map(match => match[1])))
}

function analyzeComponent(filePath: string, content: string): ComponentAnalysis {
  const isAITool = toUnixPath(filePath).includes('/components/tools/ai-tools/')
  const componentName = detectComponentName(content)
  const slug = deriveSlug(filePath)

  const fetchEndpoints = extractFetchEndpoints(content)

  return {
    componentName,
    filePath: toUnixPath(path.relative(ROOT_DIR, filePath)),
    slug,
    type: isAITool ? 'ai' : 'calculator',
    usesAutoFillData: content.includes('useAutoFillData'),
    usesAISuggestions: content.includes('getAISuggestions') || content.includes('getFinancialAnalysis'),
    usesCallAIUtility: content.includes('callAI('),
    usesDataProvider: content.includes('useData('),
    usesDomainCRUD: content.includes('useDomainCRUD('),
    usesSupabaseClient: content.includes('supabase') || content.includes('createClient('),
    fetchEndpoints,
    usesMockKeyword: /mock|placeholder|sample data/i.test(content),
    hasTodoComment: /TODO/i.test(content),
    hasComingSoonKeyword: /coming soon|LegacyComingSoon/i.test(content)
  }
}

async function collectComponentAnalyses(): Promise<ComponentAnalysis[]> {
  const files = await listFilesRecursive(COMPONENTS_DIR)
  const tsxFiles = files.filter(file => file.endsWith('.tsx'))
  const analyses: ComponentAnalysis[] = []

  for (const file of tsxFiles) {
    const content = await readFileSafe(file)
    if (!content) continue
    analyses.push(analyzeComponent(file, content))
  }

  return analyses
}

async function extractToolMetadata(): Promise<Record<string, ToolMetadata>> {
  const metadataMap: Record<string, ToolMetadata> = {}
  const content = await readFileSafe(ALL_TOOLS_PAGE)
  if (!content) return metadataMap

  const toolRegex = /\{\s*id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?category:\s*'([^']+)'[\s\S]*?component:\s*([A-Za-z0-9_]+)/g
  let match: RegExpExecArray | null

  while ((match = toolRegex.exec(content))) {
    const [ , id, name, category, componentName ] = match
    metadataMap[componentName] = { id, name, category, componentName }
  }

  return metadataMap
}

async function collectToolRoutes(): Promise<ToolRoute[]> {
  const routes: ToolRoute[] = []
  try {
    const entries = await fs.readdir(APP_TOOLS_DIR, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const slug = entry.name
      const pageFile = path.join(APP_TOOLS_DIR, slug, 'page.tsx')
      const pageContent = await readFileSafe(pageFile)
      if (!pageContent) continue

      const importMatch = pageContent.match(/import\s+\{\s*(\w+)\s*\}\s+from\s+'@\/components\/tools\/([^']+)'/)
      const componentName = importMatch ? importMatch[1] : undefined
      const componentImportPath = importMatch ? importMatch[2] : undefined

      routes.push({
        slug,
        filePath: toUnixPath(path.relative(ROOT_DIR, pageFile)),
        componentName,
        componentImportPath
      })
    }
  } catch (error) {
    // ignore if directory missing
  }

  return routes
}

function buildFlags(component: ComponentAnalysis, metadata?: ToolMetadata): string[] {
  const flags: string[] = []
  if (component.usesDataProvider) {
    flags.push('Uses deprecated useData provider')
  }
  if (component.usesMockKeyword) {
    flags.push('Contains mock/placeholder keyword (manual review)')
  }
  if (component.hasTodoComment) {
    flags.push('Contains TODO comment')
  }
  if (component.hasComingSoonKeyword) {
    flags.push('Marked as coming soon')
  }
  if (!metadata) {
    flags.push('Not mapped in ALL_TOOLS configuration')
  }
  if (component.type === 'ai' && component.fetchEndpoints.length === 0 && !component.usesSupabaseClient && !component.usesDataProvider && !component.usesDomainCRUD) {
    flags.push('AI tool missing backend integration (detected)')
  }
  return Array.from(new Set(flags))
}

function classifyImplementation(component: ComponentAnalysis): 'backend-connected' | 'client-only' | 'needs-backend' | 'unknown' {
  const hasBackendHook = component.fetchEndpoints.length > 0 || component.usesDomainCRUD || component.usesSupabaseClient || component.usesDataProvider
  if (component.type === 'ai') {
    return hasBackendHook ? 'backend-connected' : 'needs-backend'
  }
  return hasBackendHook ? 'backend-connected' : 'client-only'
}

function classifyAIIntegration(component: ComponentAnalysis): 'present' | 'missing' | 'not-applicable' {
  if (component.type !== 'ai') return 'not-applicable'
  const hasAI = component.usesAISuggestions || component.usesCallAIUtility || component.fetchEndpoints.some(endpoint => endpoint.includes('/api/ai'))
  return hasAI ? 'present' : 'missing'
}

function classifyAutoFill(component: ComponentAnalysis): 'present' | 'missing' | 'not-applicable' {
  if (component.type === 'ai') {
    return component.usesAutoFillData ? 'present' : 'missing'
  }
  return component.usesAutoFillData ? 'present' : 'not-applicable'
}

function toToolReport(component: ComponentAnalysis, metadataMap: Record<string, ToolMetadata>, routes: ToolRoute[]): ToolReport {
  const metadata = component.componentName ? metadataMap[component.componentName] : undefined
  const mappedRoutes = routes
    .filter(route => route.componentName === component.componentName)
    .map(route => `/tools/${route.slug}`)

  return {
    id: metadata?.id || component.slug,
    name: metadata?.name || component.componentName || component.slug,
    category: metadata?.category || (component.type === 'ai' ? 'AI Tools' : 'Calculator/Utility'),
    type: component.type === 'ai' ? 'AI Tool' : 'Calculator/Utility',
    componentPath: component.filePath,
    routes: mappedRoutes,
    status: {
      implementation: classifyImplementation(component),
      aiIntegration: classifyAIIntegration(component),
      autoFill: classifyAutoFill(component)
    },
    signals: {
      usesAutoFillData: component.usesAutoFillData,
      usesAISuggestions: component.usesAISuggestions,
      usesCallAIUtility: component.usesCallAIUtility,
      usesDataProvider: component.usesDataProvider,
      usesDomainCRUD: component.usesDomainCRUD,
      usesSupabaseClient: component.usesSupabaseClient,
      fetchEndpoints: component.fetchEndpoints,
      flags: buildFlags(component, metadata)
    }
  }
}

async function collectApiRoutes(): Promise<ApiRouteReport[]> {
  const routes: ApiRouteReport[] = []
  const entries = await listFilesRecursive(API_TOOLS_DIR)
  const routeFiles = entries.filter(file => file.endsWith('route.ts'))

  for (const file of routeFiles) {
    const content = await readFileSafe(file)
    const relativePath = toUnixPath(path.relative(ROOT_DIR, file))
    const methods = Array.from(content.matchAll(/export\s+const\s+(GET|POST|PUT|PATCH|DELETE)/g)).map(match => match[1])
    const usesOpenAI = /openai|callAI|GoogleGenerativeAI|Gemini/i.test(content)
    const usesSupabase = /supabase|createClient/i.test(content)
    const hasTodoComment = /TODO/i.test(content)

    const pathMatch = relativePath.match(/app\/api\/(.*)\/route\.ts$/)
    const apiPath = pathMatch ? `/${pathMatch[1]}` : `/api/${path.basename(file, '.ts')}`

    const notes: string[] = []
    if (!usesOpenAI) {
      notes.push('No OpenAI/Gemini usage detected (manual verification)')
    }
    if (hasTodoComment) {
      notes.push('Contains TODO comment')
    }

    routes.push({
      id: apiPath.replace(/^\//, '').replace(/\//g, '-'),
      path: apiPath,
      filePath: relativePath,
      methods,
      usesOpenAI,
      usesSupabase,
      hasTodoComment,
      notes
    })
  }

  return routes.sort((a, b) => a.path.localeCompare(b.path))
}

async function generateReport(): Promise<AuditReport> {
  const [components, metadataMap, routes, apiRoutes] = await Promise.all([
    collectComponentAnalyses(),
    extractToolMetadata(),
    collectToolRoutes(),
    collectApiRoutes()
  ])

  const toolReports: ToolReport[] = components
    .sort((a, b) => a.filePath.localeCompare(b.filePath))
    .map(component => toToolReport(component, metadataMap, routes))

  const summary = {
    totalComponents: components.length,
    aiComponents: components.filter(component => component.type === 'ai').length,
    calculatorComponents: components.filter(component => component.type === 'calculator').length,
    toolsMappedViaAllTools: toolReports.filter(tool => tool.signals.flags.every(flag => flag !== 'Not mapped in ALL_TOOLS configuration')).length,
    apiRoutes: apiRoutes.length
  }

  return {
    generatedAt: new Date().toISOString(),
    summary,
    tools: toolReports,
    apiRoutes
  }
}

async function main() {
  const report = await generateReport()
  await fs.mkdir(REPORTS_DIR, { recursive: true })
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf8')
  console.log(`📊 Tools audit complete → ${toUnixPath(path.relative(ROOT_DIR, OUTPUT_FILE))}`)
  console.log(`   Total components: ${report.summary.totalComponents}`)
  console.log(`   AI components: ${report.summary.aiComponents}`)
  console.log(`   Calculator components: ${report.summary.calculatorComponents}`)
  console.log(`   API routes analyzed: ${report.summary.apiRoutes}`)
}

main().catch(error => {
  console.error('❌ Tools audit failed:', error)
  process.exitCode = 1
})
