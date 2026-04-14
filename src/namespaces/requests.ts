import { URLs } from "../constants/urls.js"
import type {
  Core_RequestState,
  GetAllUserRequestsStateInDomainPathParams,
  GetAllUserRequestsStateInDomainQueryParams,
  GetAllUserRequestsStateQueryParams,
  GetRequestStatePathParams,
  GetRequestStateQueryParams,
} from "../services/requests/requests.types.js"
import type { TypedTransport } from "../transport/index.js"

export function createRequests(t: TypedTransport) {
  return {
    state: (
      params: GetRequestStatePathParams,
      query?: GetRequestStateQueryParams,
    ): Promise<Core_RequestState> => t.get(URLs.request, params, query),

    userStates: (query?: GetAllUserRequestsStateQueryParams): Promise<Core_RequestState[]> =>
      t.get(URLs.meRequests, undefined, query),

    userStatesInDomain: (
      params: GetAllUserRequestsStateInDomainPathParams,
      query?: GetAllUserRequestsStateInDomainQueryParams,
    ): Promise<Core_RequestState[]> => t.get(URLs.requests, params, query),
  } as const
}
