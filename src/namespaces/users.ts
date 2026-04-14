import { URLs } from "../constants/urls.js"
import type {
  Core_ApiRoles,
  Core_MeReference,
  Core_TrustedUser,
  Core_TrustedUsersCollection,
  GetKnownUserRolesPathParams,
  GetUserPathParams,
  GetUsersPathParams,
  GetUsersQueryParams,
} from "../services/users/users.types.js"
import type { TypedTransport } from "../transport/index.js"

export function createUsers(t: TypedTransport) {
  return {
    list: (
      params: GetUsersPathParams,
      query?: GetUsersQueryParams,
    ): Promise<Core_TrustedUsersCollection> => t.get(URLs.users, params, query),

    knownRoles: (params: GetKnownUserRolesPathParams): Promise<Core_ApiRoles> =>
      t.get(URLs.userRoles, params),

    get: (params: GetUserPathParams): Promise<Core_TrustedUser> => t.get(URLs.user, params),

    me: (): Promise<Core_MeReference> => t.get(URLs.me),
  } as const
}
