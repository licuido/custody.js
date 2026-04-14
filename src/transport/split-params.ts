import { replacePathParams } from "../helpers/index.js"

/**
 * Splits a flat params object into path params and query params based on the URL template.
 * Path params are those matching `{paramName}` placeholders in the URL template.
 * Everything else is treated as a query param.
 *
 * @param urlTemplate - URL template with `{paramName}` placeholders
 * @param params - Flat object of all parameters
 * @returns Object with resolved `url` and optional `query` params
 */
export function splitParams<T extends Record<string, unknown>>(
  urlTemplate: string,
  params: T,
): { url: string; query: Record<string, unknown> | undefined } {
  const pathKeys = new Set([...urlTemplate.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))

  const pathParams: Record<string, string | number> = {}
  const query: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(params)) {
    if (pathKeys.has(key)) {
      pathParams[key] = value as string | number
    } else {
      query[key] = value
    }
  }

  return {
    url:
      Object.keys(pathParams).length > 0 ? replacePathParams(urlTemplate, pathParams) : urlTemplate,
    query: Object.keys(query).length > 0 ? query : undefined,
  }
}
