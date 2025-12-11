const SATSNAKE_CONFIG = {
  // Bech32 LNURL-pay with fixed amount=21 sats for mustardmoose1@primal.net
  lnurlBech32: "lnurl1dp68gurn8ghj7urjd9kkzmpwdejhgtewwajkcmpdddhx7amw9akxuatjd3cz7mt4wd6xzunyd4hk7um9xylkzmt0w4h8g0fjxycrqvqcdl80u",

  // URI used for QR + copy-to-clipboard
  lnurlUri: "lightning:lnurl1dp68gurn8ghj7urjd9kkzmpwdejhgtewwajkcmpdddhx7amw9akxuatjd3cz7mt4wd6xzunyd4hk7um9xylkzmt0w4h8g0fjxycrqvqcdl80u",

  // Primal nostr pubkey for mustardmoose1 (seen in zap p-tag)
  recipientNostrPubkey: "f81611363554b64306467234d7396ec88455707633f54738f6c4683535098cd3",

  minPaymentSats: 21,

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