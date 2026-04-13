import type { Batch, SubmittableTransaction } from "xrpl"
import type { RippleCustodyClientOptions } from "./ripple-custody.types.js"
import {
  createAccounts,
  createDomains,
  createIntents,
  createLedgers,
  createRequests,
  createTickers,
  createTransactions,
  createUserInvitations,
  createUsers,
  createVaults,
} from "./namespaces/index.js"
import { ApiService } from "./services/apis/index.js"
import { AuthService } from "./services/auth/index.js"
import type { Core_IntentResponse } from "./services/intents/intents.types.js"
import {
  XrplService,
  type CustodyAccountSet,
  type CustodyBatch,
  type CustodyClawback,
  type CustodyDepositPreauth,
  type CustodyMpTokenAuthorize,
  type CustodyMpTokenIssuanceCreate,
  type CustodyMpTokenIssuanceDestroy,
  type CustodyMpTokenIssuanceSet,
  type CustodyOfferCreate,
  type CustodyPayment,
  type CustodyTicketCreate,
  type CustodyTrustline,
  type RawSignAndWaitOptions,
  type RawSignAndWaitResult,
  type RawSignInnerBatchOptions,
  type XrplIntentOptions,
} from "./services/xrpl/index.js"
import { TypedTransport } from "./transport/index.js"

export class RippleCustody {
  // Core services (eager initialization - required for all operations)
  private readonly apiService: ApiService
  private readonly authService: AuthService
  private readonly transport: TypedTransport

  // Lazy-initialized service instances
  private _xrplService?: XrplService

  private get xrplService(): XrplService {
    return (this._xrplService ??= new XrplService(this.apiService))
  }

  // Namespace objects built from factory functions
  public readonly domains: ReturnType<typeof createDomains>
  public readonly intents: ReturnType<typeof createIntents>
  public readonly transactions: ReturnType<typeof createTransactions>
  public readonly accounts: ReturnType<typeof createAccounts>
  public readonly users: ReturnType<typeof createUsers>
  public readonly userInvitations: ReturnType<typeof createUserInvitations>
  public readonly tickers: ReturnType<typeof createTickers>
  public readonly ledgers: ReturnType<typeof createLedgers>
  public readonly vaults: ReturnType<typeof createVaults>
  public readonly requests: ReturnType<typeof createRequests>

  constructor(options: RippleCustodyClientOptions) {
    const { authUrl, apiUrl, privateKey, publicKey, timeout } = options

    // Only initialize core services eagerly
    this.authService = new AuthService({ authUrl, timeout })
    this.apiService = new ApiService({
      apiUrl,
      authFormData: {
        publicKey,
      },
      authService: this.authService,
      privateKey,
      timeout,
    })
    this.transport = new TypedTransport(this.apiService)

    // Initialize namespaces from factories
    this.domains = createDomains(this.transport)
    this.intents = createIntents(this.transport)
    this.transactions = createTransactions(this.transport)
    this.accounts = createAccounts(this.transport)
    this.users = createUsers(this.transport)
    this.userInvitations = createUserInvitations(this.transport)
    this.tickers = createTickers(this.transport)
    this.ledgers = createLedgers(this.transport)
    this.vaults = createVaults(this.transport)
    this.requests = createRequests(this.transport)
  }

  // Auth namespace
  public readonly auth = {
    /**
     * @returns The current JWT token.
     */
    getCurrentToken: () => this.authService.getCurrentToken(),

    /**
     * @returns The current JWT token expiration, if available.
     */
    getTokenExpiration: () => this.authService.getTokenExpiration(),
  }

