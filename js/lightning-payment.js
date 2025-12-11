class LightningPaymentManager {
  constructor(config) {
    this.config = config;
    this.currentSession = null;
    this.paymentInProgress = false;
  }

  async fetchLnurlMetadata() {
    try {
      const [username, domain] = this.config.recipientLightningAddress.split('@');
      const url = `https://${domain}/.well-known/lnurlp/${username}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('LNURL lookup failed: ' + res.status);
      const data = await res.json();
      if (data.status === 'ERROR') throw new Error(data.reason||'LNURL error');
      return {...data, domain, username, lnurl: url};
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  generateSessionId() {
    return `sats-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  }

  // create simple zap request object per NIP-57 (unsigned). The wallet or callback may accept this.
  createZapRequest(sessionId, amountSats, recipientPubkey) {
    const now = Math.floor(Date.now()/1000);
    const amountMsats = amountSats * 1000;
    return {
      kind: 9734,
      created_at: now,
      content: `SatSnake demo session ${sessionId}`,
      pubkey: "", // in-browser anonymous
      tags: [
        ["relays", ...this.config.relays],
        ["amount", amountMsats.toString()],
        ["lnurl", this.config.recipientLightningAddress],
        ["p", recipientPubkey || ""]
      ]
    };
  }

  // call LNURL callback to get invoice (pr)
  async getInvoiceFromCallback(callbackUrl, amountMsats, zapRequest, lnurl) {
    const zapJson = encodeURIComponent(JSON.stringify(zapRequest));
    const url = new URL(callbackUrl);
    url.searchParams.set('amount', amountMsats.toString());
    url.searchParams.set('nostr', zapJson);
    if (lnurl) url.searchParams.set('lnurl', lnurl);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('callback error ' + res.status);
    const data = await res.json();
    if (data.status === 'ERROR') throw new Error('callback: ' + (data.reason||'error'));
    if (!data.pr) throw new Error('no invoice returned');
    return data.pr;
  }

  async initiatePayment(amountSats = null) {
    if (this.paymentInProgress) return null;
    const amount = amountSats || this.config.minPaymentSats;
    this.paymentInProgress = true;
    const lnurlMeta = await this.fetchLnurlMetadata();
    if (!lnurlMeta) { this.paymentInProgress = false; throw new Error('LNURL metadata fetch failed'); }

    // if lnurlMeta has nostr pubkey, store it
    if (lnurlMeta.nostrPubkey) this.config.recipientNostrPubkey = lnurlMeta.nostrPubkey;

    const sessionId = this.generateSessionId();
    const zapRequest = this.createZapRequest(sessionId, amount, this.config.recipientNostrPubkey);

    const invoice = await this.getInvoiceFromCallback(lnurlMeta.callback, amount * 1000, zapRequest, lnurlMeta.lnurl);

    this.currentSession = {
      id: sessionId,
      amountSats: amount,
      invoice,
      zapRequest,
      createdAt: Date.now()
    };

    this.paymentInProgress = false;
    return {invoice, amountSats: amount, sessionId};
  }

  displayQrCode(invoice, containerEl) {
    containerEl.innerHTML = '';
    const lightningUri = 'lightning:' + invoice;
    new QRCode(containerEl, { text: lightningUri, width: 200, height: 200 });
  }

  copyInvoiceToClipboard(inv) {
    navigator.clipboard.writeText(inv).catch(()=>{});
  }

  completePayment() {
    const id = this.currentSession?.id;
    this.currentSession = null;
    this.paymentInProgress = false;
    return id;
  }

  reset() {
    this.currentSession = null;
    this.paymentInProgress = false;
  }
}
