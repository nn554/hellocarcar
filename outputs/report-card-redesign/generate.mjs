import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("outputs/report-card-redesign");
fs.mkdirSync(outDir, { recursive: true });

const esc = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const font = "Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif";
const t = (x, y, value, size = 14, fill = "#1F2A24", weight = 400, anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="0">${esc(value)}</text>`;
const line = (x1, y1, x2, y2, stroke = "#D9E2DC", width = 1) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`;
const rect = (x, y, w, h, fill, stroke = "none", rx = 8, sw = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

function icon(name, x, y, size = 20, color = "#C9E7D3") {
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
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"/>',
  };
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</g>`;
}

function sidebar() {
  let s = `<g id="sidebar">${rect(0, 0, 232, 960, "#006233", "none", 0)}`;
  s += t(18, 44, "HelloCarCar", 25, "#FFFFFF", 800);
  s += `${rect(16, 70, 200, 46, "#D9F0DF", "none", 7)}${icon("plus", 27, 81, 24, "#006233")}${t(61, 99, "新对话", 14, "#006233", 700)}`;
  const nav = [["chat", "AI 工作台", 151], ["car", "车辆报价", 196], ["ship", "海运报价", 241], ["file", "报告", 286], ["bell", "通知", 331]];
  nav.forEach(([ic, label, y], index) => {
    if (index === 3) s += rect(12, y - 27, 208, 39, "#177447", "none", 7);
    s += icon(ic, 25, y - 22, 20, index === 3 ? "#E9F7EC" : "#C9E7D3");
    s += t(55, y - 7, label, 13, index === 3 ? "#FFFFFF" : "#DDEFE3", index === 3 ? 700 : 400);
  });
  s += t(25, 386, "服务", 10, "#BFE2CA", 700);
  s += icon("scale", 25, 405, 20) + t(55, 420, "交付纠纷", 12, "#DDEFE3");
  s += icon("car", 25, 450, 20) + t(55, 465, "配货表", 12, "#DDEFE3");
  s += icon("book", 25, 495, 20) + t(55, 510, "政策咨询", 12, "#DDEFE3");
  s += line(22, 548, 210, 548, "#408961");
  s += t(25, 578, "最近对话", 10, "#BFE2CA", 700);
  ["请查询今日利姆越 FOB 价格。", "JETOUR", "gs3", "大众探戈报价", "大众探戈"].forEach((v, i) => { s += t(25, 613 + i * 35, v, 11, "#D5E8DC"); });
  s += t(25, 801, "查看全部历史", 12, "#DDEFE3") + icon("arrow", 188, 785, 18, "#C9E7D3");
  s += icon("settings", 25, 856, 20) + t(55, 871, "账户设置", 13, "#DDEFE3");
  s += rect(16, 895, 200, 1, "#408961", "none", 0);
  s += `<circle cx="39" cy="928" r="19" fill="#177447"/>${t(39, 933, "J", 13, "#FFFFFF", 700, "middle")}${t(70, 925, "jiayihu346@gmail.com", 11, "#FFFFFF", 600)}${t(70, 943, "高级会员", 9, "#CFE8D7")}`;
  return `${s}</g>`;
}

function topbar() {
  return `<g id="topbar">${rect(232, 0, 1208, 64, "#FFFFFF", "none", 0)}${line(232, 63, 1440, 63)}${t(272, 39, "AI 工作台", 14, "#202824", 700)}${t(1198, 39, "Hellocarcar AI 已启用", 12, "#69736E")}${icon("globe", 1319, 22, 18, "#69736E")}${t(1344, 39, "中文", 12, "#202824", 600)}${icon("chevron", 1387, 25, 16, "#69736E")}${icon("bell", 1420, 22, 18, "#69736E")}</g>`;
}

function base(title, subtitle) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960" viewBox="0 0 1440 960"><title>${esc(title)}</title>${rect(0, 0, 1440, 960, "#F6F8F7", "none", 0)}${sidebar()}${topbar()}${t(272, 120, title, 25, "#202824", 700)}${t(272, 151, subtitle, 13, "#69736E")}`;
}

function infoRow(x, y, label, value, width = 310) {
  return `${t(x, y, label, 12, "#7A8981", 600)}${t(x, y + 26, value, 14, "#26332C", 500)}${line(x, y + 46, x + width, y + 46, "#E5EBE7")}`;
}

function companyCard() {
  let s = `<g id="company-card">${rect(272, 188, 1120, 474, "#FFFFFF", "#D4DED8", 12)}${t(304, 228, "河南新蓝海科技有限公司", 20, "#1F2A24", 700)}${t(1358, 228, "企业基本信息", 13, "#69736E", 500, "end")}${line(304, 250, 1360, 250, "#BFCBC4", 1.2)}`;
  s += infoRow(304, 286, "企业名称", "河南新蓝海科技有限公司", 460);
  s += infoRow(808, 286, "登记状态", "存续", 460);
  s += infoRow(304, 362, "法定代表人", "马闯", 460);
  s += infoRow(808, 362, "注册资本", "100万元", 460);
  s += infoRow(304, 438, "实缴资本", "100万元", 460);
  s += infoRow(808, 438, "成立日期", "2024-11-22", 460);
  s += infoRow(304, 514, "统一社会信用代码", "91410105MAE65C7Y0D", 460);
  s += infoRow(808, 514, "企业地址", "河南省郑州市市辖区郑东新区康平路9号15号楼", 460);
  s += `${rect(304, 590, 258, 42, "#0A7A43", "none", 7)}${t(433, 617, "查看详细企业背调报告", 14, "#FFFFFF", 700, "middle")}`;
  return `${s}</g>`;
}

function defaultState() {
  return `${base("企业背调报告", "先查看企业基础信息，再按需生成完整背调报告")}${companyCard()}${t(304, 704, "本条回复", 12, "#69736E", 600)}${t(304, 732, "资料来源于 Hellocarcar 数据库，重要交易请结合人工核验。", 12, "#7A8981")}${rect(738, 780, 650, 124, "#FFFFFF", "#D7E2DB", 10)}${t(760, 813, "描述您想了解的企业、车辆、航线或问题", 13, "#9AA79F")}${t(760, 875, "Hellocarcar AI", 11, "#087545", 700)}${rect(1340, 850, 34, 34, "#9CCCB0", "none", 8)}${icon("arrow", 1347, 855, 20, "#FFFFFF")}</svg>`;
}

function modalState() {
  const underlying = `${base("企业背调报告", "先查看企业基础信息，再按需生成完整背调报告")}${companyCard()}${t(304, 704, "本条回复", 12, "#69736E", 600)}${t(304, 732, "资料来源于 Hellocarcar 数据库，重要交易请结合人工核验。", 12, "#7A8981")}${rect(738, 780, 650, 124, "#FFFFFF", "#D7E2DB", 10)}${t(760, 813, "描述您想了解的企业、车辆、航线或问题", 13, "#9AA79F")}`;
  let s = `${underlying}<rect x="232" y="64" width="1208" height="896" fill="#10261B" fill-opacity="0.22"/>${rect(492, 300, 456, 280, "#FFFFFF", "none", 14)}${rect(532, 337, 32, 32, "#E4F3E9", "none", 8)}${icon("file", 538, 343, 19, "#0A7A43")}${t(578, 359, "确认查看详细企业背调报告", 17, "#1F2A24", 700)}${icon("close", 900, 324, 18, "#7A8981")}${t(532, 410, "查看详细企业背调报告", 14, "#4B5A52", 500)}${t(532, 439, "将消耗 1 次报告额度", 16, "#0A7A43", 700)}${t(532, 468, "确认后可选择报告语言并进入预览。", 12, "#7A8981", 400)}${line(532, 496, 908, 496, "#E4EBE6")}${rect(589, 520, 116, 40, "#FFFFFF", "#CFD9D3", 7)}${t(647, 546, "取消", 13, "#4B5A52", 600, "middle")}${rect(717, 520, 128, 40, "#0A7A43", "none", 7)}${t(781, 546, "确定", 13, "#FFFFFF", 700, "middle")}</svg>`;
  return s;
}

function languageSelect(x, y, label, value, active = true) {
  return `${t(x, y, label, 12, "#728178", 600)}${rect(x, y + 14, 286, 48, "#FFFFFF", active ? "#0A7A43" : "#D6E0DA", 8, active ? 2 : 1)}${t(x + 16, y + 44, value, 14, "#26332C", 500)}${icon("chevron", x + 254, y + 28, 18, "#5E6E64")}`;
}

function previewState() {
  let s = `${base("企业背调报告", "完整报告已生成，可在右侧选择语言并查看预览")}`;
  s += `${rect(272, 188, 1120, 624, "#FFFFFF", "#D4DED8", 12)}${t(304, 228, "河南新蓝海科技有限公司", 20, "#1F2A24", 700)}${rect(1266, 202, 94, 38, "#FFFFFF", "#D4DED8", 7)}${t(1313, 226, "上一步", 13, "#425249", 600, "middle")}${line(304, 252, 1360, 252, "#BFCBC4", 1.2)}`;
  s += `${rect(304, 276, 716, 492, "#EEF2F0", "none", 10)}${t(662, 350, "PDF 预览", 14, "#A0ACA5", 600, "middle")}`;
  s += `${rect(458, 382, 408, 298, "#FFFFFF", "#D7E2DB", 4)}${rect(488, 408, 348, 9, "#D6E4DB", "none", 3)}${t(488, 454, "企业背调报告", 22, "#1F2A24", 700)}${t(488, 485, "河南新蓝海科技有限公司", 13, "#54645A", 500)}${line(488, 510, 836, 510, "#DDE6E0")}${t(488, 548, "企业基本信息 · 风险概览 · 经营状态", 11, "#7A8981")}${t(488, 628, "Hellocarcar AI 生成预览", 10, "#A0ACA5")}`;
  s += `${rect(1044, 276, 316, 492, "#F7F9F8", "none", 10)}${t(1076, 320, "查看详细企业背调报告", 16, "#1F2A24", 700)}${t(1076, 356, "预览 PDF", 12, "#69786F", 500)}`;
  s += languageSelect(1076, 390, "报告语言", "中文（简体）");
  s += `${t(1076, 488, "报告状态", 12, "#728178", 600)}${t(1076, 520, "已生成 · 2026-10-11", 14, "#26332C", 500)}${line(1076, 548, 1328, 548, "#E0E8E2")}${t(1076, 582, "可切换语言重新生成预览", 12, "#7A8981")}${rect(1076, 652, 252, 42, "#FFFFFF", "#CFD9D3", 7)}${icon("download", 1090, 663, 18, "#0A7A43")}${t(1120, 679, "下载当前语言报告", 13, "#0A7A43", 700)}`;
  s += `</svg>`;
  return s;
}

const files = {
  "01-report-card-default.svg": defaultState(),
  "02-report-card-confirm-dialog.svg": modalState(),
  "03-report-card-preview-language.svg": previewState(),
};
for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name), content, "utf8");

