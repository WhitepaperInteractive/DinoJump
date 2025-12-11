// Handles generating and copying the payment URI / QR
class LightningPaymentManager {
  constructor(config) {
    this.config = config;
  }

  getPaymentUri() {
    if (this.config.paymentUri) return this.config.paymentUri;
    if (this.config.lnurlUri) return this.config.lnurlUri;
    if (this.config.lnurlBech32) return "lightning:" + this.config.lnurlBech32;
    // ultimate fallback
    return "lightning:mustardmoose1@primal.net";
  }

  displayQrCode(containerEl) {
    containerEl.innerHTML = "";
    const uri = this.getPaymentUri();
    new QRCode(containerEl, {
      text: uri,
      width: 240,
      height: 240
    });
  }

  async copyPaymentUriToClipboard() {
    try {
      await navigator.clipboard.writeText(this.getPaymentUri());
      return true;
    } catch (e) {
      console.warn("Clipboard write failed", e);
      return false;
    }
  }
}