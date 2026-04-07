import { createPublicKey } from "crypto"
import dayjs from "dayjs"
import { v7 as uuidv7 } from "uuid"
import {
  encodeForSigning,
  encodeForSigningBatch,
  hashes,
  type Batch,
  type SubmittableTransaction,
} from "xrpl"
import { sleep } from "../../helpers/async/async.js"
import { CustodyError } from "../../models/index.js"
import { AccountsService } from "../accounts/index.js"
import type { ApiService } from "../apis/index.js"
import { DomainResolverService } from "../domain-resolver/index.js"
import {
  IntentsService,
  type Core_IntentResponse,
  type Core_ProposeIntentBody,
} from "../intents/index.js"
import type {
  BuildTransactionIntentProps,
  Core_XrplOperation,
  CustodyAccountSet,
  CustodyClawback,
  CustodyDepositPreauth,
  CustodyMpTokenAuthorize,
  CustodyMpTokenIssuanceCreate,
  CustodyMpTokenIssuanceDestroy,
  CustodyMpTokenIssuanceSet,
  CustodyOfferCreate,
  CustodyPayment,
  CustodyTrustline,
  IntentContext,
  RawSignAndWaitOptions,
  RawSignAndWaitResult,
  RawSignInnerBatchOptions,
  WaitForSignatureOptions,
  XrplIntentOptions,
} from "./xrpl.types.js"

export class XrplService {
  private readonly intentService: IntentsService
  private readonly domainResolver: DomainResolverService
  private readonly accountsService: AccountsService

  constructor(apiService: ApiService) {
    this.intentService = new IntentsService(apiService)
    this.domainResolver = new DomainResolverService(apiService)
    this.accountsService = new AccountsService(apiService)
  }

  /**
   * Creates and proposes a payment intent for an XRPL payment transaction.
   * @param payment - The payment transaction details
   * @param options - Optional configuration for the payment intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async sendPayment(
    payment: CustodyPayment,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    return this.proposeXrplIntent({ ...payment, type: "Payment" }, options)
  }

  /**
   * Creates and proposes a trustline intent for an XRPL TrustSet transaction.
   * @param trustline - The trustline transaction details
   * @param options - Optional configuration for the trustline intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async createTrustline(
    trustline: CustodyTrustline,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    return this.proposeXrplIntent({ ...trustline, type: "TrustSet" }, options)
  }

  /**
   * Creates and proposes a deposit preauth intent for an XRPL DepositPreauth transaction.
   * @param depositPreauth - The deposit preauth transaction details
   * @param options - Optional configuration for the deposit preauth intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async depositPreauth(
    depositPreauth: CustodyDepositPreauth,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    return this.proposeXrplIntent({ ...depositPreauth, type: "DepositPreauth" }, options)
  }

  /**
   * Creates and proposes a clawback intent for an XRPL Clawback transaction.
   * @param clawback - The clawback transaction details
   * @param options - Optional configuration for the clawback intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async clawback(
    clawback: CustodyClawback,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    return this.proposeXrplIntent({ ...clawback, type: "Clawback" }, options)
  }

  /**
   * Creates and proposes a MPTokenAuthorize intent for an XRPL MPTokenAuthorize transaction.
   * @param mpTokenAuthorize - The MPTokenAuthorize transaction details
   * @param options - Optional configuration for the MPTokenAuthorize intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async mpTokenAuthorize(
    mpTokenAuthorize: CustodyMpTokenAuthorize,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    return this.proposeXrplIntent({ ...mpTokenAuthorize, type: "MPTokenAuthorize" }, options)
  }

  /**
   * Creates and proposes a OfferCreate intent for an XRPL OfferCreate transaction.
   * @param offerCreate - The OfferCreate transaction details
   * @param options - Optional configuration for the OfferCreate intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async offerCreate(
    offerCreate: CustodyOfferCreate,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    return this.proposeXrplIntent({ ...offerCreate, type: "OfferCreate" }, options)
  }

  /**
   * Creates and proposes a AccountSet intent for an XRPL AccountSet transaction.
   * @param accountSet - The AccountSet transaction details
   * @param options - Optional configuration for the AccountSet intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async accountSet(
    accountSet: CustodyAccountSet,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    return this.proposeXrplIntent({ ...accountSet, type: "AccountSet" }, options)
  }

  /**
   * Creates and proposes a MPTokenIssuanceCreate intent for an XRPL MPTokenIssuanceCreate transaction.
   * @param mpTokenIssuanceCreate - The MPTokenIssuanceCreate transaction details
   * @param options - Optional configuration for the MPTokenIssuanceCreate intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async mpTokenIssuanceCreate(
    mpTokenIssuanceCreate: CustodyMpTokenIssuanceCreate,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    return this.proposeXrplIntent(
      { ...mpTokenIssuanceCreate, type: "MPTokenIssuanceCreate" },
      options,
    )
  }

  /**
   * Creates and proposes a MPTokenIssuanceSet intent for an XRPL MPTokenIssuanceSet transaction.
   * @param params - The MPTokenIssuanceSet transaction details
   * @param options - Optional configuration for the MPTokenIssuanceSet intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async mpTokenIssuanceSet(
    params: CustodyMpTokenIssuanceSet,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    return this.proposeXrplIntent({ ...params, type: "MPTokenIssuanceSet" }, options)
  }

  /**
   * Creates and proposes a MPTokenIssuanceDestroy intent for an XRPL MPTokenIssuanceDestroy transaction.
   * @param params - The MPTokenIssuanceDestroy transaction details
   * @param options - Optional configuration for the MPTokenIssuanceDestroy intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async mpTokenIssuanceDestroy(
    params: CustodyMpTokenIssuanceDestroy,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    return this.proposeXrplIntent({ ...params, type: "MPTokenIssuanceDestroy" }, options)
  }

  /**
   * Retrieves the compressed secp256k1 public key for an XRPL account.
   * @param domainId - The domain ID of the account
   * @param accountId - The account ID
   * @returns The compressed public key in uppercase hex format
   * @throws {CustodyError} If the account is not a Vault account or the key is not found
   */
  public async getPublicKey({
    domainId,
    accountId,
  }: {
    domainId: string
    accountId: string
  }): Promise<string> {
    const account = await this.accountsService.getAccount({ domainId, accountId })

    const { providerDetails } = account.data

    if (providerDetails.type !== "Vault") {
      throw new CustodyError({ reason: "Account is not a Vault account" })
    }

    const key = providerDetails.keys?.find((k) => k.id === "SECP256K1_CUSTODY_1")

    if (!key?.publicKey) {
      throw new CustodyError({
        reason: "Public key not found for key ID SECP256K1_CUSTODY_1",
      })
    }

    return compressPublicKey(key.publicKey.value)
  }

