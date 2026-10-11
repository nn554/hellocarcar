import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("outputs/config-query-card-redesign");
const assetDir = path.resolve("outputs/vehicle-quote-redesign/assets");
fs.mkdirSync(outDir, { recursive: true });

const C = {
  green: "#006B3C",
  green2: "#087A49",
  active: "#198351",
  pale: "#EAF6EF",
  mint: "#DDF0E5",
  border: "#DDE6E1",
  line: "#E8EEEA",
  bg: "#F6F8F7",
  white: "#FFFFFF",
  ink: "#1E2B25",
  muted: "#728078",
  soft: "#F1F5F3",
  orange: "#E7653D",
};

const cars = [
  { image: "sealion06.png", name: "海狮06 DM-i", spec: "121KM 领航版", price: "$19,084", tag: "插混 SUV" },
  { image: "seal06.png", name: "海豹06 DM-i", spec: "80KM 尊贵型", price: "$12,309", tag: "插混轿车" },
  { image: "qinl.png", name: "秦L DM-i", spec: "120KM 旗舰型", price: "$17,459", tag: "插混轿车" },
  { image: "tang.png", name: "唐DM-i 智驾版", spec: "115KM 尊贵型（7座）", price: "$20,909", tag: "中型 SUV" },
];

const esc = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const imageData = (name) => {
  const file = path.join(assetDir, name);
  return `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
};

const text = (x, y, value, size = 14, color = C.ink, weight = 400, anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="0">${esc(value)}</text>`;

const rect = (x, y, w, h, fill = C.white, stroke = "none", rx = 6, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" ${extra}/>`;

const line = (x1, y1, x2, y2, color = C.line, width = 1) =>
  `<path d="M${x1} ${y1}H${x2}" stroke="${color}" stroke-width="${width}"/>`;

const icon = (name, x, y, size = 20, color = "currentColor") => {
  const paths = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    chat: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
    car: '<path d="M5 17h14M6 17l-2-5 2-5h12l2 5-2 5M7 12h10"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    ship: '<path d="M12 3v10M7 7h10v6M3 14l9-4 9 4c-1 4-4 7-9 7s-8-3-9-7z"/>',
    file: '<path d="M6 2h8l4 4v16H6zM14 2v5h5M9 12h6M9 16h6"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7M10 20h4"/>',
    scale: '<path d="M12 3v18M5 7h14M5 7l-3 7h6L5 7zm14 0-3 7h6l-3-7zM8 21h8"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4zM20 4h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1-2-4-2 1a7 7 0 0 0-2-1l-.3-2h-5L9 6a7 7 0 0 0-2 1L5 6l-2 4 2 1a7 7 0 0 0 0 2l-2 1 2 4 2-1a7 7 0 0 0 2 1l.5 2h5l.5-2a7 7 0 0 0 2-1l2 1 2-4-2-1a7 7 0 0 0 .1-1z"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    check: '<path d="m6 12 4 4 8-9"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v6l4 2"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  };
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</g>`;
};

function desktopSidebar() {
  const nav = [
    ["chat", "AI 工作台", 154, false],
    ["car", "车辆报价", 199, false],
    ["ship", "海运报价", 244, false],
    ["file", "报告", 289, false],
    ["bell", "通知", 334, false],
  ];
  let out = `<g id="Sidebar-unchanged">${rect(0, 0, 232, 1024, C.green, "none", 0)}`;
  out += text(17, 43, "HelloCarCar", 25, C.white, 800);
  out += rect(15, 76, 202, 47, "#D8EEDF", "none", 6) + icon("plus", 26, 88, 24, C.green) + text(61, 106, "新对话", 14, C.green, 700);
  for (const [name, label, y, active] of nav) {
    if (active) out += rect(12, y - 27, 208, 39, C.active, "none", 6);
    out += icon(name, 24, y - 21, 20, active ? C.white : "#CDE8D6");
    out += text(55, y - 6, label, 13, active ? C.white : "#E0F0E5", active ? 700 : 400);
  }
  out += text(24, 389, "服务", 10, "#BCE0C7", 700);
  out += icon("scale", 24, 408, 20, "#CDE8D6") + text(55, 423, "经济纠纷处理", 12, "#E0F0E5");
  out += rect(12, 438, 208, 39, C.active, "none", 6) + icon("card", 24, 447, 20, C.white) + text(55, 462, "配置表", 12, C.white, 700);
  out += icon("book", 24, 491, 20, "#CDE8D6") + text(55, 506, "政策咨询", 12, "#E0F0E5");
  out += line(19, 539, 213, 539, "#3B8B61") + text(24, 569, "最近对话", 10, "#BCE0C7", 700);
  ["大众探戈", "请帮我核查 NBSauto 的公开信息", "帮我查询经销商价格", "帮我查询大众的价格", "查询 GS3 价格"].forEach((label, i) => {
    out += text(24, 609 + i * 42, label, 11, "#D9ECE0");
  });
  out += text(24, 834, "查看全部历史", 12, "#E0F0E5") + icon("chevron", 190, 818, 18, "#CDE8D6");
  out += icon("settings", 24, 884, 20, "#CDE8D6") + text(55, 899, "账户设置", 13, "#E0F0E5");
  out += icon("card", 24, 928, 20, "#CDE8D6") + text(55, 943, "订阅", 13, "#E0F0E5");
  out += line(16, 970, 216, 970, "#3B8B61");
  out += `<circle cx="42" cy="997" r="18" fill="#198351"/>${text(42, 1002, "J", 12, C.white, 700, "middle")}${text(72, 995, "jiayiju346@gmail.com", 10, C.white, 600)}${text(72, 1010, "高级会员", 9, "#CDE8D6")}`;
  return out + `</g>`;
}

function desktopTopbar() {
  return `<g id="Topbar-unchanged">${rect(232, 0, 1208, 64, C.white, "none", 0)}${line(232, 63.5, 1440, 63.5, C.line)}${text(272, 39, "配置表", 14, C.ink, 700)}${text(1194, 38, "配置表 · PDF", 12, C.muted, 500)}${icon("globe", 1270, 22, 19, C.muted)}${text(1300, 38, "中文", 12, C.ink, 500)}${icon("bell", 1352, 22, 19, C.muted)}<circle cx="1400" cy="32" r="17" fill="#EAF5EE"/>${text(1400, 37, "J", 12, C.green, 700, "middle")}</g>`;
}

function tabs(x, y, mobile = false) {
  const h = mobile ? 38 : 42;
  const w1 = mobile ? 128 : 118;
  const w2 = mobile ? 128 : 112;
  return `<g id="Query-tabs">${rect(x, y, w1, h, C.green2, "none", 7)}${icon("search", x + 16, y + (mobile ? 10 : 11), 17, C.white)}${text(x + w1 / 2 + 8, y + (mobile ? 25 : 27), "查询配置", mobile ? 13 : 13, C.white, 700, "middle")}${rect(x + w1 + 10, y, w2, h, C.white, C.border, 7)}${icon("history", x + w1 + 24, y + (mobile ? 10 : 11), 17, C.muted)}${text(x + w1 + 10 + w2 / 2 + 8, y + (mobile ? 25 : 27), "配置表历史", mobile ? 12 : 12, C.ink, 600, "middle")}</g>`;
}

function desktopVehicleCards() {
  let out = `<g id="Popular-vehicle-cards">`;
  cars.forEach((car, i) => {
    const x = 272 + i * 278;
    out += `<g id="Vehicle-card-${i + 1}">${rect(x, 224, 262, 174, C.white, C.border, 7, 'filter="url(#shadow)"')}`;
    out += `<image x="${x + 14}" y="236" width="116" height="70" preserveAspectRatio="xMidYMid meet" href="${imageData(car.image)}"/>`;
    out += rect(x + 176, 240, 70, 24, C.pale, "none", 12) + text(x + 211, 257, car.tag, 9, C.green2, 700, "middle");
    out += text(x + 14, 326, car.name, 13, C.ink, 700) + text(x + 14, 347, car.spec, 10, C.muted, 500);
    out += text(x + 246, 373, car.price, 18, C.green2, 800, "end");
    out += text(x + 14, 373, "FOB 南沙", 10, C.muted, 500);
    out += `</g>`;
  });
  return out + `</g>`;
}

function stepper(x, y, width, compact = false) {
  const points = compact ? [x, x + width / 2, x + width] : [x, x + width / 2, x + width];
  const labels = compact ? ["品牌", "车型", "预览"] : ["选择品牌", "选择车型", "语言与 PDF 预览"];
  let out = `<g id="Query-steps">${line(points[0] + 28, y + 15, points[2] - 28, y + 15, C.border, 2)}`;
  points.forEach((px, i) => {
    const active = i <= 1;
    out += `<circle cx="${px}" cy="${y + 15}" r="15" fill="${i === 1 ? C.green2 : active ? C.mint : C.soft}" stroke="${active ? C.green2 : C.border}"/>`;
    if (i === 0) out += icon("check", px - 8, y + 7, 16, C.green2);
    else out += text(px, y + 20, String(i + 1), 11, i === 1 ? C.white : C.muted, 700, "middle");
    out += text(px, y + (compact ? 49 : 50), labels[i], compact ? 10 : 11, active ? C.green2 : C.muted, active ? 700 : 500, "middle");
  });
  return out + `</g>`;
}

function desktopQueryModule() {
  const x = 272, y = 424, w = 1124, h = 570;
  let out = `<g id="Dedicated-config-query-card">${rect(x, y, w, h, C.white, C.border, 8, 'filter="url(#shadow)"')}`;
  out += `<rect x="${x}" y="${y}" width="5" height="78" rx="2.5" fill="${C.green2}"/>`;
  out += text(x + 28, y + 34, "选择品牌与车型", 18, C.ink, 700) + text(x + 28, y + 57, "先选择品牌，再选择具体车型", 11, C.muted, 400);
  out += rect(x + w - 148, y + 22, 120, 30, C.pale, "none", 15) + `<circle cx="${x + w - 126}" cy="${y + 37}" r="6" fill="${C.green2}"/>`;
  out += text(x + w - 84, y + 42, "车型配置", 11, C.green2, 700, "middle") + line(x + 24, y + 78, x + w - 24, y + 78, C.line);

  const leftX = x + 28, panelY = y + 96, leftW = 304, panelH = 374;
  out += `<g id="Brand-selection-panel">${rect(leftX, panelY, leftW, panelH, "#FBFCFB", C.border, 8)}${rect(leftX, panelY, 44, panelH, "#EFF6F2", "none", 8)}`;
  ["★", "A", "B", "C", "D", "F", "G", "H", "J", "K", "M"].forEach((letter, i) => {
    if (letter === "A") out += rect(leftX, panelY + 38, 44, 34, C.mint, "none", 0);
    out += text(leftX + 22, panelY + 25 + i * 31, letter, letter === "A" ? 13 : 11, letter === "A" ? C.green2 : C.muted, letter === "A" ? 700 : 500, "middle");
  });
  out += text(leftX + 64, panelY + 28, "品牌", 14, C.ink, 700);
  out += rect(leftX + 58, panelY + 42, 226, 38, C.white, C.border, 6) + icon("search", leftX + 70, panelY + 51, 18, C.muted) + text(leftX + 98, panelY + 66, "搜索品牌", 10, C.muted);
  const brands = [
    { logo: "byd.png", name: "比亚迪", count: "24 款车型", selected: true },
    { logo: "volkswagen.png", name: "大众", count: "18 款车型" },
    { logo: "bmw.png", name: "宝马", count: "31 款车型" },
    { logo: "toyota.png", name: "丰田", count: "27 款车型" },
  ];
  brands.forEach((brand, i) => {
    const by = panelY + 94 + i * 66;
    out += rect(leftX + 58, by, 226, 56, brand.selected ? C.mint : "transparent", brand.selected ? "#91CBAA" : "none", 7);
    if (brand.selected) out += `<rect x="${leftX + 58}" y="${by}" width="4" height="56" rx="2" fill="${C.green2}"/>`;
    out += `<image x="${leftX + 72}" y="${by + 13}" width="34" height="30" preserveAspectRatio="xMidYMid meet" href="${imageData(brand.logo)}"/>`;
    out += text(leftX + 120, by + 24, brand.name, 12, C.ink, brand.selected ? 700 : 600) + text(leftX + 120, by + 42, brand.count, 9, C.muted, 500);
    out += `<circle cx="${leftX + 264}" cy="${by + 28}" r="6" fill="${brand.selected ? C.green2 : C.white}" stroke="${brand.selected ? C.green2 : C.border}"/>`;
  });
  out += `</g>`;

  const rightX = leftX + leftW + 18, rightW = w - 74 - leftW;
  out += `<g id="Model-selection-panel">${rect(rightX, panelY, rightW, panelH, C.white, C.border, 8)}`;
  out += `<image x="${rightX + 20}" y="${panelY + 15}" width="38" height="34" preserveAspectRatio="xMidYMid meet" href="${imageData("byd.png")}"/>`;
  out += text(rightX + 72, panelY + 31, "比亚迪", 16, C.ink, 700) + text(rightX + 72, panelY + 49, "共 24 款车型 · 已选 1 款", 9, C.muted, 500);
  out += rect(rightX + rightW - 246, panelY + 19, 74, 28, C.mint, "none", 14) + text(rightX + rightW - 209, panelY + 38, "全部车型", 10, C.green2, 700, "middle");
  out += rect(rightX + rightW - 162, panelY + 19, 70, 28, C.soft, "none", 14) + text(rightX + rightW - 127, panelY + 38, "新能源", 10, C.muted, 500, "middle");
  out += rect(rightX + rightW - 82, panelY + 19, 62, 28, C.soft, "none", 14) + text(rightX + rightW - 51, panelY + 38, "SUV", 10, C.muted, 500, "middle") + line(rightX + 20, panelY + 65, rightX + rightW - 20, panelY + 65, C.line);
  cars.slice(0, 3).forEach((car, i) => {
    const cy = panelY + 78 + i * 93;
    const selected = i === 0;
    out += `<g id="Model-row-${i + 1}">${rect(rightX + 18, cy, rightW - 36, 82, selected ? "#F1FAF5" : C.white, selected ? "#66B98C" : C.border, 7)}`;
    if (selected) out += `<rect x="${rightX + 18}" y="${cy}" width="4" height="82" rx="2" fill="${C.green2}"/>`;
    out += `<image x="${rightX + 35}" y="${cy + 8}" width="122" height="62" preserveAspectRatio="xMidYMid meet" href="${imageData(car.image)}"/>`;
    out += text(rightX + 176, cy + 26, car.name, 13, C.ink, 700) + text(rightX + 176, cy + 45, car.spec, 9, C.muted, 500) + text(rightX + 176, cy + 67, car.tag + "  |  FOB 南沙", 9, C.muted, 500);
    out += text(rightX + rightW - 68, cy + 48, car.price, 18, C.orange, 800, "end");
    out += `<circle cx="${rightX + rightW - 42}" cy="${cy + 41}" r="11" fill="${selected ? C.green2 : C.white}" stroke="${selected ? C.green2 : "#BFD1C7"}"/>`;
    if (selected) out += icon("check", rightX + rightW - 50, cy + 33, 16, C.white);
    out += `</g>`;
  });
  out += `</g>`;

  const footerY = y + 490;
  out += line(x + 28, footerY, x + w - 28, footerY, C.line);
  out += text(x + 28, footerY + 34, "已选择", 10, C.muted, 600) + rect(x + 88, footerY + 15, 190, 30, C.pale, "none", 15) + text(x + 183, footerY + 35, "海狮06 DM-i · $19,084", 10, C.green2, 700, "middle");
  out += text(x + 755, footerY + 34, "语言", 10, C.muted, 500) + rect(x + 800, footerY + 13, 116, 34, C.white, C.border, 6) + text(x + 818, footerY + 35, "简体中文", 11, C.ink, 500) + text(x + 899, footerY + 35, "⌄", 12, C.muted, 600);
  out += text(x + 944, footerY + 35, "重置", 10, C.muted, 500) + rect(x + 988, footerY + 11, 108, 38, C.green2, "none", 7) + text(x + 1042, footerY + 36, "查看配置表", 10, C.white, 700, "middle");
  out += text(x + 28, y + 558, "价格来自报价记录，仅供配置查询参考", 9, C.muted, 400);
  return out + `</g>`;
}

function desktopSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1024" viewBox="0 0 1440 1024"><title>Hellocarcar 配置表查询卡片化重设计 - Desktop</title><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#173A29" flood-opacity="0.06"/></filter></defs>${rect(0, 0, 1440, 1024, C.bg, "none", 0)}${desktopSidebar()}${desktopTopbar()}<g id="Configuration-main-content">${tabs(272, 88)}${text(272, 164, "查询车辆配置", 27, C.ink, 750)}${text(272, 190, "从真实报价车型中选择，快速生成可分享的 PDF 配置表。", 12, C.muted)}${text(272, 211, "热门车型配置", 13, C.ink, 700)}${text(1396, 211, "全部车型 →", 11, C.green2, 700, "end")}${desktopVehicleCards()}${desktopQueryModule()}</g></svg>`;
}

function mobileHeader() {
  return `<g id="Mobile-header">${rect(0, 0, 390, 62, C.white, "none", 0)}${line(0, 61.5, 390, 61.5, C.line)}${icon("menu", 18, 20, 21, C.ink)}${text(51, 39, "配置表", 15, C.ink, 700)}${icon("bell", 330, 21, 19, C.muted)}<circle cx="371" cy="31" r="15" fill="#EAF5EE"/>${text(371, 36, "J", 11, C.green, 700, "middle")}</g>`;
}

function mobileVehicleCards() {
  let out = `<g id="Mobile-popular-cards">`;
  cars.slice(0, 2).forEach((car, i) => {
    const x = 16 + i * 181;
    out += `<g id="Mobile-popular-${i + 1}">${rect(x, 228, 173, 166, C.white, C.border, 7)}`;
    out += `<image x="${x + 10}" y="238" width="153" height="70" preserveAspectRatio="xMidYMid meet" href="${imageData(car.image)}"/>`;
    out += text(x + 10, 326, car.name, 12, C.ink, 700) + text(x + 10, 345, car.spec, 9, C.muted, 500);
    out += text(x + 163, 378, car.price, 16, C.green2, 800, "end") + text(x + 10, 377, "FOB", 9, C.muted, 600);
    out += `</g>`;
  });
  return out + `</g>`;
}

function mobileBrandAndModelCard(cardY) {
  let out = `<g id="Mobile-brand-model-card">${rect(16, cardY, 358, 956, C.white, C.border, 8, 'filter="url(#shadow)"')}<rect x="16" y="${cardY}" width="4" height="72" rx="2" fill="${C.green2}"/>`;
  out += text(36, cardY + 29, "选择品牌与车型", 16, C.ink, 700) + text(36, cardY + 51, "先选择品牌，再选择具体车型", 10, C.muted);
  out += rect(286, cardY + 20, 70, 26, C.pale, "none", 13) + text(321, cardY + 38, "车型配置", 9, C.green2, 700, "middle") + line(32, cardY + 72, 358, cardY + 72, C.line);

  const brandY = cardY + 90;
  out += text(28, brandY + 18, "品牌", 14, C.ink, 700) + text(362, brandY + 18, "首字母定位 · 区域内滑动", 9, C.muted, 500, "end");
  out += rect(28, brandY + 32, 334, 40, C.white, C.border, 6) + icon("search", 40, brandY + 43, 17, C.muted) + text(68, brandY + 57, "搜索品牌", 10, C.muted);
  const railY = brandY + 82;
  out += rect(28, railY, 334, 142, "#FBFDFC", C.border, 7);
  out += rect(65, railY, 1, 142, C.line, "none", 0);
  out += rect(28, railY, 38, 142, C.pale, "none", 7);
  const initials = ["★", "A", "B", "C", "D", "E", "F"];
  initials.forEach((letter, i) => {
    const ly = railY + 17 + i * 18;
    if (letter === "B") out += rect(34, ly - 13, 26, 18, C.mint, "none", 9);
    out += text(47, ly, letter, letter === "★" ? 9 : 10, letter === "B" ? C.green2 : C.muted, letter === "B" ? 800 : 600, "middle");
  });
  out += text(47, railY + 137, "⌄", 10, C.muted, 700, "middle");
  out += text(78, railY + 17, "B", 9, C.muted, 800) + text(342, railY + 17, "3 个品牌", 8, C.muted, 500, "end");
  const indexedBrands = [
    { logo: "bmw.png", name: "宝马", count: "31 款车型" },
    { logo: "byd.png", name: "比亚迪", count: "24 款车型", selected: true },
    { name: "北京汽车", count: "18 款车型", monogram: "北" },
  ];
  indexedBrands.forEach((brand, i) => {
    const bx = 76;
    const by = railY + 25 + i * 36;
    out += rect(bx, by, 276, 34, brand.selected ? C.mint : C.white, brand.selected ? "#91CBAA" : "none", 5);
    if (brand.selected) out += rect(bx, by, 3, 34, C.green2, "none", 1.5);
    if (brand.logo) out += "<image x=\"" + (bx + 10) + "\" y=\"" + (by + 6) + "\" width=\"26\" height=\"22\" preserveAspectRatio=\"xMidYMid meet\" href=\"" + imageData(brand.logo) + "\"/>";
    else out += "<circle cx=\"" + (bx + 23) + "\" cy=\"" + (by + 17) + "\" r=\"12\" fill=\"" + C.soft + "\" stroke=\"" + C.border + "\"/>" + text(bx + 23, by + 21, brand.monogram, 9, C.ink, 700, "middle");
    out += text(bx + 46, by + 15, brand.name, 10, C.ink, brand.selected ? 700 : 600) + text(bx + 46, by + 28, brand.count, 7, C.muted, 500);
    out += "<circle cx=\"" + (bx + 258) + "\" cy=\"" + (by + 17) + "\" r=\"5\" fill=\"" + (brand.selected ? C.green2 : C.white) + "\" stroke=\"" + (brand.selected ? C.green2 : C.border) + "\"/>";
  });
  out += rect(356, railY + 27, 3, 105, "#E7EEEA", "none", 1.5) + rect(356, railY + 51, 3, 34, "#91A39A", "none", 1.5);

  if (false) {
  const brands = [
    { logo: "byd.png", name: "比亚迪", selected: true },
    { logo: "volkswagen.png", name: "大众" },
    { logo: "bmw.png", name: "宝马" },
    { logo: "toyota.png", name: "丰田" },
  ];
  brands.forEach((brand, i) => {
    const bx = 28 + (i % 2) * 170;
    const by = brandY + 86 + Math.floor(i / 2) * 66;
    out += rect(bx, by, 164, 56, brand.selected ? C.mint : C.white, brand.selected ? "#91CBAA" : C.border, 7);
    if (brand.selected) out += `<rect x="${bx}" y="${by}" width="4" height="56" rx="2" fill="${C.green2}"/>`;
    out += `<image x="${bx + 14}" y="${by + 12}" width="36" height="31" preserveAspectRatio="xMidYMid meet" href="${imageData(brand.logo)}"/>`;
    out += text(bx + 60, by + 25, brand.name, 11, C.ink, brand.selected ? 700 : 600) + text(bx + 60, by + 43, brand.selected ? "24 款车型" : "查看车型", 8, C.muted, 500);
    out += `<circle cx="${bx + 145}" cy="${by + 28}" r="6" fill="${brand.selected ? C.green2 : C.white}" stroke="${brand.selected ? C.green2 : C.border}"/>`;
  });

  }
  const modelY = brandY + 230;
  out += line(28, modelY, 362, modelY, C.line) + `<image x="28" y="${modelY + 15}" width="34" height="31" preserveAspectRatio="xMidYMid meet" href="${imageData("byd.png")}"/>`;
  out += text(74, modelY + 32, "比亚迪", 14, C.ink, 700) + text(74, modelY + 49, "共 24 款车型 · 已选 1 款", 8, C.muted, 500);
  out += rect(228, modelY + 16, 58, 26, C.mint, "none", 13) + text(257, modelY + 34, "全部", 9, C.green2, 700, "middle") + rect(294, modelY + 16, 68, 26, C.soft, "none", 13) + text(328, modelY + 34, "新能源", 9, C.muted, 500, "middle");
  cars.slice(0, 3).forEach((car, i) => {
    const rowY = modelY + 67 + i * 116;
    const selected = i === 0;
    out += `<g id="Mobile-model-${i + 1}">${rect(28, rowY, 334, 104, selected ? "#F1FAF5" : C.white, selected ? "#66B98C" : C.border, 7)}`;
    if (selected) out += `<rect x="28" y="${rowY}" width="4" height="104" rx="2" fill="${C.green2}"/>`;
    out += `<image x="40" y="${rowY + 11}" width="110" height="58" preserveAspectRatio="xMidYMid meet" href="${imageData(car.image)}"/>`;
    out += text(162, rowY + 25, car.name, 12, C.ink, 700) + text(162, rowY + 43, car.spec, 8, C.muted, 500) + text(162, rowY + 68, car.price, 17, C.orange, 800) + text(162, rowY + 86, "FOB · 南沙", 8, C.muted, 500);
    out += `<circle cx="340" cy="${rowY + 22}" r="9" fill="${selected ? C.green2 : C.white}" stroke="${selected ? C.green2 : C.border}"/>`;
    if (selected) out += icon("check", 333, rowY + 15, 14, C.white);
    out += `</g>`;
  });

  const footerY = cardY + 786;
  out += line(28, footerY, 362, footerY, C.line) + text(28, footerY + 29, "已选择", 9, C.muted, 600) + rect(82, footerY + 10, 176, 28, C.pale, "none", 14) + text(170, footerY + 29, "海狮06 DM-i · $19,084", 9, C.green2, 700, "middle");
  out += text(28, footerY + 72, "语言", 9, C.muted, 500) + rect(73, footerY + 49, 124, 34, C.white, C.border, 6) + text(90, footerY + 71, "简体中文", 10, C.ink, 500) + text(180, footerY + 71, "⌄", 11, C.muted, 600) + text(329, footerY + 71, "重置", 10, C.muted, 500, "end");
  out += rect(28, footerY + 99, 334, 46, C.green2, "none", 7) + text(195, footerY + 128, "查看配置表", 13, C.white, 700, "middle") + icon("arrow", 326, footerY + 110, 17, C.white);
  out += text(28, footerY + 166, "价格来自报价记录，仅供配置查询参考", 8, C.muted, 400);
  return out + `</g>`;
}

function mobileSvg() {
  const cardY = 430;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="1415" viewBox="0 0 390 1415"><title>Hellocarcar 配置表查询卡片化重设计 - Mobile</title><defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#173A29" flood-opacity="0.07"/></filter></defs>${rect(0, 0, 390, 1415, C.bg, "none", 0)}${mobileHeader()}<g id="Mobile-main-content">${tabs(16, 80, true)}${text(16, 154, "查询车辆配置", 23, C.ink, 750)}${text(16, 178, "选择车型，生成可分享的 PDF 配置表", 11, C.muted)}${text(16, 211, "热门车型配置", 12, C.ink, 700)}${text(374, 211, "查看全部 →", 10, C.green2, 700, "end")}${mobileVehicleCards()}${mobileBrandAndModelCard(cardY)}</g></svg>`;
}

fs.writeFileSync(path.join(outDir, "hellocarcar-config-query-desktop.svg"), desktopSvg());
fs.writeFileSync(path.join(outDir, "hellocarcar-config-query-mobile.svg"), mobileSvg());
console.log("Generated config query desktop and mobile SVGs.");
