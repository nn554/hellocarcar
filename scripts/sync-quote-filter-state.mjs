import fs from "node:fs";

const desktop = "apps/web/public/homepage/figma/vehicle-quote-desktop.svg";
let svg = fs.readFileSync(desktop, "utf8");
svg = svg.replace("33 个品牌", "16 个品牌");
svg = svg.replace(
  '<g id="Brand-吉利"><rect x="272" y="246" width="148" height="58" rx="6" fill="#FFFFFF" stroke="#DDE5E1"/>',
  '<g id="Brand-吉利"><rect x="272" y="246" width="148" height="58" rx="6" fill="#EAF6EE" stroke="#78B991"/><rect x="272" y="246" width="3" height="58" rx="1.5" fill="#087545"/>'
);
svg = svg.replace('x="331" y="281" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="12" fill="#26342D" font-weight="600"', 'x="331" y="281" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="12" fill="#087545" font-weight="700"');
svg = svg.replace('<rect x="912" y="382" width="148" height="58" rx="6" fill="#EAF6EE" stroke="#78B991"/><rect x="912" y="382" width="3" height="58" rx="1.5" fill="#087545"/>', '<rect x="912" y="382" width="148" height="58" rx="6" fill="#FFFFFF" stroke="#DDE5E1"/>');
svg = svg.replace('x="971" y="417" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="12" fill="#087545" font-weight="700"', 'x="971" y="417" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="12" fill="#26342D" font-weight="600"');
svg = svg.replace('x="326" y="633" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="18" fill="#202824" font-weight="700" text-anchor="start" letter-spacing="0">比亚迪', 'x="326" y="633" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="18" fill="#202824" font-weight="700" text-anchor="start" letter-spacing="0">吉利');
svg = svg.replace("已展开 38 条配置报价", "已展开 35 条配置报价");
fs.writeFileSync(desktop, svg);

const mobile = "apps/web/public/homepage/figma/vehicle-quote-mobile.svg";
svg = fs.readFileSync(mobile, "utf8");
svg = svg.replace("33 个", "16 个");
svg = svg.replace('<g id="Brand-mobile-吉利"><rect x="20" y="271" width="62" height="57" rx="6" fill="#FFFFFF" stroke="#E0E7E3"/>', '<g id="Brand-mobile-吉利"><rect x="20" y="271" width="62" height="57" rx="6" fill="#EAF6EE" stroke="#78B991"/>');
svg = svg.replace('x="51" y="319" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="9" fill="#34423B" font-weight="600"', 'x="51" y="319" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="9" fill="#087545" font-weight="700"');
svg = svg.replace('<rect x="236" y="466" width="62" height="57" rx="6" fill="#EAF6EE" stroke="#78B991"/>', '<rect x="236" y="466" width="62" height="57" rx="6" fill="#FFFFFF" stroke="#E0E7E3"/>');
svg = svg.replace('x="267" y="514" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="9" fill="#087545" font-weight="700"', 'x="267" y="514" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="9" fill="#34423B" font-weight="600"');
svg = svg.replace('x="68" y="773" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="16" fill="#202824" font-weight="700" text-anchor="start" letter-spacing="0">比亚迪', 'x="68" y="773" font-family="Inter, Microsoft YaHei, PingFang SC, Arial, sans-serif" font-size="16" fill="#202824" font-weight="700" text-anchor="start" letter-spacing="0">吉利');
svg = svg.replace("38 条配置报价", "35 条配置报价");
fs.writeFileSync(mobile, svg);
