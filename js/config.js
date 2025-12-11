// js/config.js
const SATSNAKE_CONFIG = {
  lnurlBech32: "lnurl1dp68gurn8ghj7urjd9kkzmpwdejhgtewwajkcmpdddhx7amw9akxuatjd3cz7mt4wd6xzunyd4hk7um9xyvycugw",

  // QR + copy-paste string (Format A)
  lnurlUri: "lightning:lnurl1dp68gurn8ghj7urjd9kkzmpwdejhgtewwajkcmpdddhx7amw9akxuatjd3cz7mt4wd6xzunyd4hk7um9xyvycugw",

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
