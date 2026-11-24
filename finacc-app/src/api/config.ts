const productionApiUrl = 'https://finacc-production-93fb533c.up.railway.app'
const configuredApiUrl = (
  import.meta.env.VITE_API_BASE_URL?.trim()
  || (import.meta.env.PROD ? productionApiUrl : '')
).replace(/\/+$/, '')

export const API_BASE_URL = configuredApiUrl.replace(/\/api$/i, '')

export function apiUrl(path: string): string {
  if (import.meta.env.PROD && !API_BASE_URL) {
    throw new Error('Backend URL is missing. Set VITE_API_BASE_URL in Vercel and redeploy the frontend.')
  }
  return `${API_BASE_URL}${path}`
}