  /**
   * Creates and proposes a raw sign intent for an XRPL transaction.
   * @param xrplTransaction - The XRPL transaction details
   * @param options - Optional configuration for the raw sign intent
   * @returns The proposed intent response
   * @throws {CustodyError} If validation fails or the sender account is not found
   */
  public async rawSign(
    xrplTransaction: SubmittableTransaction,
    options: XrplIntentOptions = {},
  ): Promise<Core_IntentResponse> {
    const context = await this.resolveIntentContext(xrplTransaction.Account, {
      domainId: options.domainId,
    })

    const encoded = encodeForSigning(xrplTransaction)
    const base64Encoded = Buffer.from(encoded, "hex").toString("base64")

    const { intentResponse } = await this.proposeRawSignIntent(base64Encoded, context, options)
    return intentResponse
  }

  /**
   * Raw-signs an XRPL transaction and waits for the manifest signature.
   *
   * If `SigningPubKey` is not already set on the transaction, it will be
   * fetched from the custody account and set automatically.
   *
   * @param xrplTransaction - The XRPL transaction details
   * @param options - Optional configuration for the raw sign intent and polling
   * @returns The signature and signing public key in uppercase hex
   * @throws {CustodyError} If validation fails, the sender account is not found,
   *   or the manifest signature is not available after maximum retries
   */
  public async rawSignAndWait(
    xrplTransaction: SubmittableTransaction,
    options: RawSignAndWaitOptions = {},
  ): Promise<RawSignAndWaitResult> {
    const context = await this.resolveIntentContext(xrplTransaction.Account, {
      domainId: options.domainId,
    })

    if (!xrplTransaction.SigningPubKey) {
      const pubKey = await this.getPublicKey({
        domainId: context.domainId,
        accountId: context.accountId,
      })
      xrplTransaction.SigningPubKey = pubKey
    }

    const encoded = encodeForSigning(xrplTransaction)
    const base64Encoded = Buffer.from(encoded, "hex").toString("base64")

    const { payloadId } = await this.proposeRawSignIntent(base64Encoded, context, options)

    const signature = await this.waitForManifestSignature(
      context.domainId,
      context.accountId,
      payloadId,
      options.polling,
    )

    return {
      signature,
      signingPubKey: xrplTransaction.SigningPubKey,
    }
  }

