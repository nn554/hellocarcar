import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("outputs/report-card-redesign");
const W = 2048;
const H = 1127;
const font = "Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif";
const esc = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const txt = (x, y, v, size = 14, fill = "#26332C", weight = 400, anchor = "start") => `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}">${esc(v)}</text>`;
const r = (x, y, w, h, fill, stroke = "none", rx = 8, sw = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const l = (x1, y1, x2, y2, stroke = "#DCE5DF", sw = 1) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"/>`;

function icon(name, x, y, size = 20, color = "#CBE6D3") {
  const p = {
    plus: '<path d="M12 5v14M5 12h14"/>', chat: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
    car: '<path d="M5 17h14M6 17l-2-5 2-5h12l2 5-2 5M7 12h10"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    ship: '<path d="M12 3v10M7 7h10v6M3 14l9-4 9 4c-1 4-4 7-9 7s-8-3-9-7z"/>', file: '<path d="M6 2h8l4 4v16H6zM14 2v5h5M9 12h6M9 16h6"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7M10 20h4"/>', scale: '<path d="M12 3v18M5 7h14M5 7l-3 7h6L5 7zm14 0-3 7h6l-3-7zM8 21h8"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4zM20 4h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5z"/>', settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1-2-4-2 1a7 7 0 0 0-2-1l-.3-2h-5L9 6a7 7 0 0 0-2 1L5 6l-2 4 2 1a7 7 0 0 0 0 2l-2 1 2 4 2-1a7 7 0 0 0 2 1l.5 2h5l.5-2a7 7 0 0 0 2-1l2 1 2-4-2-1a7 7 0 0 0 .1-1z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>', chevron: '<path d="m8 10 4 4 4-4"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>', download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"/>', refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L3 8m0-5v5h5M4 13a8 8 0 0 0 14.5 4.5L21 16m0 5v-5h-5"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p[name]}</g>`;
}

function shell() {
  let s = `${r(0, 0, W, H, "#F7F8FA", "none", 0)}${r(0, 0, 272, H, "#006233", "none", 0)}${txt(16, 51, "HelloCarCar", 31, "#FFFFFF", 800)}${r(16, 78, 242, 50, "#D9F0DF", "none", 7)}${icon("plus", 30, 91, 25, "#006233")}${txt(64, 110, "新对话", 16, "#006233", 700)}`;
  const nav = [["chat", "AI 工作台", 169], ["car", "车辆报价", 214], ["ship", "海运报价", 259], ["file", "报告", 304], ["bell", "通知", 349]];
  nav.forEach(([ic, label, y], i) => { if (i === 0) s += r(14, y - 30, 244, 40, "#177447", "none", 7); s += icon(ic, 27, y - 22, 21, i === 0 ? "#E9F7EC" : "#C9E7D3") + txt(65, y - 5, label, 15, i === 0 ? "#FFFFFF" : "#DDEFE3", i === 0 ? 700 : 400); });
  s += txt(28, 387, "服务", 11, "#BFE2CA", 700) + icon("scale", 27, 410, 21) + txt(65, 426, "交付纠纷", 14, "#DDEFE3") + icon("car", 27, 456, 21) + txt(65, 472, "配货表", 14, "#DDEFE3") + icon("book", 27, 502, 21) + txt(65, 518, "政策咨询", 14, "#DDEFE3") + l(24, 548, 248, 548, "#408961");
  s += txt(28, 579, "最近对话", 11, "#BFE2CA", 700); ["请查询今日利姆越 FOB 价格。", "JETOUR", "gs3", "大众探戈报价", "大众探戈", "请帮我核查 NBSauto 的公开信"].forEach((v, i) => s += txt(28, 615 + i * 38, v, 13, "#D5E8DC"));
  s += txt(28, 934, "查看全部历史", 14, "#DDEFE3") + icon("arrow", 222, 913, 20) + icon("settings", 27, 980, 21) + txt(65, 996, "账户设置", 14, "#DDEFE3") + r(20, 1048, 232, 1, "#408961", "none", 0) + `<circle cx="45" cy="1080" r="20" fill="#177447"/>${txt(45, 1086, "J", 14, "#FFFFFF", 700, "middle")}${txt(79, 1077, "jiayihu346@gmail.com", 12, "#FFFFFF", 600)}${txt(79, 1096, "高级会员", 10, "#CFE8D7")}`;
  s += `${r(272, 0, W - 272, 76, "#FFFFFF", "none", 0)}${l(272, 75, W, 75)}${txt(320, 46, "AI 工作台", 16, "#202824", 700)}${txt(1590, 46, "Hellocarcar AI 已启用", 14, "#69736E")}${icon("globe", 1752, 27, 19, "#69736E")}${txt(1782, 46, "中文", 14, "#202824", 600)}${icon("chevron", 1870, 31, 17, "#69736E")}${icon("bell", 1920, 27, 19, "#69736E")}${r(1968, 19, 36, 36, "#E9F4EC", "none", 18)}${txt(1986, 43, "J", 14, "#087545", 700, "middle")}`;
  return s;
}

function base(title, subtitle) { return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${esc(title)}</title>${shell()}${txt(498, 168, title, 26, "#202824", 700)}${txt(498, 198, subtitle, 14, "#69736E")}`; }

function row(x, y, label, value, w = 420) { return `${txt(x, y, label, 13, "#839087", 600)}${txt(x, y + 30, value, 16, "#26332C", 500)}${l(x, y + 52, x + w, y + 52, "#E5EBE7")}`; }
function card() {
  let s = `${r(498, 349, 914, 464, "#FFFFFF", "#919A95", 12, 1.4)}${txt(522, 397, "河南新蓝海科技有限公司", 21, "#1F2A24", 700)}${txt(1388, 397, "企业基本信息", 14, "#69736E", 500, "end")}${l(522, 422, 1388, 422, "#88938D", 1.1)}`;
  s += row(522, 456, "企业名称", "河南新蓝海科技有限公司", 420) + row(965, 456, "登记状态", "存续", 420) + row(522, 532, "法定代表人", "马闯", 420) + row(965, 532, "注册资本", "100万元", 420) + row(522, 608, "实缴资本", "100万元", 420) + row(965, 608, "成立日期", "2024-11-22", 420) + row(522, 684, "统一社会信用代码", "91410105MAE65C7Y0D", 420) + row(965, 684, "企业地址", "河南省郑州市市辖区郑东新区康平路9号15号楼", 420);
  s += `${r(522, 726, 258, 44, "#0A7A43", "none", 7)}${txt(651, 754, "查看详细企业背调报告", 14, "#FFFFFF", 700, "middle")}`;
  return s;
}

const defaultSvg = `${base("企业背调报告", "先查看企业基础信息，再按需生成完整背调报告")}${card()}${txt(498, 862, "导出本条回复", 13, "#087545", 600)}${txt(616, 862, "多选导出", 13, "#087545", 600)}${r(702, 936, 916, 145, "#FFFFFF", "#D7E2DB", 10)}${txt(726, 980, "描述您想了解的企业、车辆、航线或问题", 15, "#9AA79F")}${txt(726, 1050, "Hellocarcar AI", 12, "#087545", 700)}${r(1560, 1018, 42, 42, "#9CCCB0", "none", 9)}${icon("arrow", 1568, 1027, 22, "#FFFFFF")}</svg>`;

const dialogSvg = `${base("企业背调报告", "先查看企业基础信息，再按需生成完整背调报告")}${card()}<rect x="272" y="76" width="1776" height="1051" fill="#10261B" fill-opacity="0.22"/>${r(780, 400, 488, 300, "#FFFFFF", "none", 16)}${r(824, 440, 34, 34, "#E4F3E9", "none", 9)}${icon("file", 831, 447, 20, "#0A7A43")}${txt(876, 462, "确认查看详细企业背调报告", 18, "#1F2A24", 700)}${icon("close", 1208, 430, 19, "#7A8981")}${txt(824, 518, "查看详细企业背调报告", 15, "#4B5A52", 500)}${txt(824, 548, "将消耗 1 次报告额度", 17, "#0A7A43", 700)}${txt(824, 580, "确认后可选择报告语言并进入预览。", 13, "#7A8981")}${l(824, 610, 1224, 610, "#E4EBE6")}${r(893, 636, 116, 42, "#FFFFFF", "#CFD9D3", 7)}${txt(951, 663, "取消", 14, "#4B5A52", 600, "middle")}${r(1021, 636, 134, 42, "#0A7A43", "none", 7)}${txt(1088, 663, "确定", 14, "#FFFFFF", 700, "middle")}</svg>`;

const previewSvg = `${base("企业背调报告", "完整报告已生成，可在右侧选择语言并查看预览")}${r(498, 349, 1120, 624, "#FFFFFF", "#D4DED8", 12)}${txt(526, 392, "河南新蓝海科技有限公司", 21, "#1F2A24", 700)}${r(1488, 367, 102, 40, "#FFFFFF", "#D4DED8", 7)}${txt(1539, 393, "上一步", 14, "#425249", 600, "middle")}${l(526, 418, 1590, 418, "#BFCBC4", 1.1)}${r(526, 444, 718, 492, "#EEF2F0", "none", 10)}${txt(885, 520, "PDF 预览", 15, "#A0ACA5", 600, "middle")}${r(680, 552, 410, 310, "#FFFFFF", "#D7E2DB", 4)}${txt(712, 626, "企业背调报告", 22, "#1F2A24", 700)}${txt(712, 658, "河南新蓝海科技有限公司", 13, "#54645A")}${l(712, 682, 1058, 682, "#DDE6E0")}${txt(712, 722, "企业基本信息 · 风险概览 · 经营状态", 11, "#7A8981")}${txt(712, 815, "Hellocarcar AI 生成预览", 10, "#A0ACA5")}${r(1272, 444, 318, 492, "#F7F9F8", "none", 10)}${txt(1304, 490, "查看详细企业背调报告", 17, "#1F2A24", 700)}${txt(1304, 526, "预览 PDF", 13, "#69786F")}${txt(1304, 565, "报告语言", 13, "#728178", 600)}${r(1304, 580, 254, 48, "#FFFFFF", "#0A7A43", 8, 2)}${txt(1320, 611, "中文（简体）", 14, "#26332C", 500)}${icon("chevron", 1518, 595, 18, "#5E6E64")}${txt(1304, 672, "报告状态", 13, "#728178", 600)}${txt(1304, 706, "已生成 · 2026-10-11", 14, "#26332C")}${l(1304, 735, 1558, 735, "#E0E8E2")}${txt(1304, 772, "可切换语言重新生成预览", 12, "#7A8981")}${r(1304, 852, 254, 42, "#FFFFFF", "#CFD9D3", 7)}${icon("download", 1318, 863, 18, "#0A7A43")}${txt(1348, 879, "下载当前语言报告", 13, "#0A7A43", 700)}</svg>`;

const finalPreviewSvg = `${base("企业背调报告", "报告已生成，可预览或下载 PDF")}${r(498, 349, 1120, 624, "#FFFFFF", "#D4DED8", 12)}${txt(526, 392, "河南新蓝海科技有限公司", 21, "#1F2A24", 700)}${r(1488, 367, 102, 40, "#FFFFFF", "#D4DED8", 7)}${txt(1539, 393, "上一步", 14, "#425249", 600, "middle")}${l(526, 418, 1590, 418, "#BFCBC4", 1.1)}${r(526, 444, 718, 492, "#EEF2F0", "none", 10)}${r(680, 462, 410, 452, "#FFFFFF", "#D7E2DB", 4)}${r(712, 492, 348, 9, "#D6E4DB", "none", 3)}${txt(712, 550, "企业背调报告", 22, "#1F2A24", 700)}${txt(712, 582, "河南新蓝海科技有限公司", 13, "#54645A")}${l(712, 610, 1058, 610, "#DDE6E0")}${txt(712, 650, "企业基本信息 · 风险概览 · 经营状态", 11, "#7A8981")}${txt(712, 850, "Hellocarcar AI 生成预览", 10, "#A0ACA5")}${txt(885, 918, "PDF 预览", 14, "#A0ACA5", 600, "middle")}${r(1272, 444, 318, 492, "#F7F9F8", "none", 10)}${txt(1304, 490, "查看详细企业背调报告", 17, "#1F2A24", 700)}${txt(1304, 526, "预览 PDF", 13, "#69786F")}${txt(1304, 565, "报告语言", 13, "#728178", 600)}${r(1304, 580, 254, 48, "#FFFFFF", "#0A7A43", 8, 2)}${txt(1320, 611, "中文（简体）", 14, "#26332C", 500)}${icon("chevron", 1518, 595, 18, "#5E6E64")}${txt(1304, 672, "已交付", 14, "#26332C", 600)}${txt(1304, 708, "2026-10-11", 14, "#26332C")}${txt(1304, 742, "2026-11-11", 14, "#26332C")}${l(1304, 758, 1558, 758, "#E0E8E2")}${txt(1304, 790, "剩余报告次数：", 13, "#728178", 600)}${txt(1414, 796, "3 次", 22, "#0A7A43", 800)}${icon("refresh", 1490, 775, 16, "#0A7A43")}${txt(1512, 788, "刷新", 12, "#0A7A43", 700)}${r(1304, 842, 254, 38, "#0A7A43", "none", 8)}${icon("file", 1320, 852, 18, "#FFFFFF")}${txt(1350, 866, "预览 PDF", 13, "#FFFFFF", 700)}${r(1304, 890, 254, 38, "#FFFFFF", "#0A7A43", 8, 1.4)}${icon("download", 1320, 900, 18, "#0A7A43")}${txt(1350, 914, "下载 PDF", 13, "#0A7A43", 700)}</svg>`;

const finalPreviewSvgAdjusted = finalPreviewSvg.replace('>3 次</text>', '>3</text><text x="1436" y="790" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="13" fill="#728178" font-weight="600">次</text>');

const pendingSvg = `${base("企业背调报告", "报告正在生成，请稍候")}${r(498, 349, 1120, 624, "#FFFFFF", "#D4DED8", 12)}${txt(526, 392, "河南新蓝海科技有限公司", 21, "#1F2A24", 700)}${r(1488, 367, 102, 40, "#FFFFFF", "#D4DED8", 7)}${txt(1539, 393, "上一步", 14, "#425249", 600, "middle")}${l(526, 418, 1590, 418, "#BFCBC4", 1.1)}${r(526, 444, 718, 492, "#EEF2F0", "none", 10)}${txt(885, 575, "报告生成中", 20, "#26332C", 700, "middle")}${txt(885, 612, "正在整理企业公开信息与风险数据", 14, "#69786F", 400, "middle")}${r(738, 650, 294, 8, "#DDE9E1", "none", 4)}${r(738, 650, 188, 8, "#0A7A43", "none", 4)}${txt(885, 683, "64%", 13, "#0A7A43", 700, "middle")}${txt(885, 716, "预计还需 1-2 分钟", 12, "#8B9890", 400, "middle")}${txt(885, 788, "生成完成后将在此处显示 PDF 预览", 11, "#A0ACA5", 400, "middle")}${r(1272, 444, 318, 492, "#F7F9F8", "none", 10)}${txt(1304, 490, "查看详细企业背调报告", 17, "#1F2A24", 700)}${txt(1304, 526, "预览 PDF", 13, "#69786F")}${txt(1304, 565, "报告语言", 13, "#728178", 600)}${r(1304, 580, 254, 48, "#FFFFFF", "#0A7A43", 8, 2)}${txt(1320, 611, "中文（简体）", 14, "#26332C", 500)}${icon("chevron", 1518, 595, 18, "#5E6E64")}${txt(1304, 672, "报告状态", 13, "#728178", 600)}${txt(1304, 706, "生成中 · 64%", 14, "#0A7A43", 600)}${l(1304, 735, 1558, 735, "#E0E8E2")}${txt(1304, 772, "报告完成后可下载 PDF", 12, "#7A8981")}${r(1304, 852, 254, 42, "#EEF2F0", "none", 7)}${icon("download", 1318, 863, 18, "#A5B3AA")}${txt(1348, 879, "等待生成完成", 13, "#A5B3AA", 700)}</svg>`;

for (const [name, content] of Object.entries({
  "01-report-card-default-fit-2048.svg": defaultSvg,
  "02-report-card-confirm-dialog-fit-2048.svg": dialogSvg,
  "03-report-card-preview-language-fit-2048.svg": finalPreviewSvgAdjusted,
  "03-report-card-final-delivered-fit-2048.svg": finalPreviewSvgAdjusted,
  "03-report-card-pending-progress-fit-2048.svg": pendingSvg,
})) fs.writeFileSync(path.join(dir, name), content, "utf8");

fs.writeFileSync(path.join(dir, "FIT-README.md"), `# 按现有 Figma 页面尺寸适配的版本\n\n截图对应的页面画布约为 2048×1127，企业信息卡片边界约为 x=498、y=349、宽=914、高=464。\n\n- 01-report-card-default-fit-2048.svg：默认态\n- 02-report-card-confirm-dialog-fit-2048.svg：额度确认弹窗\n- 03-report-card-preview-language-fit-2048.svg：预览 + 语言选择\n- 03-report-card-pending-progress-fit-2048.svg：报告尚未生成时的进度条状态\n\n这四个文件已经包含页面外壳，可直接作为新的 Figma Frame 导入，不需要再次整体缩放。\n`, "utf8");

