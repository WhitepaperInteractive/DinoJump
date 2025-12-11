class NostrRelayManager {
  constructor(cfg){ this.cfg=cfg; this.ndk=null; this.sub=null; }
  async initialize(){
    this.ndk = new NDK({explicitRelayUrls:this.cfg.relays});
    try { await this.ndk.connect(this.cfg.relayTimeout); } catch(e){}
  }
  validateZapReceipt(ev, amt){ return ev.kind===9735 ? {valid:true,amountSats:amt} : {valid:false}; }

  listenForZapReceipt(sid,amt,cb){
    const filter={kinds:[9735],since:Math.floor(Date.now()/1000)-20};
    this.sub=this.ndk.subscribe(filter,{closeOnEose:false},(ev)=>{
      const v=this.validateZapReceipt(ev,amt);
      if(v.valid){ cb(v); this.sub(); }
    });
  }
}
