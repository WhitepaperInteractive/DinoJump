document.addEventListener("DOMContentLoaded", async () => {
  const cfg = SATSNAKE_CONFIG;
  const lm = new LightningPaymentManager(cfg);
  const nm = new NostrRelayManager(cfg);

  const generateBtn = document.getElementById("generate");
  const qrContainer = document.getElementById("qr");
  const amountEl = document.getElementById("amount");
  const copyBtn = document.getElementById("copy");
  const statusEl = document.getElementById("status");

  let unsubscribe = null;

  const nostrReady = await nm.initialize();
  statusEl.textContent = nostrReady
    ? "Ready. Click the button, scan & pay 21 sats."
    : "Relay connect issue. You can still try paying; zap detection may be flaky.";

  generateBtn.addEventListener("click", () => {
    lm.displayQrCode(qrContainer);

    amountEl.innerHTML = `
      Pay exactly <strong>${cfg.minPaymentSats} sats</strong> in your wallet<br/>
      Target: <code>${cfg.paymentUri}</code>
    `;

    copyBtn.style.display = "inline-block";
    copyBtn.textContent = "Copy payment link";
    copyBtn.onclick = async () => {
      const ok = await lm.copyPaymentUriToClipboard();
      copyBtn.textContent = ok ? "Copied!" : "Copy failed";
      setTimeout(() => (copyBtn.textContent = "Copy payment link"), 1500);
    };

    statusEl.textContent = "Scan in your wallet & pay 21 sats… Listening for zap receipt…";

    if (unsubscribe) unsubscribe();
    unsubscribe = nm.listenForZapReceipt(cfg.minPaymentSats, (zap) => {
      statusEl.textContent = `✓ Payment received: ${zap.amountSats} sats — unlocked!`;

      const canvas = document.getElementById("gameCanvas");
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.font = "20px monospace";
      ctx.fillText("UNLOCKED — enjoy!", 40, canvas.height / 2);

      qrContainer.innerHTML = "";
      copyBtn.style.display = "none";
    });

    setTimeout(() => {
      if (statusEl.textContent.includes("Listening for zap")) {
        statusEl.textContent = "Timed out waiting for zap receipt. You can still refresh & try again.";
      }
    }, cfg.zapReceiptTimeout + 2000);
  });

  window.addEventListener("beforeunload", () => {
    if (unsubscribe) unsubscribe();
  });
});