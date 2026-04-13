import { URLs } from "../constants/urls.js"
import { sleep } from "../helpers/index.js"
import { CustodyError } from "../models/index.js"
import {
  TERMINAL_STATUSES,
  type Core_ApproveIntentBody,
  type Core_GetIntentPathParams,
  type Core_GetIntentsPathParams,
  type Core_GetIntentsQueryParams,
  type Core_IntentDryRunRequest,
  type Core_IntentDryRunResponse,
  type Core_IntentResponse,
  type Core_ProposeIntentBody,
  type Core_RejectIntentBody,
  type Core_RemainingDomainUsers,
  type Core_RemainingUsersIntentPathParams,
  type Core_RemainingUsersIntentQueryParams,
  type Core_TrustedIntent,
  type WaitForExecutionOptions,
  type WaitForExecutionResult,
} from "../services/intents/intents.types.js"
import type { TypedTransport } from "../transport/index.js"

/**
 * Fetches an intent with retry logic for 404 errors.
 * Useful when the intent might not be immediately available after creation.
 */
async function getIntentWithRetry(
  t: TypedTransport,
  params: Core_GetIntentPathParams,
  maxRetries: number,
  intervalMs: number,
): Promise<Core_TrustedIntent> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await t.get<Core_TrustedIntent>(URLs.getIntent, params)
    } catch (error) {
      if (error instanceof CustodyError && error.statusCode === 404) {
        lastError = error
        if (attempt < maxRetries) {
          await sleep(intervalMs)
        }
        continue
      }
      throw error
    }
  }

  throw lastError
}

/**
 * Wait for an intent to reach a terminal status (Executed, Failed, Expired, or Rejected).
 * Polls the intent status at regular intervals until it completes or max retries is reached.
 */
async function waitForExecution(
  t: TypedTransport,
  params: Core_GetIntentPathParams,
  options: WaitForExecutionOptions = {},
): Promise<WaitForExecutionResult> {
  const {
    maxRetries = 10,
    intervalMs = 3000,
    notFoundRetries = 3,
    notFoundIntervalMs = 1000,
    onStatusCheck,
  } = options

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const intent = await getIntentWithRetry(t, params, notFoundRetries, notFoundIntervalMs)
    const status = intent.data.state.status

    onStatusCheck?.(status, attempt)

    if (TERMINAL_STATUSES.includes(status)) {
      return {
        status,
        isTerminal: true,
        isSuccess: status === "Executed",
        intent,
      }
    }

    if (attempt < maxRetries) {
      await sleep(intervalMs)
    }
  }

  const finalIntent = await getIntentWithRetry(t, params, notFoundRetries, notFoundIntervalMs)
  return {
    status: finalIntent.data.state.status,
    isTerminal: false,
    isSuccess: false,
    intent: finalIntent,
  }
}

export function createIntents(t: TypedTransport) {
  return {
    propose: (params: Core_ProposeIntentBody): Promise<Core_IntentResponse> =>
      t.post(URLs.intents, params),

    approve: (params: Core_ApproveIntentBody): Promise<Core_IntentResponse> =>
      t.post(URLs.intentsApprove, params),

    reject: (params: Core_RejectIntentBody): Promise<Core_IntentResponse> =>
      t.post(URLs.intentsReject, params),

    get: (
      params: Core_GetIntentPathParams,
      query?: Core_GetIntentsQueryParams,
    ): Promise<Core_TrustedIntent> => t.get(URLs.getIntent, params, query),

    list: (
      params: Core_GetIntentsPathParams,
      query?: Core_GetIntentsQueryParams,
    ): Promise<Core_IntentResponse> => t.get(URLs.domainIntents, params, query),

    dryRun: (params: Core_IntentDryRunRequest): Promise<Core_IntentDryRunResponse> =>
      t.post(URLs.intentsDryRun, params),

    remainingUsers: (
      params: Core_RemainingUsersIntentPathParams,
      query?: Core_RemainingUsersIntentQueryParams,
    ): Promise<Core_RemainingDomainUsers> => t.get(URLs.intentRemainingUsers, params, query),

    getAndWait: (
      params: Core_GetIntentPathParams,
      options?: WaitForExecutionOptions,
    ): Promise<WaitForExecutionResult> => waitForExecution(t, params, options),
  } as const
}