  /**
   * Proposes a raw sign intent for a Batch transaction envelope for a single
   * inner account. The batch envelope (`flags` + all inner transaction hashes)
   * is encoded using `encodeForSigningBatch` and signed with the key of the
   * specified `signerAddress`.
   *
   * All signers sign the same envelope data. Call this once per inner account
   * that is managed by this custody instance.
   *
   * @param batch - The autofilled Batch transaction (with all inner transactions)
   * @param signerAddress - The XRPL address of the inner account to sign for
   * @param options - Optional configuration for the raw sign intent
   * @returns The proposed intent response
   * @throws {CustodyError} If signerAddress is not in the batch, or the account is not found
   */
  public async rawSignInnerBatch(
    batch: Batch,
    signerAddress: string,
    options: RawSignInnerBatchOptions = {},
  ): Promise<Core_IntentResponse> {
    this.validateBatchSigner(batch, signerAddress)

    const context = await this.resolveIntentContext(signerAddress, {
      domainId: options.domainId,
    })

    const base64Encoded = this.encodeBatchForSigning(batch)

    const { intentResponse } = await this.proposeRawSignIntent(base64Encoded, context, options)
    return intentResponse
  }

  /**
   * Signs a Batch transaction envelope for a single inner account and waits
   * for the manifest signature.
   *
   * All signers sign the same envelope (`flags` + all inner transaction hashes).
   * Call this method once per inner account managed by this custody instance.
   * Inner accounts on other custody instances sign independently with their own SDK.
   *
   * @param batch - The autofilled Batch transaction (with all inner transactions)
   * @param signerAddress - The XRPL address of the inner account to sign for
   * @param options - Optional configuration for the raw sign intent and polling
   * @returns The signature and signing public key in uppercase hex
   * @throws {CustodyError} If signerAddress is not in the batch, the account is not found,
   *   or the manifest signature is not available after maximum retries
   */
  public async rawSignInnerBatchAndWait(
    batch: Batch,
    signerAddress: string,
    options: RawSignInnerBatchOptions = {},
  ): Promise<RawSignAndWaitResult> {
    this.validateBatchSigner(batch, signerAddress)

    const context = await this.resolveIntentContext(signerAddress, {
      domainId: options.domainId,
    })

    const signingPubKey = await this.getPublicKey({
      domainId: context.domainId,
      accountId: context.accountId,
    })

    const base64Encoded = this.encodeBatchForSigning(batch)

    const { payloadId } = await this.proposeRawSignIntent(base64Encoded, context, options)

    const signature = await this.waitForManifestSignature(
      context.domainId,
      context.accountId,
      payloadId,
      options.polling,
    )

    return { signature, signingPubKey }
  }

  /**
   * Resolves the full intent context by combining domain resolution and account lookup.
   * @private
   */
  private async resolveIntentContext(
    address: string,
    options: { domainId?: string } = {},
  ): Promise<IntentContext> {
    const { domainId, userId } = await this.domainResolver.resolve(options)
    const account = await this.accountsService.findByAddress(address)
    return { domainId, userId, ...account }
  }

  /**
   * Validates that the signer address is involved in at least one inner transaction.
   * @private
   */
  private validateBatchSigner(batch: Batch, signerAddress: string): void {
    const involvedAccounts = new Set(
      batch.RawTransactions.map((rawTx) => rawTx.RawTransaction.Account),
    )
    if (!involvedAccounts.has(signerAddress)) {
      throw new CustodyError({
        reason: `Address ${signerAddress} is not involved in any inner transaction of the Batch`,
      })
    }
  }

  /**
   * Encodes a Batch transaction envelope for signing.
   * Computes txIDs from inner transactions and encodes with `encodeForSigningBatch`.
   * @private
   */
  private encodeBatchForSigning(batch: Batch): string {
    const txIDs = batch.RawTransactions.map((rawTx) => hashes.hashSignedTx(rawTx.RawTransaction))

    const batchEncodedHex = encodeForSigningBatch({
      flags: batch.Flags,
      txIDs,
    } as unknown as Batch)

    return Buffer.from(batchEncodedHex, "hex").toString("base64")
  }

  /**
   * Generic method to propose an XRPL intent with the common flow.
   * Handles context resolution and intent submission.
   * @private
   */
  private async proposeXrplIntent(
    data: Core_XrplOperation & { Account: string },
    options: XrplIntentOptions,
  ): Promise<Core_IntentResponse> {
    const context = await this.resolveIntentContext(data.Account, {
      domainId: options.domainId,
    })

    // Remove Account from operation data (it's only used to find the sender)
    const { Account, ...operation } = data

    const intent = this.buildTransactionIntent({
      operation,
      context,
      options,
    })

    return this.intentService.proposeIntent(intent)
  }

