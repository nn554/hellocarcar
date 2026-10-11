module.exports=({box,brand,text,C})=>{
  box(0,0,1440,360,C.green);brand(80,50,true);text(80,114,'Cross-border automotive trade support',14,'#E3F1E8');
  [['Home',720,65],['Services',1045,65],['Membership',720,107],['Contact',1045,107],['Payment policy',720,165],['Refund policy',1045,165],['Privacy policy',720,200],['Terms of service',1045,200],['Disclaimer',720,235]].forEach(([s,x,y])=>text(x,y,s,14,'#E3F1E8'));
  box(720,140,560,1,'#408961');box(80,274,1280,1,'#408961');text(80,315,'Online payment and messaging-channel delivery are not available on this public site.',13,'#E3F1E8');
};
