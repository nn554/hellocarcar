import fs from "node:fs";
import path from "node:path";

const root = path.resolve("outputs/vehicle-quote-redesign");
const assetDir = path.join(root, "assets");

const esc = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const img = (name) => {
  const file = path.join(assetDir, name);
  return fs.existsSync(file) ? `data:image/png;base64,${fs.readFileSync(file).toString("base64")}` : "";
};

const logos = {
  "吉利": "geely.png", "睿蓝": "livan.png", "捷途": "jetour.png", "奇瑞": "chery.png",
  "大众": "volkswagen.png", "奥迪": "audi.png", "捷达": "jetta.png", "长安": "changan.png",
  "启源": "qiyuan.png", "深蓝": "deepal.png", "方程豹": "fangchengbao.png", "上汽": "saic.png",
  "五菱": "wuling.png", "长城": "gwm.png", "现代": "hyundai.png", "起亚": "kia.png",
  "零跑": "leapmotor.png", "比亚迪": "byd.png", "广汽": "gac.png", "埃安": "aion.png",
  "丰田": "toyota.png", "银河": "galaxy.png", "日产": "nissan.png", "马自达": "mazda.png",
  "纳米": "dongfeng.png", "宝马": "bmw.png", "极氪": "zeekr.png", "领克": "lynkco.png",
  "极石": "rox.png", "小鹏": "xpeng.png",
};

const brands = [
  "吉利", "睿蓝", "捷途", "奇瑞", "雪铁龙", "大众", "奥迪", "捷达", "长安", "启源", "深蓝",
  "方程豹", "上汽", "五菱", "长城", "现代", "起亚", "零跑", "比亚迪", "广汽", "埃安", "丰田",
  "银河", "日产", "马自达", "纳米", "宝马", "极氪", "领克", "星途", "极石", "腾势", "小鹏",
];

const quotes = [
  { image: "sealion06.png", title: "海狮06DM-i", spec: "121KM领航版", price: "$19,084", port: "南沙", date: "8 Oct 2026" },
  { image: "seal06.png", title: "海豹06DM-i", spec: "80KM尊贵型", price: "$12,309", port: "南沙", date: "8 Oct 2026" },
  { image: "qinl.png", title: "秦L DM-i", spec: "120KM旗舰型", price: "$17,459", port: "南沙", date: "8 Oct 2026" },
  { image: "tang.png", title: "唐DM-i智驾版", spec: "115KM尊贵型（7座）", price: "$20,909", port: "南沙", date: "8 Oct 2026" },
];

const icon = (name, x, y, size = 20, color = "currentColor") => {
  const paths = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chat: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
    car: '<path d="M5 17h14M6 17l-2-5 2-5h12l2 5-2 5M7 12h10"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    ship: '<path d="M12 3v10M7 7h10v6M3 14l9-4 9 4c-1 4-4 7-9 7s-8-3-9-7z"/>',
    file: '<path d="M6 2h8l4 4v16H6zM14 2v5h5M9 12h6M9 16h6"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7M10 20h4"/>',
    scale: '<path d="M12 3v18M5 7h14M5 7l-3 7h6L5 7zm14 0-3 7h6l-3-7zM8 21h8"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4zM20 4h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1-2-4-2 1a7 7 0 0 0-2-1l-.3-2h-5L9 6a7 7 0 0 0-2 1L5 6l-2 4 2 1a7 7 0 0 0 0 2l-2 1 2 4 2-1a7 7 0 0 0 2 1l.5 2h5l.5-2a7 7 0 0 0 2-1l2 1 2-4-2-1a7 7 0 0 0 .1-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="m6 12 4 4 8-9"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  };
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</g>`;
};

const text = (x, y, value, size = 14, color = "#202824", weight = 400, anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="0">${esc(value)}</text>`;

function logoMark(brand, x, y, size) {
  const file = logos[brand] ? img(logos[brand]) : "";
  if (file) return `<image x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" href="${file}"/>`;
  const marks = { "雪铁龙": "CITROËN", "星途": "EXEED", "腾势": "DENZA" };
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size / 2}" fill="#F0F5F2"/>${text(x + size / 2, y + size / 2 + 3, marks[brand] || brand, size < 30 ? 7 : 8, "#2F5D49", 700, "middle")}`;
}

