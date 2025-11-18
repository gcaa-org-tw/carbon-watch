import type { UseSeoMetaInput } from '@unhead/vue'

interface SeoOptions {
  /**
   * Page title. Will automatically append ' | 排碳大戶觀測站' unless appendSiteName is false
   */
  title?: string
  
  /**
   * Page description for meta tags
   */
  description?: string
  
  /**
   * Whether to append ' | 排碳大戶觀測站' to the title
   * @default true
   */
  appendSiteName?: boolean
  
  /**
   * Canonical URL for the page
   */
  canonical?: string
  
  /**
   * Additional SEO meta options to pass to useSeoMeta
   */
  meta?: UseSeoMetaInput
  
  /**
   * Content data from queryCollection - will extract title if available
   */
  content?: {
    title?: string
    [key: string]: unknown
  }
}

/**
 * Unified SEO helper for all pages
 * 
 * Features:
 * 1. Auto-appends ' | 排碳大戶觀測站' to titles unless disabled
 * 2. Extracts title from queryCollection content if available
 * 3. Sets up common SEO meta tags and HTML attributes
 * 
 * @example
 * // Basic usage
 * useSeo({ title: 'My Page', description: 'Page description' })
 * 
 * @example
 * // With queryCollection content
 * const { data: page } = await useAsyncData('page', () => queryCollection('content').first())
 * useSeo({ content: page.value, description: 'Page description' })
 * 
 * @example
 * // Override site name appending
 * useSeo({ title: 'Custom Full Title', appendSiteName: false })
 */
export function useSeo(options: SeoOptions = {}) {
  const {
    title: providedTitle,
    description,
    appendSiteName = true,
    canonical,
    meta = {},
    content,
  } = options

  const siteName = '排碳大戶觀測站'
  
  // Determine the final title
  let finalTitle = providedTitle
  
  // If content is provided and has a title, use it
  if (content?.title && !providedTitle) {
    finalTitle = content.title
  }
  
  // Append site name if enabled and title doesn't already include it
  if (finalTitle && appendSiteName && !finalTitle.includes(siteName)) {
    finalTitle = `${finalTitle} | ${siteName}`
  }
  
  // Build SEO meta object
  const seoMeta: UseSeoMetaInput = {
    ...meta,
  }
  
  if (finalTitle) {
    seoMeta.title = finalTitle
  }
  
  if (description) {
    seoMeta.description = description
  }
  
  // Set SEO meta tags
  useSeoMeta(seoMeta)
  
  // Set HTML attributes and canonical link
  const headConfig = {
    htmlAttrs: {
      lang: 'zh-TW',
    },
    link: canonical ? [
      {
        rel: 'canonical',
        href: canonical,
      },
    ] : undefined,
  }
  
  useHead(headConfig)
}