  // Xrpl namespace
  public readonly xrpl = {
    /**
     * Send an XRPL Payment. If you want to send XRP, do not specify the currency field.
     * @param params - The payment transaction details
     * @param options - Optional configuration for the payment intent
     * @returns The proposed intent response
     */
    sendPayment: async (
      params: CustodyPayment,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.sendPayment(params, options),

    /**
     * Create an XRPL TrustSet.
     * @param params - The trustline transaction details
     * @param options - Optional configuration for the trustline intent
     * @returns The proposed intent response
     */
    createTrustline: async (
      params: CustodyTrustline,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.createTrustline(params, options),

    /**
     * Create an XRPL DepositPreauth.
     * @param params - The deposit preauth transaction details
     * @param options - Optional configuration for the deposit preauth intent
     * @returns The proposed intent response
     */
    depositPreauth: async (
      params: CustodyDepositPreauth,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.depositPreauth(params, options),

    /**
     * Create an XRPL Clawback.
     * @param params - The clawback transaction details
     * @param options - Optional configuration for the clawback intent
     * @returns The proposed intent response
     */
    clawback: async (
      params: CustodyClawback,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.clawback(params, options),

    /**
     * Create an XRPL MPTokenIssuanceCreate.
     * @param params - The MPTokenIssuanceCreate transaction details
     * @param options - Optional configuration for the MPTokenIssuanceCreate intent
     * @returns The proposed intent response
     */
    mpTokenIssuanceCreate: async (
      params: CustodyMpTokenIssuanceCreate,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.mpTokenIssuanceCreate(params, options),

    /**
     * Create an XRPL MPTokenIssuanceSet.
     * @param params - The MPTokenIssuanceSet transaction details
     * @param options - Optional configuration for the MPTokenIssuanceSet intent
     * @returns The proposed intent response
     */
    mpTokenIssuanceSet: async (
      params: CustodyMpTokenIssuanceSet,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.mpTokenIssuanceSet(params, options),

    /**
     * Create an XRPL MPTokenIssuanceDestroy.
     * @param params - The MPTokenIssuanceDestroy transaction details
     * @param options - Optional configuration for the MPTokenIssuanceDestroy intent
     * @returns The proposed intent response
     */
    mpTokenIssuanceDestroy: async (
      params: CustodyMpTokenIssuanceDestroy,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.mpTokenIssuanceDestroy(params, options),

    /**
     * Create an XRPL MPTokenAuthorize.
     * @param params - The MPTokenAuthorize transaction details
     * @param options - Optional configuration for the MPTokenAuthorize intent
     * @returns The proposed intent response
     */
    mpTokenAuthorize: async (
      params: CustodyMpTokenAuthorize,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.mpTokenAuthorize(params, options),

    /**
     * Create an XRPL OfferCreate.
     * @param params - The OfferCreate transaction details
     * @param options - Optional configuration for the OfferCreate intent
     * @returns The proposed intent response
     */
    offerCreate: async (
      params: CustodyOfferCreate,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.offerCreate(params, options),

    /**
     * Create an XRPL AccountSet.
     * @param params - The AccountSet transaction details
     * @param options - Optional configuration for the AccountSet intent
     * @returns The proposed intent response
     */
    accountSet: async (
      params: CustodyAccountSet,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.accountSet(params, options),

    /**
     * Create an XRPL TicketCreate transaction.
     * @param params - The TicketCreate transaction details
     * @param options - Optional configuration for the TicketCreate intent
     * @returns The proposed intent response
     */
    ticketCreate: async (
      params: CustodyTicketCreate,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.ticketCreate(params, options),

    /**
     * Create an XRPL Batch transaction.
     * @param params - The Batch transaction details
     * @param options - Optional configuration for the Batch intent
     * @returns The proposed intent response
     */
    batch: async (
      params: CustodyBatch,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.batch(params, options),

    /**
     * Create an XRPL raw sign.
     * @param xrplTransaction - The XRPL transaction details
     * @param options - Optional configuration for the raw sign intent
     * @returns The proposed intent response
     */
    rawSign: async (
      xrplTransaction: SubmittableTransaction,
      options?: XrplIntentOptions,
    ): Promise<Core_IntentResponse> => this.xrplService.rawSign(xrplTransaction, options),

    /**
     * Raw-signs an XRPL transaction and waits for the manifest signature.
     * If SigningPubKey is not set on the transaction, it will be fetched automatically.
     * @param xrplTransaction - The XRPL transaction details
     * @param options - Optional configuration for the raw sign intent and polling
     * @returns The signature and signing public key in uppercase hex
     */
    rawSignAndWait: async (
      xrplTransaction: SubmittableTransaction,
      options?: RawSignAndWaitOptions,
    ): Promise<RawSignAndWaitResult> => this.xrplService.rawSignAndWait(xrplTransaction, options),

    /**
     * Proposes a raw sign intent for a Batch transaction envelope for a single inner account.
     * @param batch - The autofilled Batch transaction
     * @param signerAddress - The XRPL address of the inner account to sign for
     * @param options - Optional configuration for the raw sign intent
     * @returns The proposed intent response
     */
    rawSignInnerBatch: async (
      batch: Batch,
      signerAddress: string,
      options?: RawSignInnerBatchOptions,
    ): Promise<Core_IntentResponse> =>
      this.xrplService.rawSignInnerBatch(batch, signerAddress, options),

    /**
     * Signs a Batch transaction envelope for a single inner account and waits
     * for the manifest signature. Call once per inner account.
     * @param batch - The autofilled Batch transaction
     * @param signerAddress - The XRPL address of the inner account to sign for
     * @param options - Optional configuration for the raw sign intent and polling
     * @returns The signature and signing public key in uppercase hex
     */
    rawSignInnerBatchAndWait: async (
      batch: Batch,
      signerAddress: string,
      options?: RawSignInnerBatchOptions,
    ): Promise<RawSignAndWaitResult> =>
      this.xrplService.rawSignInnerBatchAndWait(batch, signerAddress, options),

    /**
     * Get the compressed secp256k1 public key for an XRPL account.
     * @param params - The domain ID and account ID
     * @returns The compressed public key in uppercase hex format
     */
    getPublicKey: async (params: { domainId: string; accountId: string }): Promise<string> =>
      this.xrplService.getPublicKey(params),
  }
}
