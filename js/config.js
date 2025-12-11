// Global config for SatSnake paywall
const SATSNAKE_CONFIG = {
  // What goes inside the QR and clipboard
  // Most wallets accept this and resolve the LNURL for the address.
  paymentUri: "lightning:mustardmoose1@primal.net",

  // Optional LNURL data (not strictly needed for this demo)
  lnurlBech32: "lnurl1dp68gurn8ghj7urjd9kkzmpwdejhgtewwajkcmpdddhx7amw9akxuatjd3cz7mt4wd6xzunyd4hk7um9xyvycugw",
  lnurlUri: "lightning:lnurl1dp68gurn8ghj7urjd9kkzmpwdejhgtewwajkcmpdddhx7amw9akxuatjd3cz7mt4wd6xzunyd4hk7um9xyvycugw",

  // Nostr pubkey of recipient (from your zap events)
  recipientNostrPubkey: "f81611363554b64306467234d7396ec88455707633f54738f6c4683535098cd3",

  // Minimum sats required to consider it "paid"
  minPaymentSats: 21,

  // Relays to listen on for zap receipts
  relays: [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://nostr-pub.wellorder.net",
    "wss://relay.nostr.band"
  ],

  zapReceiptTimeout: 60000,
  relayTimeout: 5000,

  ui: { showQrCode: true }
};