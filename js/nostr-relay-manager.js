class NostrRelayManager {
  constructor(config) {
    this.config = config;
    this.ndk = null;
    this.pool = null;
    this.sub = null;
  }

  async initialize() {
    try {
      this.ndk = new NDK({ explicitRelayUrls: this.config.relays });
      await this.ndk.connect(this.config.relayTimeout);
      // attempt to resolve recipient nostr pubkey via LNURL if not present
      if (!this.config.recipientNostrPubkey) {
        // leave to LightningPaymentManager which already resolves; here we accept blank
        console.warn('recipient nostr pubkey not set - will accept receipts by author if available');
      }
      return true;
    } catch (e) {
      console.error('NDK init error', e);
      return false;
    }
  }

  // very small validator: checks kind and required tags
  validateZapReceipt(event, expectedSessionId, expectedAmountSats) {
    try {
      if (event.kind !== 9735) return { valid:false, reason:'not 9735' };
      // required tags: bolt11, description, p (recipient)
      const bolt11 = (event.tags.find(t=>t[0]==='bolt11')||[])[1];
      const description = (event.tags.find(t=>t[0]==='description')||[])[1];
      const p = (event.tags.find(t=>t[0]==='p')||[])[1];
      if (!bolt11 || !description || !p) return {valid:false,reason:'missing tag'};

      // quick check: recipient matches config (if set)
      if (this.config.recipientNostrPubkey && p !== this.config.recipientNostrPubkey) {
        return {valid:false,reason:'recipient mismatch'};
      }

      // parse description (zap request) to check amount and pubkey
      let zapRequest=null;
      try { zapRequest = JSON.parse(description); } catch(e) { zapRequest=null; }
      if (!zapRequest || zapRequest.kind!==9734) {
        // still accept if zapRequest not present — wallets may vary — but prefer valid
        return { valid:true, amountSats: expectedAmountSats, senderPubkey: event.pubkey };
      }
      const amountTag = (zapRequest.tags||[]).find(t=>t[0]==='amount');
      const amountMsats = amountTag ? parseInt(amountTag[1],10) : (expectedAmountSats*1000);
      const amountSats = Math.floor(amountMsats/1000);
      if (amountSats < expectedAmountSats) return {valid:false,reason:'insufficient'};
      return { valid:true, amountSats, senderPubkey: zapRequest.pubkey || event.pubkey };
    } catch (e) {
      return {valid:false,reason:e.message};
    }
  }

  // subscribe for zap receipts since "now"
  listenForZapReceipt(sessionId, expectedAmountSats, onReceived) {
    return new Promise((resolve,reject)=>{
      try {
        const filter = {
          kinds: [9735],
          since: Math.floor(Date.now()/1000) - 30
        };
        this.sub = this.ndk.subscribe(filter, { closeOnEose: false }, (ev) => {
          const v = this.validateZapReceipt(ev, sessionId, expectedAmountSats);
          if (v.valid) {
            onReceived({ valid:true, amountSats:v.amountSats, sender:v.senderPubkey, eventId:ev.id });
            // we can close subscription
            try { this.sub(); } catch(e){}
          } else {
            console.log('zap ignored:', v.reason);
          }
        });
        resolve(()=>{ try{this.sub()}catch(e){} });
      } catch (e) { reject(e); }
    });
  }

  async disconnect() {
    try {
      if (this.ndk) await this.ndk.disconnect();
    } catch(e){}
  }
}
