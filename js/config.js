// SATSNAKE_CONFIG
const SATSNAKE_CONFIG = {
  // recipient Lightning Address (your requirement)
  recipientLightningAddress: "mustardmoose1@primal.net",

  // If available, the recipient's nostr pubkey. If empty, we'll try to resolve via LUD-16.
  recipientNostrPubkey: "",

  // Required amount to unlock (sats)
  minPaymentSats: 21,

  // Nostr relays to listen on
  relays: [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://nostr-pub.wellorder.net",
    "wss://relay.nostr.band"
  ],

  zapReceiptTimeout: 60_000, // how long to wait for zap receipt (ms)
  relayTimeout: 5000,        // relay connect timeout (ms)

  ui: {
    showQrCode: true
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = SATSNAKE_CONFIG;
