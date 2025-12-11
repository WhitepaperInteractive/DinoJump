document.addEventListener("DOMContentLoaded", async ()=>{
  const cfg=SATSNAKE_CONFIG;
  const lm=new LightningPaymentManager(cfg);
  const nm=new NostrRelayManager(cfg);
  nm.initialize();

  const g=document.getElementById("generate");
  const qr=document.getElementById("qr");
  const amount=document.getElementById("amount");
  const copy=document.getElementById("copy");
  const status=document.getElementById("status");

  g.onclick=async ()=>{
    status.textContent="Generating invoice…";
    try{
      const r=await lm.initiatePayment(cfg.minPaymentSats);
      lm.displayQrCode(r.invoice,qr);
      amount.textContent=`Amount: ${r.amountSats} sats`;
      copy.style.display="inline-block";
      copy.onclick=()=>navigator.clipboard.writeText(r.invoice);

      status.textContent="Waiting for zap…";

      nm.listenForZapReceipt(r.sessionId,r.amountSats,(zap)=>{
        status.textContent="✓ Payment received — unlocked!";
        const c=document.getElementById("gameCanvas");
        const ctx=c.getContext("2d");
        ctx.fillStyle="#0f0"; ctx.fillRect(0,0,320,240);
        ctx.fillStyle="#000"; ctx.font="20px monospace";
        ctx.fillText("UNLOCKED!",80,120);
      });
    }catch(e){ status.textContent="Error: "+e.message; }
  };
});