const overview = `${base("企业背调报告 · 交互状态总览", "三个可直接导入 Figma 的交互状态")}${rect(272, 188, 1120, 610, "#FFFFFF", "#D4DED8", 12)}${t(304, 228, "SVG 交互状态总览", 20, "#1F2A24", 700)}${t(304, 262, "请分别导入 01 / 02 / 03 文件作为三个 Figma Frame。", 13, "#69736E")}${rect(304, 302, 330, 176, "#F7F9F8", "#D7E2DB", 8)}${t(328, 340, "01 · 默认态", 14, "#0A7A43", 700)}${t(328, 372, "绿色主按钮，去掉按钮上方小字", 12, "#526259")}${rect(328, 406, 206, 36, "#0A7A43", "none", 6)}${t(431, 429, "查看详细企业背调报告", 12, "#FFFFFF", 700, "middle")}${rect(664, 302, 330, 176, "#F7F9F8", "#D7E2DB", 8)}${t(688, 340, "02 · 确认弹窗", 14, "#0A7A43", 700)}${t(688, 372, "提示消耗 1 次报告额度", 12, "#526259")}${rect(730, 402, 200, 44, "#FFFFFF", "#D7E2DB", 6)}${t(830, 429, "取消   确定", 12, "#26332C", 600, "middle")}${rect(1024, 302, 328, 176, "#F7F9F8", "#D7E2DB", 8)}${t(1048, 340, "03 · 预览 + 语言", 14, "#0A7A43", 700)}${t(1048, 372, "下方申请栏移除，右侧选择语言", 12, "#526259")}${rect(1048, 402, 166, 44, "#FFFFFF", "#0A7A43", 6, 2)}${t(1131, 429, "中文（简体）⌄", 12, "#26332C", 600, "middle")}${t(304, 552, "文件说明", 14, "#1F2A24", 700)}${t(304, 582, "01-report-card-default.svg  ·  默认企业信息卡片", 12, "#69786F")}${t(304, 610, "02-report-card-confirm-dialog.svg  ·  点击按钮后的确认弹窗", 12, "#69786F")}${t(304, 638, "03-report-card-preview-language.svg  ·  确认后的预览与语言选择", 12, "#69786F")}</svg>`;
fs.writeFileSync(path.join(outDir, "00-report-card-redesign-overview.svg"), overview, "utf8");

fs.writeFileSync(path.join(outDir, "README.md"), `# 企业背调报告卡片改版\n\n按状态分别导入 SVG：\n\n- 01-report-card-default.svg：默认态，绿色白字主按钮，已去掉按钮上方小字。\n- 02-report-card-confirm-dialog.svg：点击按钮后的额度确认弹窗。\n- 03-report-card-preview-language.svg：确认后的左侧 PDF 预览 + 右侧语言选择；已移除底部“申请企业背调报告”。\n- 00-report-card-redesign-overview.svg：总览页，可选。\n\n字体优先使用 Inter / Microsoft YaHei / PingFang SC，导入 Figma 后可按需要替换为项目字体。\n`, "utf8");

