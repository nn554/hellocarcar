module.exports=function desktopViewport({box,text,lines,rule,icon,btn,brand,image,raw,C,queuePhoto}) {
  const W=1440,H=820;
  function section(y,draw){raw(`<g transform="translate(0 ${y})">`);draw();raw('</g>');}
  box(0,0,W,3720);
  brand(80,24);
  [['Home',480],['Services',552],['Membership',645],['Contact',773]].forEach(([s,x])=>text(x,48,s,14,s==='Home'?C.green:C.muted,s==='Home'?700:400));
  box(480,66,39,2,C.green);icon('Globe',879,31,18);text(906,48,'English',14);icon('ChevronDown',961,34,15,C.muted);text(1010,48,'Workspace',14,C.ink,700);text(1121,48,'Sign in',14,C.ink,700);btn(1205,18,155,'Create account');
  section(80,()=>{
    image(0,0,W,H);raw(`<rect width="1440" height="820" fill="#006233" opacity="0.76"/>`);
    text(80,248,'CROSS-BORDER AUTOMOTIVE TRADE',12,'#D3ECD9',700);text(80,339,'Hellocarcar',64,C.white,700);
    text(80,393,'Support for cross-border automotive trade',26,C.white,600);
    lines(80,448,['Coordinate supplier verification, vehicle and ocean-freight quotations,','policy guidance, procurement, dispute support and reports.'],17,'#EDF6F0',400,27);
    btn(80,532,160,'Explore services','white');btn(256,532,175,'View membership','mint');
  });
  section(900,()=>{
    text(80,240,'Hellocarcar AI',13,C.green,700);text(80,286,'What do you want to check?',32,C.ink,700);text(80,320,'Sign in to use the protected AI workspace.',15,C.muted);
    box(80,357,1280,68,C.white,6,C.line);icon('Sparkles',101,380,22);text(140,399,'Sign in to ask Hellocarcar',16,C.muted);box(1300,369,46,44,C.green,6);icon('ArrowRight',1312,380,22,C.white);
    [['Car',['Vehicle price lookup']],['Ship',['Shipping price lookup']],['Building2',['Chinese automotive','supplier lookup']],['FileText',['Supplier recommendation','report']]].forEach(([ic,ss],i)=>{const x=80+i*328;rule(x,478,296);icon(ic,x,507,22,i===2?C.muted:C.green);lines(x,561,ss,15,i===2?C.muted:C.ink,600,23);if(i===2)text(x,617,'COMING LATER',10,C.amber,700);else icon('ArrowUpRight',x+277,509,18);});
  });
  section(1720,()=>{
    box(0,0,W,H,C.bg);text(80,196,'OUR SERVICES',12,C.green,700);text(80,244,'Support across the trade workflow',32,C.ink,700);text(80,282,'Five service areas, organized around your next decision.',16,C.muted);
    const items=[['ShieldCheck',['Supplier verification'],['Support supplier verification for cross-border','automotive trade.']],['Ship',['Vehicle and ocean-freight','quotation workflows'],['Organize vehicle and ocean-freight','quotation workflows.']],['BookOpen',['Policy and process guidance'],['Provide policy and process guidance','for supported workflows.']],['Handshake',['Procurement and dispute support'],['Support procurement and','dispute-related work.']],['FileText',['Reports'],['Provide reports for the supported','service scope.']]];
    items.forEach(([ic,title,desc],i)=>{const x=80+(i%3)*440,y=344+Math.floor(i/3)*185;rule(x,y,400);icon(ic,x,y+27,22);lines(x+36,y+44,title,17,C.ink,700,24);lines(x+36,y+104,desc,13,C.muted,400,22);});
  });
  section(2540,()=>{
    // Original purchase-step composition; only the blue accent palette changes.
    const ink='#0D1D2E',muted='#4A5A6B',pale='#F2F6FA',border='#CEDBE4';
    const center=(cx,y,s,size=14,color=ink,weight=400)=>raw(`<text x="${cx}" y="${y}" text-anchor="middle" font-family="Arial, Microsoft YaHei, sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}">${s.replaceAll('&','&amp;')}</text>`);
    box(0,0,W,H,'#FBFDFE');
    center(720,44,'From requirements to destination handoff',30,ink,700);
    center(720,79,'Five clear stages help you prepare information, coordinate with responsible',14,muted);
    center(720,101,'parties and understand what comes next.',14,muted);
    box(306,172,824,1,border);
    const titles=[['Define your requirements'],['Confirm the commercial plan'],['Coordinate documents and','preparation'],['Follow international','transport'],['Prepare the destination','handoff']];
    const descriptions=[['Vehicle, destination and quantity'],['Counterparty, terms and records'],['Documents and readiness'],['Booking and shipment updates'],['Clearance and collection','coordination']];
    for(let i=0;i<5;i++){const x=302+i*209;box(x-20,152,40,40,i?'#FBFDFE':C.green,20,i?border:'none');center(x,179,String(i+1),13,i?muted:C.white,700);titles[i].forEach((s,j)=>center(x,224+j*17,s,12.5,ink,700));descriptions[i].forEach((s,j)=>center(x,269+j*16,s,11,muted));}
    // Keep the original two-column card, information list, notice and bottom pager.
    raw('<defs><clipPath id="purchase-card"><rect x="200" y="310" width="1040" height="497" rx="11"/></clipPath></defs><g clip-path="url(#purchase-card)">');
    box(200,310,1040,497,pale);box(200,310,3,497,C.green);
    raw(`<image x="799" y="310" width="441" height="432" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/png;base64,${queuePhoto}"/>`);
    text(237,357,'Vehicle, destination and quantity',12.5,C.green,700);text(237,395,'Define your requirements',26,ink,700);
    lines(237,431,['Share the vehicle brand, model, configuration, destination and delivery target.','Quantity is recorded for human consultation and order coordination only.'],14,muted,400,23);
    box(237,487,528,1,border);text(237,523,'Information to prepare',12.5,ink,700);
    text(254,557,'Vehicle brand and model',14,ink);text(523,557,'Required configuration',14,ink);
    text(254,588,'Destination country or port',14,ink);text(523,588,'Quantity, budget and delivery target',13,ink);
    box(237,622,528,82,'#E3F1E8');box(237,622,1.5,82,C.green);
    lines(252,647,['Hellocarcar provides information and coordination support. Vehicle contracts,','payments and fulfillment are completed directly with the responsible suppliers and','service providers.'],11.5,muted,400,21);
    box(200,742,1040,65,'#FBFDFE');box(200,742,1040,1,border);box(224,755,137,38,'#FBFDFE',7,'#E3E9EE');icon('ArrowLeft',237,767,15,'#8A96A0');text(260,779,'Previous stage',12,'#8A96A0',600);center(736,779,'1 / 5',12.5,muted,600);box(1103,755,120,38,'#FBFDFE',7,border);text(1117,779,'Next stage',12,ink,700);icon('ArrowRight',1194,767,15,ink);
    raw('</g>');box(200,310,1040,497,'none',11,border);
  });
  section(3360,()=>{
    require('./homepage-footer.cjs')({box,brand,text,C});
  });
};