function desktopSidebar() {
  const nav = [
    ["chat", "AI 工作台", 154, false], ["car", "车辆报价", 199, true], ["ship", "海运报价", 244, false],
    ["file", "报告", 289, false], ["bell", "通知", 334, false],
  ];
  let out = `<g id="Sidebar"><rect width="232" height="1280" fill="#006233"/>`;
  out += text(18, 43, "HelloCarCar", 25, "#FFFFFF", 800);
  out += `<rect x="16" y="78" width="200" height="46" rx="6" fill="#D7ECDE"/>${icon("plus", 27, 89, 24, "#006233")}${text(61, 107, "新对话", 14, "#006233", 700)}`;
  for (const [i, label, y, active] of nav) {
    if (active) out += `<rect x="12" y="${y - 27}" width="208" height="39" rx="6" fill="#177447"/>`;
    out += icon(i, 25, y - 21, 20, active ? "#E5F4E8" : "#C9E7D3");
    out += text(55, y - 6, label, 13, active ? "#FFFFFF" : "#DDEFE3", active ? 700 : 400);
  }
  out += text(25, 389, "服务", 10, "#BFE2CA", 700);
  out += icon("scale", 25, 410, 20, "#C9E7D3") + text(55, 425, "经济纠纷处理", 12, "#DDEFE3");
  out += icon("car", 25, 455, 20, "#C9E7D3") + text(55, 470, "配置信息", 12, "#DDEFE3");
  out += icon("book", 25, 500, 20, "#C9E7D3") + text(55, 515, "政策咨询", 12, "#DDEFE3");
  out += `<path d="M22 552h188" stroke="#408961"/>${text(25, 580, "最近对话", 10, "#BFE2CA", 700)}`;
  ["大众探戈", "请帮我核查 NBSauto", "帮我查询经销商价格", "帮我查询大众价格", "查询 GS3 价格"].forEach((v, index) => {
    out += text(25, 616 + index * 42, v, 11, "#D5E8DC", 400);
  });
  out += text(25, 842, "查看全部历史", 12, "#DDEFE3", 400) + icon("chevron", 190, 826, 18, "#C9E7D3");
  out += icon("settings", 25, 916, 20, "#C9E7D3") + text(55, 931, "账户设置", 13, "#DDEFE3");
  out += `<path d="M16 1196h200" stroke="#408961"/><circle cx="42" cy="1231" r="19" fill="#177447"/>${text(42, 1236, "J", 13, "#FFFFFF", 700, "middle")}${text(72, 1228, "jiayiju346@gmail.com", 11, "#FFFFFF", 600)}${text(72, 1246, "高级会员", 9, "#CFE8D7")}`;
  return out + `</g>`;
}

function priceFilters(x, y, compact = false) {
  const items = compact ? [["全部", 62], ["< $10K", 75], ["$10K–$20K", 92], ["> $20K", 75]] : [["全部价位", 92], ["< $10,000", 112], ["$10,000–$20,000", 148], ["> $20,000", 112]];
  let cursor = x;
  let out = "";
  items.forEach(([label, width], index) => {
    const selected = index === 0;
    out += `<rect x="${cursor}" y="${y}" width="${width}" height="34" rx="6" fill="${selected ? "#E4F3E9" : "#FFFFFF"}" stroke="${selected ? "#7CB994" : "#DCE5E0"}"/>`;
    if (selected) out += icon("check", cursor + 10, y + 8, 17, "#087545");
    out += text(cursor + (selected ? width / 2 + 7 : width / 2), y + 22, label, compact ? 10 : 12, selected ? "#087545" : "#45534C", selected ? 700 : 500, "middle");
    cursor += width + (compact ? 8 : 10);
  });
  return out;
}

