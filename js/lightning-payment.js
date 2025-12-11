async function fetchWithCorsFallback(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (res.ok) return res;
  } catch(e){}
  for (const proxy of SATSNAKE_CONFIG.CORS_PROXIES) {
    const proxyUrl = proxy.endsWith("?")||proxy.endsWith("=") ? proxy+encodeURIComponent(url) : proxy+url;
    try {
      const res = await fetch(proxyUrl, options);
      if (res.ok) return res;
    } catch(e){}
  }
  throw new Error("CORS blocked: "+url);
}

class LightningPaymentManager {
  constructor(config){ this.config=config; this.currentSession=null; this.paymentInProgress=false; }

  async fetchLnurlMetadata(){
    const [user, domain] = this.config.recipientLightningAddress.split("@");
    const url = `https://${domain}/.well-known/lnurlp/${user}`;
    const res = await fetchWithCorsFallback(url);
    const data = await res.json();
    return { ...data, domain, username:user, lnurl:url };
  }

  generateSessionId(){ return "sats-"+Date.now(); }

  createZapRequest(sessionId, sats, pub){
    return {
      kind:9734,
      created_at:Math.floor(Date.now()/1000),
      content:`Session ${sessionId}`,
      pubkey:"",
      tags:[
        ["amount",(sats*1000).toString()],
        ["p",pub||""],
        ["relays", ...this.config.relays]
      ]
    };
  }

  async getInvoiceFromCallback(cb, amtMsat, zap, lnurl){
    const u = new URL(cb);
    u.searchParams.set("amount",amtMsat.toString());
    u.searchParams.set("nostr",JSON.stringify(zap));
    if(lnurl) u.searchParams.set("lnurl",lnurl);
    const res = await fetchWithCorsFallback(u.toString());
    const data = await res.json();
    return data.pr;
  }

  async initiatePayment(sats){
    const meta = await this.fetchLnurlMetadata();
    if(meta.nostrPubkey) this.config.recipientNostrPubkey = meta.nostrPubkey;
    const sid = this.generateSessionId();
    const zap = this.createZapRequest(sid,sats,this.config.recipientNostrPubkey);
    const pr = await this.getInvoiceFromCallback(meta.callback,sats*1000,zap,meta.lnurl);
    this.currentSession={id:sid,amountSats:sats,invoice:pr,zapRequest:zap};
    return {invoice:pr,sessionId:sid,amountSats:sats};
  }

  displayQrCode(inv,el){
    el.innerHTML="";
    new QRCode(el,{text:"lightning:"+inv,width:200,height:200});
  }

  completePayment(){ const id=this.currentSession.id; this.currentSession=null; return id; }
  reset(){ this.currentSession=null; }
}