  /**
   * Proposes a raw sign intent with base64-encoded bytes.
   * Shared by rawSign, rawSignAndWait, and signBytesAndWait.
   * @private
   */
  private async proposeRawSignIntent(
    base64Bytes: string,
    context: IntentContext,
    options: XrplIntentOptions,
  ): Promise<{ intentResponse: Core_IntentResponse; payloadId: string }> {
    const requestId = options.requestId ?? uuidv7()
    const payloadId = options.payloadId ?? uuidv7()

    const intent: Core_ProposeIntentBody = {
      request: {
        author: {
          id: context.userId,
          domainId: context.domainId,
        },
        expiryAt: dayjs()
          .add(options.expiryDays ?? 1, "day")
          .toISOString(),
        targetDomainId: context.domainId,
        id: requestId,
        customProperties: options.requestCustomProperties ?? {},
        payload: {
          id: payloadId,
          accountId: context.accountId,
          ledgerId: context.ledgerId,
          customProperties: options.payloadCustomProperties ?? {},
          content: {
            value: base64Bytes,
            type: "Unsafe",
          },
          type: "v0_SignManifest",
        },
        type: "Propose",
      },
    }

    const intentResponse = await this.intentService.proposeIntent(intent)
    return { intentResponse, payloadId }
  }

  /**
   * Polls the manifest until a signature is available, then returns it as uppercase hex.
   * @private
   */
  private async waitForManifestSignature(
    domainId: string,
    accountId: string,
    manifestId: string,
    options: WaitForSignatureOptions = {},
  ): Promise<string> {
    const {
      maxRetries = 10,
      intervalMs = 3000,
      notFoundRetries = 3,
      notFoundIntervalMs = 1000,
      onAttempt,
    } = options

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      onAttempt?.(attempt)

      const manifest = await this.getManifestWithRetry(
        { domainId, accountId, manifestId },
        notFoundRetries,
        notFoundIntervalMs,
      )

      const { value } = manifest.data
      if (value && value.type === "Unsafe") {
        return Buffer.from(value.signature, "base64").toString("hex").toUpperCase()
      }

      if (attempt < maxRetries) {
        await sleep(intervalMs)
      }
    }

    throw new CustodyError({
      reason: "Manifest signature not available after maximum retries",
    })
  }

  /**
   * Fetches a manifest with retry logic for 404 errors.
   * @private
   */
  private async getManifestWithRetry(
    params: { domainId: string; accountId: string; manifestId: string },
    maxRetries: number,
    intervalMs: number,
  ) {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.accountsService.getManifest(params)
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
   * Builds an XRPL intent body.
   * @private
   */
  private buildTransactionIntent({
    operation,
    context,
    options,
  }: BuildTransactionIntentProps): Core_ProposeIntentBody {
    const feePriority = options.feePriority ?? "Low"
    const expiryDays = options.expiryDays ?? 1
    const requestId = options.requestId ?? uuidv7()
    const payloadId = options.payloadId ?? uuidv7()

    return {
      request: {
        author: {
          domainId: context.domainId,
          id: context.userId,
        },
        customProperties: options.requestCustomProperties ?? {},
        expiryAt: dayjs().add(expiryDays, "day").toISOString(),
        id: requestId,
        payload: {
          accountId: context.accountId,
          customProperties: options.payloadCustomProperties ?? {},
          id: payloadId,
          ledgerId: context.ledgerId,
          parameters: {
            feeStrategy: {
              priority: feePriority,
              type: "Priority",
            },
            memos: [],
            operation,
            type: "XRPL",
          },
          type: "v0_CreateTransactionOrder",
        },
        targetDomainId: context.domainId,
        type: "Propose",
      },
    }
  }
}

/**
 * Compresses a base64-encoded SPKI/DER secp256k1 public key to its compressed hex form.
 * Uses Node.js built-in crypto via JWK export to extract the raw EC point coordinates.
 */
function compressPublicKey(base64PublicKey: string): string {
  const publicKey = createPublicKey({
    key: Buffer.from(base64PublicKey, "base64"),
    format: "der",
    type: "spki",
  })

  const jwk = publicKey.export({ format: "jwk" })
  const x = Buffer.from(jwk.x!, "base64url")
  const y = Buffer.from(jwk.y!, "base64url")
  const lastByte = y[y.length - 1]!
  const prefix = lastByte % 2 === 0 ? "02" : "03"
  return (prefix + x.toString("hex")).toUpperCase()
}
