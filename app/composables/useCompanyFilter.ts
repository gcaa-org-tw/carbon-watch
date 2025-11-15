import type { CompanyData } from '~/types/company'
import companyListData from '~/assets/data/company-list.json'

export const useCompanyFilter = () => {
  const route = useRoute()
  const router = useRouter()

  // Initialize filters from URL query parameters
  const filters = ref({
    search: (route.query.search as string) || '',
    region: (route.query.region as string) || '',
    industry: (route.query.industry as string) || ''
  })

  // Watch filters and sync to URL query
  watch(
    filters,
    (newFilters) => {
      const query: Record<string, string> = {}
      
      if (newFilters.search) {
        query.search = newFilters.search
      }
      if (newFilters.region && newFilters.region !== '全部地區') {
        query.region = newFilters.region
      }
      if (newFilters.industry && newFilters.industry !== '全部產業') {
        query.industry = newFilters.industry
      }

      router.push({ query })
    },
    { deep: true }
  )

  // Filter companies based on search and filters
  const filteredCompanies = computed(() => {
    let companies = companyListData as CompanyData[]

    // Apply search filter
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      companies = companies.filter(company => 
        company['公司'].toLowerCase().includes(searchLower) ||
        company['公司全名']?.toLowerCase().includes(searchLower)
      )
    }

    // Apply region filter
    if (filters.value.region && filters.value.region !== '全部地區') {
      companies = companies.filter(company => 
        company['代表縣市'] === filters.value.region
      )
    }

    // Apply industry filter
    if (filters.value.industry && filters.value.industry !== '全部產業') {
      companies = companies.filter(company => 
        company['產業分類'] === filters.value.industry
      )
    }

    return companies
  })

  return {
    filters,
    filteredCompanies
  }
}