function desktopBrandGrid() {
  const startX = 272, startY = 246, width = 148, height = 58, gapX = 12, gapY = 10;
  let out = `<g id="Brand-grid">`;
  brands.forEach((brand, index) => {
    const col = index % 7, row = Math.floor(index / 7);
    const x = startX + col * (width + gapX), y = startY + row * (height + gapY);
    const selected = brand === "比亚迪";
    out += `<g id="Brand-${esc(brand)}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${selected ? "#EAF6EE" : "#FFFFFF"}" stroke="${selected ? "#78B991" : "#DDE5E1"}"/>`;
    if (selected) out += `<rect x="${x}" y="${y}" width="3" height="${height}" rx="1.5" fill="#087545"/>`;
    out += logoMark(brand, x + 12, y + 10, 38);
    out += text(x + 59, y + 35, brand, 12, selected ? "#087545" : "#26342D", selected ? 700 : 600);
    out += `</g>`;
  });
  return out + `</g>`;
}

function desktopQuoteRows() {
  let out = `<g id="Quote-list">`;
  quotes.forEach((quote, index) => {
    const y = 711 + index * 132;
    out += `<g id="Quote-${index + 1}"><rect x="272" y="${y}" width="1124" height="122" fill="#FFFFFF"/>`;
    out += `<image x="292" y="${y + 11}" width="142" height="70" preserveAspectRatio="xMidYMid meet" href="${img(quote.image)}"/>`;
    out += text(292, y + 102, `${quote.title} · ${quote.spec}`, 12, "#202824", 600);
    out += text(744, y + 58, quote.price, 18, "#202824", 700);
    out += text(936, y + 54, quote.port, 13, "#202824", 500);
    out += text(1055, y + 54, quote.date, 12, "#69736E", 400);
    out += `<rect x="1226" y="${y + 39}" width="146" height="36" rx="6" fill="#FFFFFF" stroke="#78B991"/>${text(1299, y + 62, "查看车型配置表", 12, "#087545", 700, "middle")}`;
    if (index < quotes.length - 1) out += `<path d="M272 ${y + 122}h1124" stroke="#E3E8E5"/>`;
    out += `</g>`;
  });
  return out + `</g>`;
}

function desktopSvg() {
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1280" viewBox="0 0 1440 1280"><title>Hellocarcar 车辆 FOB 报价 - Desktop</title><rect width="1440" height="1280" fill="#F7F8FA"/>`;
  out += desktopSidebar();
  out += `<g id="Topbar"><rect x="232" width="1208" height="64" fill="#FFFFFF"/><path d="M232 63.5h1208" stroke="#E3E8E5"/>${text(272, 39, "车辆报价", 14, "#202824", 600)}${text(1247, 39, "277 条记录", 12, "#69736E", 400)}${icon("bell", 1327, 22, 20, "#69736E")}<circle cx="1394" cy="32" r="17" fill="#E9F4EC"/>${text(1394, 37, "J", 12, "#006233", 700, "middle")}</g>`;
  out += `<g id="Main-content">${text(272, 119, "车辆 FOB 报价", 28, "#202824", 700)}${text(272, 151, "选择价位与品牌，查看该品牌的全部配置报价", 13, "#69736E", 400)}`;
  out += `${text(272, 191, "价位筛选", 12, "#45534C", 600)}${priceFilters(272, 202)}`;
  out += `${text(272, 238, "全部品牌", 12, "#45534C", 600)}${text(1396, 238, "33 个品牌", 11, "#7B8781", 400, "end")}${desktopBrandGrid()}`;
  out += `<path d="M272 595h1124" stroke="#DDE5E1"/>${logoMark("比亚迪", 272, 615, 42)}${text(326, 633, "比亚迪", 18, "#202824", 700)}${text(326, 651, "已展开 38 条配置报价", 11, "#69736E", 400)}${text(1396, 641, "收起", 12, "#087545", 600, "end")}`;
  out += `<g id="Table-head"><rect x="272" y="670" width="1124" height="41" fill="#EEF2EF"/>${text(292, 695, "车辆 · 配置", 11, "#69736E", 700)}${text(744, 695, "FOB 报价", 11, "#69736E", 700)}${text(936, 695, "交付地点", 11, "#69736E", 700)}${text(1055, 695, "记录日期", 11, "#69736E", 700)}${text(1226, 695, "车型资料", 11, "#69736E", 700)}</g>`;
  out += desktopQuoteRows() + `</g></svg>`;
  return out;
}

