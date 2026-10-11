const fs = require('node:fs');
const path = require('node:path');
const runtime = 'C:/Users/34334/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { icons } = require(path.join(runtime, 'lucide'));
const out = __dirname;
const C = { ink:'#182924', secondary:'#60716A', muted:'#87958F', green:'#147D5E', mint:'#EAF5EF', line:'#E7ECE9', bg:'#F8FAF9', white:'#FFFFFF', blue:'#4279A8', amber:'#AA7831' };
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const box = (x,y,w,h,fill,r=0,stroke='none',extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
const text = (x,y,s,size=14,color=C.ink,weight=400,extra='') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" ${extra}>${esc(s)}</text>`;
const line = (x,y,w,color=C.line) => `<path d="M${x} ${y}h${w}" stroke="${color}"/>`;
const icon = (name,x,y,size=22,color=C.ink) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name].map(([tag,attrs])=>`<${tag} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}/>`).join('')}</svg>`;
const group = (name,contents) => `<g id="${name}">${contents}</g>`;
const svg = contents => `<svg xmlns="http://www.w3.org/2000/svg" width="393" height="852" viewBox="0 0 393 852" font-family="Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif" letter-spacing="0">${contents}</svg>`;
const status = () => group('Status-bar',box(0,0,393,44,C.white)+text(24,29,'9:41',14,C.ink,600)+icon('Signal',302,16,16)+icon('Wifi',323,16,16)+icon('BatteryFull',346,13,24));
const capsule = () => box(292,53,85,30,C.white,15,C.line)+icon('Ellipsis',301,56,25)+line(334,60,0)+`<path d="M334 60v16" stroke="${C.line}"/><circle cx="355" cy="68" r="8" fill="none" stroke="${C.ink}" stroke-width="2"/><circle cx="355" cy="68" r="3.5" fill="${C.ink}"/>`;
const header = () => group('Navigation',box(0,44,393,60,C.white)+icon('Menu',20,57,24)+text(61,66,'汽车出口价',17,C.ink,600)+text(61,85,'AI 助手',10,C.secondary)+icon('SquarePen',253,58,21)+capsule()+line(0,103.5,393));
function bottom(active='首页') {
  return group('Bottom-navigation',box(0,778,393,74,C.white)+line(0,778,393)+[
    ['MessageSquare','首页',65],['Calculator','车价计算器',196],['UserRound','我的',328]
  ].map(([i,s,x])=>icon(i,x-10,789,21,s===active?C.green:C.muted)+text(x,825,s,10,s===active?C.green:C.muted,s===active?600:400,'text-anchor="middle"')).join('')+box(134,841,125,4,C.ink,2));
}
const composer = () => group('Composer',box(0,690,393,88,C.white)+box(20,701,353,48,C.bg,8,C.line)+text(35,730,'询问车型、报价或出口问题…',13,C.muted)+box(332,709,32,32,C.green,6)+icon('ArrowUp',338,715,20,C.white)+text(196.5,768,'内容由 AI 生成，报价以最新确认为准',10,C.muted,400,'text-anchor="middle"'));
const shell = () => box(0,0,393,852,C.white)+status()+header()+bottom();
const entry = (x,y,name,label,sub,color,tint) => group(`Entry-${name}`,box(x,y,170,88,C.white,8,C.line)+icon(name,x+14,y+14,22,color)+text(x+14,y+54,label,15,C.ink,600)+text(x+14,y+73,sub,10,C.secondary)+icon('ArrowUpRight',x+137,y+17,16,C.muted));
function home() {
  return shell()+group('Welcome',box(20,136,42,42,C.mint,8)+icon('CarFront',29,145,24,C.green)+text(20,218,'今天，想了解哪款车？',24,C.ink,600)+text(20,246,'车型报价 · 出口政策 · 海运费用',13,C.secondary))+
    group('Quick-entries',entry(20,279,'CarFront','查询车型报价','FOB / CIF · 多配置对比',C.green)+entry(203,279,'Globe2','查询出口政策','目的国准入与税费',C.blue)+entry(20,379,'Ship','查询海运费用','航线、港口与运输成本','#3C8A91')+entry(203,379,'Scale','咨询采购纠纷','交易与履约问题',C.amber))+
    group('Suggested-questions',text(20,514,'你可以这样问',12,C.secondary)+text(20,551,'吉利缤越现在的 FOB 报价是多少？',13)+icon('ArrowUpRight',350,536,18,C.muted)+line(20,568,353)+text(20,596,'出口阿尔及利亚需要哪些资料？',13)+icon('ArrowUpRight',350,581,18,C.muted)+line(20,613,353)+icon('LibraryBig',20,638,18,C.green)+text(47,653,'浏览车型报价库',12,C.green,500)+icon('ChevronRight',354,638,17,C.green))+composer();
}
const prices = [
  {name:'缤越 · 手动',color:'灰',guide:'66,800',usd:'7,800'},
  {name:'缤越 · 手动',color:'白',guide:'66,800',usd:'8,100'},
  {name:'缤越 · 自动超能',color:'灰',guide:'73,800',usd:'8,736'},
  {name:'缤越 · 自动超能',color:'白',guide:'73,800',usd:'8,632'},
  {name:'缤越 · 自动超能 MAX',color:'灰',guide:'78,800',usd:'9,400'},
  {name:'缤越 L · Battle 含电尾',color:'灰',guide:'97,800',usd:'10,800'},
  {name:'缤越 L · Battle 含电尾',color:'白',guide:'97,800',usd:'11,100'},
  {name:'缤越 L · 968+包',color:'灰',guide:'101,800',usd:'11,000'}
];
const priceRow=(p,index,y)=>group(`Quote-row-${index+1}`,text(20,y+20,p.name,13,C.ink,500)+`<circle cx="26" cy="${y+38}" r="4" fill="${p.color==='灰'?'#919894':C.white}" stroke="#ADB7B1"/>`+text(38,y+42,p.color,10,C.secondary)+text(64,y+42,`指导价 ¥${p.guide}`,10,C.muted)+text(373,y+24,`$${p.usd}`,19,C.green,600,'text-anchor="end"')+text(373,y+43,'USD / 台',9,C.muted,400,'text-anchor="end"')+line(20,y+55,353));
function quote(filter='全部') {
  const rows=prices.filter(p=>filter==='全部'||p.color===filter).slice(0,4);
  return shell()+group('User-question',box(91,124,282,43,C.mint,8)+text(106,151,'帮我查询吉利缤越的 FOB 价格',14))+
    group('Assistant-heading',box(20,189,25,25,C.green,6)+icon('Sparkles',25,194,15,C.white)+text(55,207,'汽车出口价',12,C.ink,600)+text(373,207,'报价结果',10,C.muted,400,'text-anchor="end"')+text(20,246,'吉利缤越 · FOB 报价',21,C.ink,600)+icon('MapPin',20,261,14,C.secondary)+text(40,273,'交付地：南沙',11,C.secondary)+text(144,273,'美元计价 / 台',11,C.secondary))+
    group('Quote-filters',box(20,292,167,32,C.bg,6)+['全部','灰','白'].map((s,i)=>{const x=23+i*54;return (filter===s?box(x,295,52,26,C.white,4,C.line):'')+text(x+26,313,s==='全部'?s:`${s}色`,11,filter===s?C.green:C.secondary,filter===s?600:400,'text-anchor="middle"');}).join('')+text(373,313,`${prices.filter(p=>filter==='全部'||p.color===filter).length} 个配置`,10,C.muted,400,'text-anchor="end"'))+
    group('Quote-table',rows.map((p,i)=>priceRow(p,i,337+i*56)).join(''))+
    group('Quote-actions',text(196.5,587,'查看全部配置',12,C.green,500,'text-anchor="middle"')+icon('ChevronDown',243,575,15,C.green)+icon('FileSpreadsheet',20,607,14,C.secondary)+text(41,619,'报价单 · 南沙 FOB',10,C.secondary)+icon('Copy',296,605,18,C.secondary)+icon('ThumbsUp',327,605,18,C.secondary)+icon('ThumbsDown',358,605,18,C.secondary)+box(20,648,162,30,C.white,6,C.line)+text(101,668,'这款车出口需要什么资料？',10,C.secondary,400,'text-anchor="middle"')+box(190,648,138,30,C.white,6,C.line)+text(259,668,'查询海运费用',11,C.secondary,400,'text-anchor="middle"'))+composer();
}
const historyItems=[
  {group:'置顶',title:'吉利缤越 FOB 报价',sub:'南沙 · 8 个配置',time:'15:41',active:true,pinned:true},
  {group:'今天',title:'阿尔及利亚进口政策',sub:'车辆准入与所需资料',time:'14:20'},
  {group:'今天',title:'南沙到杰贝阿里海运费',sub:'运输方式与费用',time:'10:08'},
  {group:'昨天',title:'坦克 300 配置与报价',sub:'车型价格对比',time:'昨天'},
  {group:'昨天',title:'比亚迪宋 PLUS 出口报价',sub:'配置与交付地点',time:'昨天'},
  {group:'近 7 天',title:'采购定金与交期问题',sub:'合同与履约',time:'09/08'}
];
function drawer() {
  let content=quote()+group('Backdrop',box(0,104,393,730,'#152B22',0,'none','opacity="0.35"'));
  let rows='', y=299, last='';
  historyItems.forEach((p,i)=>{
    if(p.group!==last) { if(last)y+=12; rows+=text(20,y,p.group,10,C.muted,500); y+=14; last=p.group; }
    rows+=group(`History-row-${i+1}`,(p.active?box(12,y,288,50,C.mint,6):'')+icon(p.pinned?'Pin':'MessageSquare',22,y+11,16,p.active?C.green:C.secondary)+text(49,y+23,p.title,13,p.active?C.green:C.ink,p.active?600:400)+text(49,y+42,p.sub,10,C.muted)+text(287,y+42,p.time,9,C.muted,400,'text-anchor="end"')+(p.active?icon('Ellipsis',271,y+10,17,C.green):''));
    y+=54;
  });
  content+=group('History-drawer',box(0,104,312,730,C.white)+text(20,139,'历史对话',20,C.ink,600)+text(20,160,'6 段对话',10,C.muted)+icon('PanelLeftClose',270,124,22,C.secondary)+box(20,177,272,44,C.green,6)+icon('Plus',94,189,20,C.white)+text(124,205,'新建对话',14,C.white,500)+box(20,237,272,39,C.bg,6,C.line)+icon('Search',33,249,16,C.muted)+text(59,262,'搜索历史对话',12,C.muted)+rows+line(20,746,272)+box(20,764,33,33,C.mint,7)+icon('UserRound',28,772,17,C.green)+text(64,781,'我的账户',12,C.ink,500)+text(64,798,'对话记录已保存',10,C.muted)+icon('Settings2',269,771,20,C.secondary));
  return content;
}
const views = {'01-new-chat':home(),'02-quote-chat':quote(),'03-history-drawer':drawer()};
for(const [name,contents] of Object.entries(views)) fs.writeFileSync(path.join(out,name+'.svg'),svg(contents));
const overview=`<svg xmlns="http://www.w3.org/2000/svg" width="1371" height="1020" viewBox="0 0 1371 1020" font-family="Microsoft YaHei, sans-serif" letter-spacing="0">${box(0,0,1371,1020,'#EFF3F1')}${text(48,48,'汽车出口价',24,C.ink,600)}${text(232,48,'小程序 UI / 设计提案',13,C.secondary)}${text(1323,48,'393 × 852',12,C.muted,400,'text-anchor="end"')}${Object.entries(views).map(([name,contents],i)=>`<g transform="translate(${48+i*441},110)">${box(-1,-1,395,854,C.white,0,'#D9E2DC')}${contents}</g>${text(48+i*441,93,['01  新对话','02  车型报价','03  历史对话'][i],12,C.secondary,500)}`).join('')}${text(48,997,'报价示例沿用提供的截图；历史对话为界面示例。',11,C.muted)}</svg>`;
fs.writeFileSync(path.join(out,'design-overview.svg'),overview);
fs.writeFileSync(path.join(out,'preview-data.js'),`window.DESIGN=${JSON.stringify({views:Object.fromEntries(Object.entries(views).map(([k,v])=>[k,svg(v)])),prices,historyItems,filtered:{'灰':svg(quote('灰')),'白':svg(quote('白'))}})};`);
console.log('Created 3 editable SVG screens, overview, and preview data.');
