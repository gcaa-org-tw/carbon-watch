export type ViewMode = 'regular' | 'pro'

export const useViewMode = () => {
  // Use cookie to persist mode (works on both client and server)
  const mode = useCookie<ViewMode>('viewMode', {
    default: () => 'regular',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  })

  const setMode = (newMode: ViewMode) => {
    mode.value = newMode
  }

  const toggleMode = () => {
    mode.value = mode.value === 'regular' ? 'pro' : 'regular'
  }

  const isPro = computed(() => mode.value === 'pro')
  const isRegular = computed(() => mode.value === 'regular')

  return {
    mode: readonly(mode),
    isPro,
    isRegular,
    setMode,
    toggleMode
  }
}
