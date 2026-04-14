import { encodeMPTokenMetadata } from "xrpl"
import { RippleCustody } from "../../../../src"

const createMpt = async () => {
  try {
    // Initialize the Ripple Custody client with API endpoints and authentication keys
    // The private and public keys should be securely stored in environment variables
    const custody = new RippleCustody({
      apiUrl: "https://custody-api-url",
      authUrl: "https://custody-auth-url/token",
      privateKey: process.env.PRIVATE_KEY ?? "",
      publicKey: process.env.PUBLIC_KEY ?? "",
    })

    // Retrieve the domain ID associated with your user
    const me = await custody.users.me()
    const domainId = me.domains[0].id

    // Generate or use a unique identifier to track this specific payment intent
    // This allows you to retrieve the transaction status later
    const intentId = crypto.randomUUID()

    // Can be used to filter the transactions
    const orderReferenceId = crypto.randomUUID()

    // Submit the MPTokenIssuanceCreate transaction to Ripple Custody
    // The transaction will be queued as an "intent" and processed asynchronously
    await custody.xrpl.proposeIntent(
      {
        Account: "r...", // Your Ripple Custody account address (the sender)
        operation: {
          type: "MPTokenIssuanceCreate",
          metadata: {
            value: encodeMPTokenMetadata({
              ticker: "ABC",
              name: "Token ABC",
              desc: "This is a token ABC",
              icon: "https://link.com",
              asset_class: "rwa",
              issuer_name: "your name",
            }),
            type: "HexEncodedMetadata",
          },
          flags: ["tfMPTCanTransfer", "tfMPTCanLock"],
          assetScale: 2,
          transferFee: 5000,
        },
      },
      {
        // Optional: Provide a payloadId to track this transaction
        // If not provided, one will be generated automatically
        requestId: intentId,
        payloadId: orderReferenceId,
      },
    )

    // Wait for the intent to be processed and retrieve the final result
    // This will poll the API until the transaction is confirmed or fails
    const intent = await custody.intents.getAndWait({ domainId, intentId: intentId })

    // Display the complete intent object including transaction status and details
    console.dir(intent, { depth: null })
  } catch (error) {
    console.log(error)
  }
}
