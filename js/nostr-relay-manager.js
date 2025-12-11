// Uses nostr-tools SimplePool to listen for zap receipts (kind 9735)
class NostrRelayManager {
  constructor(config) {
    this.config = config;
    this.pool = null;
    this.unsubscribe = null;
  }

  async initialize() {
    try {
      if (!window.NostrTools || !NostrTools.SimplePool) {
        console.error("nostr-tools not loaded — NostrTools.SimplePool missing");
        return false;
      }

      const { SimplePool } = NostrTools;
      this.pool = new SimplePool();
      return true;
    } catch (e) {
      console.error("nostr-tools init error", e);
      return false;
    }
  }

  validateZapReceipt(event, expectedAmountSats) {
    try {
      if (event.kind !== 9735) return { valid: false, reason: "not kind 9735" };

      const pTag = (event.tags.find(t => t[0] === "p") || [])[1];
      if (!pTag) return { valid: false, reason: "missing p tag" };

      if (this.config.recipientNostrPubkey &&
          pTag !== this.config.recipientNostrPubkey) {
        return { valid: false, reason: "recipient pubkey mismatch" };
      }

      // default to expected, adjust if we can parse from zap request
      let amountSats = expectedAmountSats;

      const descTag = (event.tags.find(t => t[0] === "description") || [])[1];
      if (descTag) {
        try {
          const zapReq = JSON.parse(descTag);
          const amtTag = (zapReq.tags || []).find(t => t[0] === "amount");
          if (amtTag) {
            const msats = parseInt(amtTag[1], 10);
            if (!Number.isNaN(msats)) {
              amountSats = Math.floor(msats / 1000);
            }
          }
        } catch (e) {
          // ignore JSON parse errors
        }
      }

      if (amountSats < this.config.minPaymentSats) {
        return { valid: false, reason: "amount too low", amountSats };
      }

      return {
        valid: true,
        amountSats,
        senderPubkey: event.pubkey,
        eventId: event.id
      };
    } catch (e) {
      return { valid: false, reason: e.message || "validation error" };
    }
  }

  listenForZapReceipt(expectedAmountSats, onReceived) {
    if (!this.pool) {
      console.warn("listenForZapReceipt called before initialize()");
      return () => {};
    }

    const since = Math.floor(Date.now() / 1000) - 30;

    const filter = {
      kinds: [9735],
      "#p": [this.config.recipientNostrPubkey],
      since
    };

    const sub = this.pool.subscribeMany(
      this.config.relays,
      [filter],
      {
        onevent: (event) => {
          const verdict = this.validateZapReceipt(event, expectedAmountSats);
          if (verdict.valid) {
            onReceived(verdict);
            try { sub.close(); } catch (e) {}
          } else {
            console.log("Ignoring zap:", verdict.reason);
          }
        },
        oneose: () => {
          // do nothing; we'll rely on timeout in game.js
        }
      }
    );

    this.unsubscribe = () => {
      try { sub.close(); } catch (e) {}
    };

    return this.unsubscribe;
  }
}