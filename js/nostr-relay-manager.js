class NostrRelayManager {
  constructor(config){
    this.config = config;
    this.ndk = null;
    this.sub = null;
  }

  async initialize(){
    try {
      // NDK is provided globally by the UMD bundle
      this.ndk = new NDK({
        explicitRelayUrls: this.config.relays
      });
      await this.ndk.connect(this.config.relayTimeout);
      return true;
    } catch (e) {
      console.error("NDK init error", e);
      return false;
    }
  }

  validateZapReceipt(event, expectedAmountSats){
    try {
      if (event.kind !== 9735) return { valid:false, reason:"not kind 9735" };

      const pTag = (event.tags.find(t => t[0] === "p") || [])[1];
      if (!pTag) return { valid:false, reason:"missing p tag" };

      if (this.config.recipientNostrPubkey &&
          pTag !== this.config.recipientNostrPubkey) {
        return { valid:false, reason:"recipient pubkey mismatch" };
      }

      const descriptionTag = (event.tags.find(t => t[0] === "description") || [])[1];
      let amountSats = expectedAmountSats;

      if (descriptionTag) {
        try {
          const zapReq = JSON.parse(descriptionTag);
          const amountTag = (zapReq.tags || []).find(t => t[0] === "amount");
          if (amountTag) {
            const msats = parseInt(amountTag[1], 10);
            if (!Number.isNaN(msats)) {
              amountSats = Math.floor(msats / 1000);
            }
          }
        } catch (e) {
          // ignore parse errors, fall back to expectedAmountSats
        }
      }

      if (amountSats < this.config.minPaymentSats) {
        return { valid:false, reason:"amount too low", amountSats };
      }

      return {
        valid: true,
        amountSats,
        senderPubkey: event.pubkey,
        eventId: event.id
      };
    } catch (e) {
      return { valid:false, reason:e.message || "validation error" };
    }
  }

  listenForZapReceipt(expectedAmountSats, onReceived){
    const since = Math.floor(Date.now() / 1000) - 30;

    const filter = {
      kinds: [9735],
      "#p": [this.config.recipientNostrPubkey],
      since
    };

    const sub = this.ndk.subscribe(filter, { closeOnEose: false }, (ev) => {
      const verdict = this.validateZapReceipt(ev, expectedAmountSats);
      if (verdict.valid) {
        onReceived(verdict);
        try { sub(); } catch (e) {}
      } else {
        console.log("ignoring zap", verdict.reason);
      }
    });

    this.sub = sub;
    return () => {
      try { sub(); } catch (e) {}
    };
  }
}