class LightningPaymentManager {
  constructor(config){
    this.config = config;
  }

  getPaymentUri(){
    if (this.config.lnurlUri) return this.config.lnurlUri;
    return "lightning:" + this.config.lnurlBech32;
  }

  displayQrCode(containerEl){
    containerEl.innerHTML = "";
    const uri = this.getPaymentUri();
    new QRCode(containerEl, {
      text: uri,
      width: 200,
      height: 200
    });
  }

  async copyPaymentUriToClipboard(){
    try {
      await navigator.clipboard.writeText(this.getPaymentUri());
      return true;
    } catch (e) {
      console.warn("Clipboard write failed", e);
      return false;
    }
  }
}