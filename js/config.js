const SATSNAKE_CONFIG = {
  recipientLightningAddress: "mustardmoose1@primal.net",
  recipientNostrPubkey: "",
  minPaymentSats: 21,
  relays: [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://nostr-pub.wellorder.net",
    "wss://relay.nostr.band"
  ],
  zapReceiptTimeout: 60000,
  relayTimeout: 5000,
  CORS_PROXIES: [
    "https://cors.isomorphic-git.org/",
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?"
  ],
  ui: { showQrCode: true }
};
