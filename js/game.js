document.addEventListener('DOMContentLoaded', async () => {
  const cfg = SATSNAKE_CONFIG;
  const lm = new LightningPaymentManager(cfg);
  const nm = new NostrRelayManager(cfg);

  // init relays (non-blocking)
  const ok = await nm.initialize();
  document.getElementById('status').textContent = ok ? 'Connected to relays (or attempting)' : 'Relay init failed - will still try';

  const generateBtn = document.getElementById('generate');
  const qrContainer = document.getElementById('qr');
  const amountEl = document.getElementById('amount');
  const copyBtn = document.getElementById('copy');
  const statusEl = document.getElementById('status');

  let unsubscribe = null;

  generateBtn.addEventListener('click', async () => {
    try {
      statusEl.textContent = 'Creating invoice…';
      const res = await lm.initiatePayment(cfg.minPaymentSats);
      if (!res) throw new Error('no invoice');

      // Show invoice QR
      if (cfg.ui.showQrCode) lm.displayQrCode(res.invoice, qrContainer);
      amountEl.textContent = `Amount: ${res.amountSats} sats`;
      copyBtn.style.display = 'inline-block';
      copyBtn.onclick = ()=>{ lm.copyInvoiceToClipboard(res.invoice); copyBtn.textContent='Copied'; setTimeout(()=>copyBtn.textContent='Copy invoice',1500); };

      statusEl.textContent = 'Waiting for payment…';

      // listen for zap receipt
      unsubscribe = await nm.listenForZapReceipt(res.sessionId, res.amountSats, (zap) => {
        if (zap.valid) {
          statusEl.textContent = `✓ Payment received: ${zap.amountSats} sats — unlocked!`;
          lm.completePayment();
          // unlock the game canvas (simple visual)
          const canvas = document.getElementById('gameCanvas');
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#0f0'; ctx.fillRect(10,10,300,220);
          ctx.fillStyle = '#000'; ctx.font='20px monospace'; ctx.fillText('UNLOCKED — enjoy!',30,120);
          // cleanup UI
          qrContainer.innerHTML = '';
          copyBtn.style.display = 'none';
        } else {
          statusEl.textContent = 'Invalid zap received';
        }
      });

      // fallback timeout
      setTimeout(()=>{ if (statusEl.textContent.startsWith('Waiting')) { statusEl.textContent='Timeout waiting for zap receipt'; } }, cfg.zapReceiptTimeout + 2000);

    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Error: ' + (err.message||err);
      lm.reset();
    }
  });

  // optional cleanup when leaving
  window.addEventListener('beforeunload', async ()=>{ if (unsubscribe) unsubscribe(); await nm.disconnect(); });
});
