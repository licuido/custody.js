export type RequestConfig = {
  timeout?: number
  signal?: AbortSignal
  headers?: Record<string, string>
}