function mobileBrandGrid() {
  const startX = 20, startY = 271, width = 62, height = 57, gapX = 10, gapY = 8;
  let out = `<g id="Brand-grid-mobile">`;
  brands.forEach((brand, index) => {
    const col = index % 5, row = Math.floor(index / 5);
    const x = startX + col * (width + gapX), y = startY + row * (height + gapY);
    const selected = brand === "比亚迪";
    out += `<g id="Brand-mobile-${esc(brand)}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${selected ? "#EAF6EE" : "#FFFFFF"}" stroke="${selected ? "#78B991" : "#E0E7E3"}"/>${logoMark(brand, x + 19, y + 7, 24)}${text(x + width / 2, y + 48, brand, 9, selected ? "#087545" : "#34423B", selected ? 700 : 600, "middle")}</g>`;
  });
  return out + `</g>`;
}

function mobileQuoteCards() {
  let out = `<g id="Quote-cards-mobile">`;
  quotes.forEach((quote, index) => {
    const y = 793 + index * 224;
    out += `<g id="Quote-card-${index + 1}"><rect x="20" y="${y}" width="350" height="210" rx="7" fill="#FFFFFF" stroke="#DDE5E1"/>`;
    out += `<image x="32" y="${y + 10}" width="138" height="70" preserveAspectRatio="xMidYMid meet" href="${img(quote.image)}"/>`;
    out += text(32, y + 99, `${quote.title} · ${quote.spec}`, 12, "#202824", 700);
    out += text(338, y + 62, quote.price, 18, "#202824", 700, "end");
    out += `<path d="M32 ${y + 113}h326" stroke="#EDF1EF"/>`;
    out += text(32, y + 137, "交付地点", 10, "#7B8781", 500) + text(32, y + 157, quote.port, 12, "#202824", 600);
    out += text(170, y + 137, "记录日期", 10, "#7B8781", 500) + text(170, y + 157, quote.date, 12, "#202824", 500);
    out += `<rect x="32" y="${y + 171}" width="326" height="28" rx="6" fill="#FFFFFF" stroke="#78B991"/>${text(195, y + 190, "查看车型配置表", 11, "#087545", 700, "middle")}</g>`;
  });
  return out + `</g>`;
}

function mobileSvg() {
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="1760" viewBox="0 0 390 1760"><title>Hellocarcar 车辆 FOB 报价 - Mobile</title><rect width="390" height="1760" fill="#F7F8FA"/>`;
  out += `<g id="Mobile-topbar"><rect width="390" height="64" fill="#006233"/>${icon("menu", 18, 21, 22, "#FFFFFF")}${text(55, 40, "HelloCarCar", 19, "#FFFFFF", 700)}${icon("bell", 346, 21, 21, "#D8EDDE")}</g>`;
  out += `<g id="Mobile-content">${text(20, 106, "车辆 FOB 报价", 24, "#202824", 700)}${text(20, 132, "按价位筛选品牌，再查看全部配置报价", 12, "#69736E", 400)}`;
  out += text(20, 169, "价位筛选", 11, "#45534C", 600) + priceFilters(20, 181, true);
  out += text(20, 251, "全部品牌", 11, "#45534C", 600) + text(370, 251, "33 个", 10, "#7B8781", 400, "end") + mobileBrandGrid();
  out += `<path d="M20 742h350" stroke="#DDE5E1"/>${logoMark("比亚迪", 20, 757, 36)}${text(68, 773, "比亚迪", 16, "#202824", 700)}${text(68, 790, "38 条配置报价", 10, "#69736E", 400)}${text(370, 779, "收起", 11, "#087545", 600, "end")}`;
  out += mobileQuoteCards();
  out += `${text(195, 1710, "报价仅供参考，交易前请再次确认", 10, "#7B8781", 400, "middle")}</g></svg>`;
  return out;
}

fs.writeFileSync(path.join(root, "hellocarcar-vehicle-quote-desktop.svg"), desktopSvg());
fs.writeFileSync(path.join(root, "hellocarcar-vehicle-quote-mobile.svg"), mobileSvg());
console.log("Generated desktop and mobile SVG files.");
