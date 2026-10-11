"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import "./public-homepage.css";

type Feature = "ai" | "vehicles" | "shipping" | "config" | "reports" | "dispute" | "policy";
type Locale = "zh" | "en" | "fr" | "ar";
type IconName = Feature | "arrow" | "globe" | "check" | "play" | "plus" | "menu" | "close" | "shield" | "policy" | "history" | "subscription" | "settings" | "dispute";
type FeatureCopy = { id: Feature; label: string; title: string; description: string; detail: string };

const PLATFORM_URL = "https://hellocarcar.cn";

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    ai: <><path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z" /><path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6Z" /></>,
    vehicles: <><path d="m4 10 2-5h12l2 5M3 10h18v8H3zM5 18v3m14-3v3M7 14h1m8 0h1" /></>,
    shipping: <><path d="M9 4h6v5M6 9h12v5l3 2-9 5-9-5 3-2ZM12 9v12M3 22l3-1 3 1 3-1 3 1 3-1 3 1" /></>,
    config: <><path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7" /></>,
    reports: <><path d="M5 3h14v18H5zM9 7h6M9 12h6M9 16h4" /><path d="m16 17 1 1 3-3" /></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    play: <path d="m9 5 11 7-11 7Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" /><path d="m8 12 3 3 5-6" /></>,
    policy: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23Z" /><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23Z" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    subscription: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    dispute: <><path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7ZM17 7l-4 7h8l-4-7ZM7 21h10" /></>
  };
  return <svg className={`hc-icon ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const features: FeatureCopy[] = [
  { id: "ai", label: "AI 工作伙伴", title: "复杂的采购问题，\n从一句话开始。", description: "把需求交给 Hellocarcar AI，让报价、配置、运输与采购信息，在一个工作区里有条理地展开。", detail: "自然语言提问 · 保存对话 · 服务快捷入口" },
  { id: "vehicles", label: "车辆报价", title: "选对车型，\n也看懂每一份报价。", description: "从品牌、车型到具体配置，集中查看 FOB 报价、交付地点与记录日期，为采购比较提供清晰依据。", detail: "品牌筛选 · 配置对比 · 报价查询" },
  { id: "shipping", label: "海运运价", title: "从中国港口，\n到你的目的地。", description: "填写起运港、目的港、出运日期与柜型，查询适合这次采购的运输方案。", detail: "航线查询 · 柜型选择 · 运价参考" },
  { id: "config", label: "车型配置表", title: "车型的每个细节，\n沟通起来更简单。", description: "按品牌和车型查询配置，选择需要的语言，用一份清楚的配置表与客户沟通。", detail: "品牌与车型选择 · 多语言 · PDF 预览" },
  { id: "reports", label: "企业调查报告", title: "采购之前，\n先把企业查清楚。", description: "核验目标企业的主体信息、经营状况、公开风险与历史争议，让采购前多一次调查，降低交易风险。", detail: "企业核验 · 风险线索 · 调查报告" },
  { id: "dispute", label: "交付纠纷", title: "交付有争议，\n处理路径更清晰。", description: "了解纠纷受理范围、准备所需材料，并查看从资料审核到处理反馈的完整流程。", detail: "纠纷线索 · 材料清单 · 处理进度" },
  { id: "policy", label: "政策资讯", title: "政策有变化，\n及时看懂重点。", description: "汇总阿尔及利亚汽车进口、税费、合规与清关政策，用易读摘要说明对采购的影响。", detail: "官方来源 · 生效日期 · 中文解读" }
];

const translatedFeatures: Record<Exclude<Locale, "zh">, FeatureCopy[]> = {
  en: [
    { id: "ai", label: "AI Workspace", title: "Complex purchasing,\nstarts with one question.", description: "Ask HelloCarCar AI to organize quotes, specifications, shipping and purchasing information in one workspace.", detail: "Natural-language questions · Saved chats · Service shortcuts" },
    { id: "vehicles", label: "Vehicle Quotes", title: "Choose the right model,\nand understand every quote.", description: "Compare models, configurations, FOB quotes, delivery locations and record dates in one place.", detail: "Brand filters · Configuration comparison · Quote search" },
    { id: "shipping", label: "Ocean Freight", title: "From a Chinese port,\nto your destination.", description: "Enter the ports, shipping date and container type to find a suitable route for your purchase.", detail: "Route search · Container selection · Freight reference" },
    { id: "config", label: "Specification Sheets", title: "Make every specification\easy to communicate.", description: "Search by brand and model, select a language and preview a clear vehicle specification sheet.", detail: "Brand and model · Multiple languages · PDF preview" },
    { id: "reports", label: "Company Due Diligence", title: "Before purchasing,\nknow the company first.", description: "Verify company identity, operations, public risks and past disputes before purchasing to reduce transaction risk.", detail: "Company verification · Risk signals · Investigation report" },
    { id: "dispute", label: "Delivery Disputes", title: "When delivery goes wrong,\nsee a clearer path forward.", description: "Submit cross-border delivery dispute information and follow the review and handling process.", detail: "Dispute leads · Evidence checklist · Case progress" },
    { id: "policy", label: "Policy Updates", title: "When policies change,\nunderstand what matters.", description: "Follow vehicle import, tax, compliance and customs updates across destination markets.", detail: "Official sources · Effective dates · Plain-language notes" }
  ],
  fr: [
    { id: "ai", label: "Espace IA", title: "Un achat complexe\ncommence par une question.", description: "Confiez vos devis, configurations, transports et informations d’achat à HelloCarCar AI dans un seul espace.", detail: "Questions naturelles · Conversations enregistrées · Accès rapide" },
    { id: "vehicles", label: "Devis véhicules", title: "Choisissez le bon modèle\net comprenez chaque devis.", description: "Comparez modèles, configurations, prix FOB, lieux de livraison et dates d’enregistrement.", detail: "Filtres marques · Comparaison · Recherche de devis" },
    { id: "shipping", label: "Fret maritime", title: "D’un port chinois\nà votre destination.", description: "Indiquez les ports, la date et le type de conteneur pour trouver une solution adaptée.", detail: "Recherche d’itinéraire · Conteneur · Tarif indicatif" },
    { id: "config", label: "Fiches techniques", title: "Des configurations\nfaciles à partager.", description: "Recherchez par marque et modèle, choisissez la langue et prévisualisez une fiche claire.", detail: "Marque et modèle · Multilingue · Aperçu PDF" },
    { id: "reports", label: "Enquête entreprise", title: "Avant l’achat,\nvérifiez l’entreprise.", description: "Vérifiez l’identité, l’activité, les risques publics et les litiges passés afin de réduire le risque de transaction.", detail: "Vérification · Signaux de risque · Rapport d’enquête" },
    { id: "dispute", label: "Litiges de livraison", title: "En cas de litige,\nune voie plus claire.", description: "Signalez un litige de livraison transfrontalière et suivez son traitement.", detail: "Signalement · Pièces requises · Suivi du dossier" },
    { id: "policy", label: "Actualités réglementaires", title: "Quand les règles changent,\ncomprenez l’essentiel.", description: "Suivez les règles d’importation, taxes, conformité et douanes sur plusieurs marchés.", detail: "Sources officielles · Dates d’effet · Résumés clairs" }
  ],
  ar: [
    { id: "ai", label: "مساحة عمل الذكاء الاصطناعي", title: "المشتريات المعقدة\nتبدأ بسؤال واحد.", description: "اجمع عروض الأسعار والمواصفات والشحن ومعلومات الشراء مع HelloCarCar AI في مساحة واحدة.", detail: "أسئلة طبيعية · محادثات محفوظة · وصول سريع للخدمات" },
    { id: "vehicles", label: "عروض أسعار المركبات", title: "اختر الطراز المناسب\nوافهم كل عرض سعر.", description: "قارن الطرازات والمواصفات وأسعار FOB ومواقع التسليم وتواريخ التسجيل.", detail: "تصفية العلامات · مقارنة المواصفات · بحث الأسعار" },
    { id: "shipping", label: "الشحن البحري", title: "من ميناء صيني\nإلى وجهتك.", description: "أدخل الموانئ وتاريخ الشحن ونوع الحاوية للعثور على المسار المناسب.", detail: "بحث المسار · اختيار الحاوية · سعر استرشادي" },
    { id: "config", label: "جداول المواصفات", title: "مواصفات واضحة\nوسهلة المشاركة.", description: "ابحث حسب العلامة والطراز واختر اللغة ثم عاين جدول مواصفات واضحاً.", detail: "العلامة والطراز · لغات متعددة · معاينة PDF" },
    { id: "reports", label: "تقرير التحقق من الشركات", title: "قبل الشراء،\nتحقق من الشركة.", description: "تحقق من هوية الشركة ونشاطها والمخاطر العامة والنزاعات السابقة لتقليل مخاطر الصفقة.", detail: "التحقق من الشركة · مؤشرات المخاطر · تقرير التحقيق" },
    { id: "dispute", label: "نزاعات التسليم", title: "عند حدوث نزاع،\nاعرف المسار التالي.", description: "أرسل معلومات نزاع التسليم عبر الحدود وتابع إجراءات المراجعة والمعالجة.", detail: "بلاغ النزاع · قائمة الأدلة · تقدم القضية" },
    { id: "policy", label: "مستجدات السياسات", title: "عندما تتغير السياسات،\nافهم ما يهم.", description: "تابع قواعد استيراد المركبات والضرائب والامتثال والجمارك في أسواق متعددة.", detail: "مصادر رسمية · تواريخ النفاذ · شرح مبسط" }
  ]
};

const getFeatures = (locale: Locale) => locale === "zh" ? features : translatedFeatures[locale];

const pageCopy = {
  zh: {
    nav: ["产品功能", "专属服务", "会员方案"], login: "登录", enter: "进入工作区", language: "选择网站语言",
    kicker: "你的汽车出口 AI 工作伙伴", heroTitle: ["HelloCarCar", "能帮你做什么"], heroText: ["看配置、查价、调查供应商、找航线。", "从一个问题，到一个清晰的采购决定。"], start: "开始使用 HelloCarCar", demo: "看看它能做什么", notes: ["在线工作区", "多语言支持", "多国市场"],
    productTitle: "采购的每一步，都有好帮手。", productText: "把分散的信息，变成清晰的下一步。", questionTitle: ["不用想得很复杂。", "先问一个问题。"], questionPlaceholder: "告诉我，你想了解什么车型或采购需求？", questionLogin: "登录工作区后开始咨询", prompts: ["如何比较车型报价？", "南沙到阿尔及尔的海运", "查看车型配置表"],
    servicesTitle: "有些事，值得多一份支持。", servicesText: "除了信息查询，也为真实的采购问题提供服务入口。", services: [
      ["中国采购代理", "从采购需求开始沟通。单台车辆，也可以咨询代理服务。", "进入工作区咨询"],
      ["交付纠纷处理", "处理跨境交付纠纷，展示有风险记录的中国汽车供应商。", "查看处理内容"],
      ["政策资讯", "围绕目的地市场，了解汽车采购与进口相关的政策信息。", "查看政策内容"]
    ],
    membershipTitle: ["从一次尝试，", "到你的日常工作伙伴。"], membershipText: ["先了解，再选择。", "找到适合你的采购节奏。"], monthly: "月付", annual: "年付", workspace: "在线工作区", allInOne: "一站式", workspaceText: "把采购信息集中到同一个地方", workspaceBenefits: ["企业、车辆与海运查询入口", "中文、英语、法语与阿拉伯语", "政策资讯与采购服务入口"], pro: "专业会员", proBadge: "持续采购之选", monthlyText: "按月订阅，按所选周期续费", annualText: "按年订阅，权益额度按月补充", proBenefits: ["企业、车辆与海运查询服务", "每月 5 份企业调查报告", "每月 1 份重点风险复核"], benefits: "查看会员权益", footnote: "USD · 价格与付款方式以平台结算页为准",
    cta: ["下一次采购，", "从 HelloCarCar 开始。"], open: "打开我的工作区", footerTagline: "让汽车采购，更清楚一点。", footerLinks: ["产品功能", "专属服务", "会员方案", "English website ↗"], disclaimer: "报价与政策信息仅作采购参考，交易前请独立核验。", account: "我的账户",
    dialogTitle: "你好，欢迎来到 HelloCarCar。", dialogText: "登录后，在工作区继续你的采购咨询。", dialogQuestion: "你想了解：", dialogHint: "进入工作区后，可复制此问题开始咨询。", dialogWorkspace: "进入中文工作区", dialogLogin: "登录 / 注册", dialogBenefits: "查看会员权益", dialogSupport: "平台支持中文、英语、法语与阿拉伯语"
  },
  en: {
    nav: ["Product", "Services", "Membership"], login: "Log in", enter: "Open workspace", language: "Choose language",
    kicker: "Your AI partner for vehicle exports", heroTitle: ["What can", "HelloCarCar do for you?"], heroText: ["Compare specifications and prices, investigate suppliers and find shipping routes.", "Turn one question into a clear purchasing decision."], start: "Start with HelloCarCar", demo: "See what it can do", notes: ["Online workspace", "Multilingual", "Multiple markets"],
    productTitle: "Support for every step of purchasing.", productText: "Turn scattered information into a clear next step.", questionTitle: ["It does not have to be complicated.", "Start with one question."], questionPlaceholder: "Tell us which vehicle or purchasing need you want to explore.", questionLogin: "Log in to start a consultation", prompts: ["How do I compare quotes?", "Nansha to Algiers freight", "View specification sheets"],
    servicesTitle: "Some decisions deserve more support.", servicesText: "Beyond information, get practical support for real purchasing issues.", services: [["China purchasing agent", "Discuss your purchasing needs, including support for a single vehicle.", "Ask in workspace"], ["Delivery dispute support", "Handle cross-border delivery disputes and identify Chinese vehicle suppliers with risk records.", "View dispute support"], ["Policy updates", "Understand vehicle purchasing and import policies across destination markets.", "View policy updates"]],
    membershipTitle: ["From a first try", "to your daily work partner."], membershipText: ["Understand first, then choose.", "Find a rhythm that fits your purchasing."], monthly: "Monthly", annual: "Annual", workspace: "Online workspace", allInOne: "All in one", workspaceText: "Keep purchasing information in one place", workspaceBenefits: ["Company, vehicle and freight search", "Chinese, English, French and Arabic", "Policy and purchasing service access"], pro: "Professional", proBadge: "For ongoing purchasing", monthlyText: "Monthly subscription, renewed by billing cycle", annualText: "Annual subscription with monthly allowances", proBenefits: ["Company, vehicle and freight services", "5 company due-diligence reports per month", "1 focused risk review per month"], benefits: "View membership", footnote: "USD · Final pricing and payment methods are shown at checkout",
    cta: ["Your next purchase", "starts with HelloCarCar."], open: "Open my workspace", footerTagline: "Make vehicle purchasing clearer.", footerLinks: ["Product", "Services", "Membership", "English website ↗"], disclaimer: "Quotes and policy information are for reference. Verify independently before trading.", account: "My account",
    dialogTitle: "Welcome to HelloCarCar.", dialogText: "Log in to continue your purchasing consultation.", dialogQuestion: "Your question: ", dialogHint: "Copy this question into the workspace after logging in.", dialogWorkspace: "Open workspace", dialogLogin: "Log in / Register", dialogBenefits: "View membership", dialogSupport: "Available in Chinese, English, French and Arabic"
  },
  fr: {
    nav: ["Produit", "Services", "Abonnement"], login: "Connexion", enter: "Ouvrir l’espace", language: "Choisir la langue",
    kicker: "Votre partenaire IA pour l’export automobile", heroTitle: ["Que peut faire", "HelloCarCar pour vous ?"], heroText: ["Comparez configurations et prix, enquêtez sur les fournisseurs et trouvez des itinéraires.", "D’une question à une décision d’achat claire."], start: "Commencer avec HelloCarCar", demo: "Découvrir les fonctions", notes: ["Espace en ligne", "Multilingue", "Plusieurs marchés"],
    productTitle: "Un soutien à chaque étape de l’achat.", productText: "Transformez des informations dispersées en prochaine étape claire.", questionTitle: ["Pas besoin de compliquer.", "Commencez par une question."], questionPlaceholder: "Indiquez le véhicule ou le besoin d’achat à étudier.", questionLogin: "Connectez-vous pour commencer", prompts: ["Comparer les devis", "Fret Nansha–Alger", "Voir les fiches techniques"],
    servicesTitle: "Certaines décisions méritent plus de soutien.", servicesText: "Au-delà de l’information, obtenez un accompagnement concret.", services: [["Agent d’achat en Chine", "Discutez de vos besoins, y compris pour un seul véhicule.", "Consulter dans l’espace"], ["Litiges de livraison", "Traitez les litiges transfrontaliers et identifiez les fournisseurs chinois présentant des risques.", "Voir l’assistance"], ["Actualités réglementaires", "Comprenez les règles d’achat et d’importation sur vos marchés de destination.", "Voir les actualités"]],
    membershipTitle: ["D’un premier essai", "à votre partenaire quotidien."], membershipText: ["Comprenez avant de choisir.", "Trouvez le rythme adapté à vos achats."], monthly: "Mensuel", annual: "Annuel", workspace: "Espace en ligne", allInOne: "Tout-en-un", workspaceText: "Centralisez vos informations d’achat", workspaceBenefits: ["Recherche entreprise, véhicule et fret", "Chinois, anglais, français et arabe", "Accès aux politiques et services"], pro: "Professionnel", proBadge: "Pour les achats réguliers", monthlyText: "Abonnement mensuel renouvelé par période", annualText: "Abonnement annuel, crédits mensuels", proBenefits: ["Services entreprise, véhicule et fret", "5 rapports d’enquête par mois", "1 vérification de risque ciblée par mois"], benefits: "Voir les avantages", footnote: "USD · Prix final et paiement affichés lors du règlement",
    cta: ["Votre prochain achat", "commence avec HelloCarCar."], open: "Ouvrir mon espace", footerTagline: "Rendre l’achat automobile plus clair.", footerLinks: ["Produit", "Services", "Abonnement", "Site anglais ↗"], disclaimer: "Les devis et politiques sont indicatifs. Vérifiez avant toute transaction.", account: "Mon compte",
    dialogTitle: "Bienvenue sur HelloCarCar.", dialogText: "Connectez-vous pour poursuivre votre consultation.", dialogQuestion: "Votre question : ", dialogHint: "Copiez cette question dans l’espace après connexion.", dialogWorkspace: "Ouvrir l’espace", dialogLogin: "Connexion / Inscription", dialogBenefits: "Voir l’abonnement", dialogSupport: "Disponible en chinois, anglais, français et arabe"
  },
  ar: {
    nav: ["المنتج", "الخدمات", "العضوية"], login: "تسجيل الدخول", enter: "فتح مساحة العمل", language: "اختر اللغة",
    kicker: "شريكك الذكي لتصدير السيارات", heroTitle: ["كيف تساعدك", "HelloCarCar؟"], heroText: ["قارن المواصفات والأسعار، وتحقق من الموردين، واعثر على مسارات الشحن.", "من سؤال واحد إلى قرار شراء واضح."], start: "ابدأ مع HelloCarCar", demo: "اكتشف ما يمكنها فعله", notes: ["مساحة عمل عبر الإنترنت", "متعدد اللغات", "أسواق متعددة"],
    productTitle: "دعم في كل خطوة من خطوات الشراء.", productText: "حوّل المعلومات المتفرقة إلى خطوة تالية واضحة.", questionTitle: ["لا داعي للتعقيد.", "ابدأ بسؤال واحد."], questionPlaceholder: "أخبرنا عن المركبة أو احتياج الشراء الذي تريد بحثه.", questionLogin: "سجّل الدخول لبدء الاستشارة", prompts: ["كيف أقارن عروض الأسعار؟", "الشحن من نانشا إلى الجزائر", "عرض جداول المواصفات"],
    servicesTitle: "بعض القرارات تستحق دعماً إضافياً.", servicesText: "إلى جانب المعلومات، احصل على دعم عملي لمشكلات الشراء الحقيقية.", services: [["وكيل شراء في الصين", "ناقش احتياجاتك الشرائية، حتى لمركبة واحدة.", "استشر عبر مساحة العمل"], ["معالجة نزاعات التسليم", "عالج نزاعات التسليم عبر الحدود وتعرّف إلى موردي السيارات الصينيين ذوي سجلات المخاطر.", "عرض دعم النزاعات"], ["مستجدات السياسات", "افهم سياسات شراء واستيراد المركبات في أسواق الوجهة.", "عرض المستجدات"]],
    membershipTitle: ["من التجربة الأولى", "إلى شريك عمل يومي."], membershipText: ["افهم أولاً ثم اختر.", "اعثر على الإيقاع المناسب لمشترياتك."], monthly: "شهري", annual: "سنوي", workspace: "مساحة العمل", allInOne: "الكل في مكان واحد", workspaceText: "اجمع معلومات الشراء في مكان واحد", workspaceBenefits: ["بحث الشركات والمركبات والشحن", "الصينية والإنجليزية والفرنسية والعربية", "الوصول إلى السياسات وخدمات الشراء"], pro: "عضوية احترافية", proBadge: "للمشتريات المستمرة", monthlyText: "اشتراك شهري يتجدد حسب دورة الفوترة", annualText: "اشتراك سنوي مع حصص شهرية", proBenefits: ["خدمات الشركات والمركبات والشحن", "5 تقارير تحقق من الشركات شهرياً", "مراجعة مخاطر مركزة واحدة شهرياً"], benefits: "عرض مزايا العضوية", footnote: "بالدولار · السعر النهائي وطرق الدفع عند إتمام الطلب",
    cta: ["عملية الشراء التالية", "تبدأ مع HelloCarCar."], open: "افتح مساحة عملي", footerTagline: "شراء سيارات أكثر وضوحاً.", footerLinks: ["المنتج", "الخدمات", "العضوية", "الموقع الإنجليزي ↗"], disclaimer: "الأسعار والسياسات للمرجع فقط. تحقّق مستقلاً قبل المعاملة.", account: "حسابي",
    dialogTitle: "مرحباً بك في HelloCarCar.", dialogText: "سجّل الدخول لمتابعة استشارة الشراء.", dialogQuestion: "سؤالك: ", dialogHint: "انسخ هذا السؤال إلى مساحة العمل بعد تسجيل الدخول.", dialogWorkspace: "فتح مساحة العمل", dialogLogin: "تسجيل الدخول / إنشاء حساب", dialogBenefits: "عرض العضوية", dialogSupport: "متاح بالصينية والإنجليزية والفرنسية والعربية"
  }
} as const;

const sidebarItems: Array<{ label: string; icon: IconName; feature?: Feature }> = [
  { label: "车辆报价", icon: "vehicles", feature: "vehicles" },
  { label: "海运报价", icon: "shipping", feature: "shipping" },
  { label: "企业调查报告", icon: "reports", feature: "reports" },
  { label: "交付纠纷", icon: "dispute", feature: "dispute" },
  { label: "配置表", icon: "config", feature: "config" },
  { label: "政策资讯", icon: "policy", feature: "policy" }
];

const recentChats = {
  zh: ["帮我查询缤越今日的价格", "查询近期Nansha到ALGIER的最便宜的海运报价", "xxxx这个公司是否有过交付丑闻", "我想追回被xxxx公司骗取的钱", "传祺gs3的车型配置"],
  en: ["Find today’s Geely Coolray price", "Cheapest recent Nansha–Algiers freight quote", "Has xxxx company had delivery scandals?", "I want to recover money lost to xxxx company", "GAC GS3 specifications"],
  fr: ["Prix du Geely Coolray aujourd’hui", "Fret Nansha–Alger le moins cher", "La société xxxx a-t-elle eu des litiges ?", "Récupérer l’argent perdu auprès de xxxx", "Configuration du GAC GS3"],
  ar: ["سعر جيلي كولراي اليوم", "أرخص شحن حديث من نانشا إلى الجزائر", "هل لدى شركة xxxx نزاعات تسليم؟", "أريد استرداد أموالي من شركة xxxx", "مواصفات GAC GS3"]
} as const;

const sidebarUi = {
  zh: { newChat: "新对话", recent: "最近对话", all: "查看全部历史", subscription: "订阅", account: "我的账户", member: "高级会员", demo: "产品界面演示" },
  en: { newChat: "New chat", recent: "Recent chats", all: "View all history", subscription: "Subscription", account: "My account", member: "Premium member", demo: "Product demo" },
  fr: { newChat: "Nouvelle discussion", recent: "Conversations récentes", all: "Voir tout l’historique", subscription: "Abonnement", account: "Mon compte", member: "Membre premium", demo: "Démo produit" },
  ar: { newChat: "محادثة جديدة", recent: "المحادثات الأخيرة", all: "عرض كل السجل", subscription: "الاشتراك", account: "حسابي", member: "عضو مميز", demo: "عرض المنتج" }
} as const;

const workspaceAiUi = {
  zh: { greeting: "你好，有什么可以帮你？", description: "从选车、查报价，到规划一次汽车采购。", example: "例如：我想了解比亚迪的车型报价和配置", start: "试着从这里开始", closing: "选车有依据，采购有方向。" },
  en: { greeting: "Hello, how can I help?", description: "From choosing a vehicle and checking quotes to planning a purchase.", example: "For example: compare BYD model quotes and specifications", start: "Try starting here", closing: "Better information for a clearer purchase." },
  fr: { greeting: "Bonjour, comment puis-je vous aider ?", description: "Du choix du véhicule aux devis et à la planification de l’achat.", example: "Par exemple : comparer les devis et configurations BYD", start: "Commencez ici", closing: "De meilleures informations pour un achat plus clair." },
  ar: { greeting: "مرحباً، كيف يمكنني مساعدتك؟", description: "من اختيار المركبة والأسعار إلى تخطيط عملية الشراء.", example: "مثال: قارن أسعار ومواصفات طرازات BYD", start: "ابدأ من هنا", closing: "معلومات أفضل لقرار شراء أوضح." }
} as const;

function Brand() {
  return <a href="#" className="hc-brand" aria-label="HelloCarCar 首页">HelloCarCar</a>;
}

function TypewriterTitle({ text }: { text: string }) {
  const [visible, setVisible] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(text);
      return;
    }
    let index = 0;
    setVisible("");
    const timer = window.setInterval(() => {
      index += 1;
      setVisible(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, 58);
    return () => window.clearInterval(timer);
  }, [text]);

  const lines = visible.split("\n");
  return <h3 className="hc-typewriter-title" aria-label={text.replace("\n", " ")} aria-live="polite">
    <span aria-hidden="true">{lines.map((line, index) => <span key={`${index}-${line}`}>{line}{index < lines.length - 1 && <br />}</span>)}<i className="hc-type-cursor" /></span>
  </h3>;
}

function GlobeBackdrop() {
  return <div className="hc-globe-stage" aria-hidden="true">
    <svg viewBox="0 0 640 640" role="presentation">
      <defs>
        <radialGradient id="hc-globe-fill" cx="38%" cy="30%" r="72%"><stop offset="0" stopColor="#ffffff" stopOpacity=".82" /><stop offset=".58" stopColor="#dcebdc" stopOpacity=".34" /><stop offset="1" stopColor="#a9c9ae" stopOpacity=".08" /></radialGradient>
        <clipPath id="hc-globe-clip"><circle cx="320" cy="320" r="244" /></clipPath>
      </defs>
      <circle cx="320" cy="320" r="244" className="hc-globe-shell" fill="url(#hc-globe-fill)" />
      <g clipPath="url(#hc-globe-clip)" className="hc-globe-spin">
        <g className="hc-globe-grid">
          <ellipse cx="320" cy="320" rx="92" ry="244" />
          <ellipse cx="320" cy="320" rx="178" ry="244" />
          <ellipse cx="320" cy="320" rx="244" ry="86" />
          <ellipse cx="320" cy="320" rx="244" ry="169" />
          <path d="M76 320h488" />
        </g>
        <g className="hc-globe-land">
          <path d="M176 184l34-28 54 8 27 28-9 28 20 22-18 24-42-5-24 22-35-16-12-38-24-17z" />
          <path d="M270 289l36-16 42 17 15 35-20 31-6 49-32 54-20-20 4-46-25-39-20-30z" />
          <path d="M382 153l48 13 18 25 45 12 26 37-18 30-41 5-23 31-31-15-21-43-38-12-6-34z" />
          <path d="M445 350l42 8 21 31-24 27-42-6-14-31z" />
        </g>
      </g>
      <circle cx="320" cy="320" r="244" className="hc-globe-outline" />
      <ellipse cx="320" cy="320" rx="304" ry="122" className="hc-globe-orbit" transform="rotate(-21 320 320)" />
      <circle cx="598" cy="236" r="6" className="hc-globe-dot" />
    </svg>
  </div>;
}

function OrbitStar({ route, duration, delay, scale, tone }: { route: string; duration: number; delay: number; scale: number; tone: "solid" | "outline" }) {
  return <g className={`hc-orbit-star hc-orbit-star-${tone}`}>
    <animateMotion path={route} dur={`${duration}s`} begin={`-${delay}s`} repeatCount="indefinite" rotate="auto" />
    <path transform={`scale(${scale})`} d="M0-18C2.4-6.2 5.1-2.5 18 0 5.1 2.5 2.4 6.2 0 18-2.4 6.2-5.1 2.5-18 0-5.1-2.5-2.4-6.2 0-18Z" />
  </g>;
}

function AmbientBackdrop() {
  const upperRoute = "M-120 660C210 220 650 70 1510 365";
  const middleRoute = "M-160 525C250 275 770 285 1540 610";
  const lowerRoute = "M80 980C420 555 920 390 1560 155";
  return <div className="hc-ambient-backdrop" aria-hidden="true">
    <GlobeBackdrop />
    <span className="hc-ambient-orb hc-ambient-orb-one" />
    <span className="hc-ambient-orb hc-ambient-orb-two" />
    <span className="hc-ambient-orb hc-ambient-orb-three" />
    <svg className="hc-ambient-routes" viewBox="0 0 1440 900" preserveAspectRatio="none" role="presentation">
      <path d="M-80 680C240 430 430 780 748 504S1220 185 1520 350" />
      <path d="M-120 210C180 380 424 92 704 278s420 366 844 160" />
      <path d="M120 880C380 590 650 720 820 560s312-310 650-274" />
      <g><circle cx="211" cy="542" r="4" /><circle cx="748" cy="504" r="5" /><circle cx="1188" cy="254" r="4" /><circle cx="1296" cy="451" r="3" /></g>
    </svg>
    <svg className="hc-ambient-stars" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" role="presentation">
      <path className="hc-star-route hc-star-route-one" d={upperRoute} />
      <path className="hc-star-route hc-star-route-two" d={middleRoute} />
      <path className="hc-star-route hc-star-route-three" d={lowerRoute} />
      <OrbitStar route={upperRoute} duration={54} delay={4} scale={1.15} tone="solid" />
      <OrbitStar route={upperRoute} duration={54} delay={29} scale={0.55} tone="outline" />
      <OrbitStar route={middleRoute} duration={68} delay={10} scale={0.78} tone="outline" />
      <OrbitStar route={middleRoute} duration={68} delay={43} scale={1.35} tone="solid" />
      <OrbitStar route={lowerRoute} duration={76} delay={18} scale={0.48} tone="solid" />
      <OrbitStar route={lowerRoute} duration={76} delay={56} scale={0.92} tone="outline" />
      <OrbitStar route={middleRoute} duration={92} delay={71} scale={0.38} tone="solid" />
      <OrbitStar route={upperRoute} duration={88} delay={63} scale={0.72} tone="outline" />
    </svg>
    <div className="hc-ambient-grid" />
  </div>;
}

function DemoSidebar({ active, locale, onChange, onStart }: { active: Feature; locale: Locale; onChange: (feature: Feature) => void; onStart: () => void }) {
  const labels = sidebarUi[locale];
  const localized = getFeatures(locale);
  return <aside className="hc-demo-sidebar">
    <div className="hc-demo-brand">HelloCarCar<span aria-hidden="true">◧</span></div>
    <button className="hc-demo-new" onClick={() => onChange("ai")}><Icon name="plus" />{labels.newChat}</button>
    <nav aria-label={labels.demo}>{sidebarItems.map((item) => { const translated = item.feature ? localized.find((feature) => feature.id === item.feature)?.label : item.label; return <button key={item.label} className={item.feature && active === item.feature ? "is-active" : ""} onClick={() => item.feature ? onChange(item.feature) : onStart()}><Icon name={item.icon} />{locale === "zh" ? item.label : translated}</button>; })}</nav>
    <div className="hc-demo-history"><small><span>{labels.recent}</span><Icon name="history" /></small>{recentChats[locale].map((chat, index) => <button key={chat} className={index === 0 ? "is-current" : ""} onClick={() => onChange("ai")} title={chat}>{chat}</button>)}<button className="hc-demo-all-history" onClick={onStart}>{labels.all} <Icon name="arrow" /></button></div>
    <button className="hc-demo-subscription" onClick={onStart}><Icon name="subscription" />{labels.subscription}</button>
    <div className="hc-demo-user"><span>J</span><div>{labels.account}<small>{labels.member}</small></div><button aria-label={labels.account} onClick={onStart}><Icon name="settings" /></button></div>
  </aside>;
}

function FigmaPreview({ feature, locale, previewId, onChange, onStart }: { feature: "vehicles" | "config"; locale: Locale; previewId: string; onChange: (feature: Feature) => void; onStart: () => void }) {
  const isVehicle = feature === "vehicles";
  const name = getFeatures(locale).find((item) => item.id === feature)?.label ?? feature;
  const asset = isVehicle ? "vehicle-quote" : "config-query";
  const localeSuffix = locale === "zh" ? "" : `-${locale}`;
  const desktopSrc = `/homepage/figma/${asset}-desktop${localeSuffix}.svg`;
  const mobileSrc = `/homepage/figma/${asset}-mobile${localeSuffix}.svg`;

  return <div className="hc-figma-preview" id={previewId} role="tabpanel" aria-label={`${name} interface preview`}>
    <div className="hc-figma-frame">
      <div className="hc-figma-workspace">
        <DemoSidebar active={feature} locale={locale} onChange={onChange} onStart={onStart} />
        <div className="hc-figma-crop"><picture><source media="(max-width: 600px)" srcSet={mobileSrc} /><img src={desktopSrc} alt={`${name} interface preview`} /></picture></div>
      </div>
    </div>
  </div>;
}

const disputeUi = {
  zh: {
    title: "交付纠纷", description: "提交交付纠纷线索，追踪处理进展，让每一份合理诉求都被看见。", totalPrefix: "近一月收到", totalSuffix: "条交付纠纷线索", submit: "我要爆料", privacy: "公开展示前会保护个人隐私　·　线索仅用于纠纷协助处理", popular: "近期热门爆料", all: "查看全部", mine: "我的案件", private: "仅自己可见　·　查看全部 →", caseTitle: "车辆交付延期，退款进度待确认", caseNumber: "案件编号", submitted: "提交于", detail: "查看案件详情　→", status: "待受理",
    items: [["交付延期", "车辆交付多次延期，订金退款迟迟未处理", "河南 · 2小时前", "定金已付近两个月，合同约定交付时间已过，多次沟通仍没有明确的处理方案..."], ["售后争议", "新车维修后问题仍未解决，希望尽快给出答复", "浙江 · 5小时前", "提车后发现车辆异响，维修两次仍反复出现，和门店沟通后暂未获得明确解决时间..."], ["合同退款", "合同解除后退款周期超出约定期限", "江苏 · 昨天", "双方已确认解除协议，退款申请已提交多日，仍未收到款项及进度说明..."]]
  },
  en: {
    title: "Delivery Disputes", description: "Submit delivery-dispute leads and follow their progress so every reasonable claim can be heard.", totalPrefix: "Received in the past month", totalSuffix: "delivery-dispute leads", submit: "Submit a lead", privacy: "Personal details are protected before publication · Leads are used only for dispute support", popular: "Recent popular reports", all: "View all", mine: "My cases", private: "Visible only to me · View all →", caseTitle: "Vehicle delivery delayed; refund pending confirmation", caseNumber: "Case ID", submitted: "Submitted", detail: "View case details →", status: "Pending review",
    items: [["Delivery delay", "Delivery postponed repeatedly and deposit refund still pending", "Henan · 2 hours ago", "The deposit was paid nearly two months ago. The contracted delivery date has passed, but no clear solution has been provided..."], ["After-sales dispute", "The problem remains after repairs to the new vehicle", "Zhejiang · 5 hours ago", "Abnormal noise remained after two repairs, and the dealer has not given a clear resolution date..."], ["Contract refund", "Refund exceeded the agreed period after contract cancellation", "Jiangsu · Yesterday", "Both parties confirmed the cancellation, but no payment or progress update has been received..."]]
  },
  fr: {
    title: "Litiges de livraison", description: "Signalez un litige et suivez son traitement afin que chaque demande légitime soit prise en compte.", totalPrefix: "Reçus le mois dernier", totalSuffix: "signalements de litige", submit: "Signaler", privacy: "Les données personnelles sont protégées · Les signalements servent uniquement à l’assistance", popular: "Signalements récents", all: "Tout voir", mine: "Mes dossiers", private: "Visible par moi uniquement · Tout voir →", caseTitle: "Livraison retardée, remboursement à confirmer", caseNumber: "Dossier", submitted: "Déposé le", detail: "Voir le dossier →", status: "En attente",
    items: [["Retard", "Livraison reportée plusieurs fois et acompte non remboursé", "Henan · il y a 2 h", "L’acompte a été payé il y a près de deux mois. La date prévue est dépassée sans solution claire..."], ["Après-vente", "Le problème persiste après la réparation du véhicule neuf", "Zhejiang · il y a 5 h", "Le bruit anormal persiste après deux réparations et le concessionnaire n’a pas donné de délai précis..."], ["Remboursement", "Le délai convenu est dépassé après résiliation du contrat", "Jiangsu · hier", "La résiliation a été confirmée, mais aucun paiement ni suivi n’a encore été reçu..."]]
  },
  ar: {
    title: "نزاعات التسليم", description: "أرسل بلاغاً عن نزاع تسليم وتابع تقدمه حتى يصل كل طلب مشروع إلى الجهة المعنية.", totalPrefix: "تم استلام", totalSuffix: "بلاغ نزاع خلال الشهر الماضي", submit: "إرسال بلاغ", privacy: "تُحمى البيانات الشخصية قبل النشر · تُستخدم البلاغات فقط للمساعدة في حل النزاع", popular: "أحدث البلاغات", all: "عرض الكل", mine: "قضاياي", private: "مرئي لي فقط · عرض الكل ←", caseTitle: "تأخر تسليم المركبة واسترداد المبلغ قيد التأكيد", caseNumber: "رقم القضية", submitted: "قُدمت في", detail: "عرض تفاصيل القضية ←", status: "قيد المراجعة",
    items: [["تأخر التسليم", "تأجل التسليم مراراً ولم يُسترد العربون", "خنان · قبل ساعتين", "دُفع العربون منذ قرابة شهرين وتجاوز الموعد المتفق عليه من دون حل واضح..."], ["نزاع ما بعد البيع", "ما زالت المشكلة قائمة بعد إصلاح المركبة الجديدة", "تشجيانغ · قبل 5 ساعات", "استمر الصوت غير الطبيعي بعد إصلاحين ولم يحدد الوكيل موعداً واضحاً للحل..."], ["استرداد العقد", "تجاوز رد المبلغ المدة المتفق عليها بعد إنهاء العقد", "جيانغسو · أمس", "أكد الطرفان الإنهاء، لكن لم يصل المبلغ أو تحديث عن التقدم حتى الآن..."]]
  }
} as const;

function DisputePreview({ locale }: { locale: Locale }) {
  const copy = disputeUi[locale];
  return <div className="hc-demo-data hc-dispute-preview">
    <h3>{copy.title}</h3><p>{copy.description}</p>
    <section className="hc-dispute-hero-card">
      <div className="hc-dispute-total"><span>{copy.totalPrefix}</span><b className="hc-dispute-blur-number">953</b><span>{copy.totalSuffix}</span></div>
      <button type="button"><Icon name="plus" />{copy.submit}</button>
      <small>{copy.privacy}</small>
    </section>
    <div className="hc-dispute-section-title"><h4>{copy.popular}</h4><button type="button">{copy.all} <Icon name="arrow" /></button></div>
    <div className="hc-dispute-hot">
      {copy.items.map((item, index) => <article key={item[1]}><div><span>{item[0]}</span><h5>{item[1]}</h5><small>{item[2]}　 ♡ <i className="hc-dispute-blur-number">{[28, 16, 12][index]}</i></small></div><p>{item[3]}</p></article>)}
    </div>
    <div className="hc-dispute-section-title hc-dispute-case-title"><h4>{copy.mine}</h4><span>{copy.private}</span></div>
    <section className="hc-dispute-case"><div><h5>{copy.caseTitle}</h5><p>{copy.caseNumber}　HC-<span className="hc-dispute-blur-number">20261008-0231</span>　·　{copy.submitted} <span className="hc-dispute-blur-number">2026-10-08</span></p><button type="button">{copy.detail}</button></div><b>{copy.status}</b></section>
  </div>;
}

const policyUi = {
  zh: {
    overline: "阿尔及利亚政策资讯", title: "政策资讯", description: "围绕汽车采购与进口整理官方政策，标注时间、来源与实际影响。", market: "阿尔及利亚市场", verified: "官方来源已核验", note: "政策信息用于采购准备，实际申报前请向当地主管机关或持牌专业人士复核。",
    items: [{ category: "进口资格", date: "2023-02-22", title: "个人二手车与新车经销商适用不同进口通道", summary: "居民个人通道仅适用于自用、车龄不超过三年的特定二手乘用车；商业新车进口须由获批的阿尔及利亚经销商操作。", source: "JORADP · 23-74号法令" }, { category: "税费", date: "2026-02-23", title: "进口税费须先确认 HS 编码与车辆参数", summary: "一般增值税率信息不能替代完整税费测算。动力类型、排量、原产地与海关估价都会影响最终结果。", source: "阿尔及利亚税务总局" }, { category: "合规与认证", date: "2022-11-17", title: "车辆到港清关前须完成合规控制", summary: "新车需准备制造商技术说明及安全、环保测试资料；个人二手车还需取得当地认可专家出具的合规鉴定报告。", source: "JORADP · 22-383号法令" }]
  },
  en: {
    overline: "ALGERIA POLICY UPDATES", title: "Policy Updates", description: "Official vehicle purchasing and import policies, with dates, sources and practical impact.", market: "Algerian market", verified: "Official sources verified", note: "Policy information supports purchasing preparation. Confirm with local authorities or licensed professionals before filing.",
    items: [{ category: "Import eligibility", date: "2023-02-22", title: "Private used cars and dealer imports follow different channels", summary: "The resident channel applies only to eligible used passenger cars for personal use, no more than three years old. New commercial vehicles must be imported by approved Algerian dealers.", source: "JORADP · Decree 23-74" }, { category: "Tax and duties", date: "2026-02-23", title: "Confirm the HS code and vehicle details before calculating duties", summary: "A general VAT rate cannot replace a full calculation. Powertrain, displacement, origin and customs valuation all affect the final amount.", source: "Algerian Tax Authority" }, { category: "Compliance", date: "2022-11-17", title: "Compliance control is required before port clearance", summary: "New vehicles require manufacturer technical, safety and environmental documents. Private used cars also require a local expert conformity report.", source: "JORADP · Decree 22-383" }]
  },
  fr: {
    overline: "ACTUALITÉS RÉGLEMENTAIRES · ALGÉRIE", title: "Actualités réglementaires", description: "Politiques officielles d’achat et d’importation, avec dates, sources et effets pratiques.", market: "Marché algérien", verified: "Sources officielles vérifiées", note: "Ces informations servent à préparer l’achat. Confirmez-les auprès des autorités ou d’un professionnel agréé avant déclaration.",
    items: [{ category: "Droit d’importer", date: "2023-02-22", title: "Voitures d’occasion privées et véhicules neufs suivent des circuits distincts", summary: "Le régime des particuliers concerne uniquement certains véhicules d’occasion de moins de trois ans à usage personnel. Les véhicules neufs commerciaux passent par un concessionnaire agréé.", source: "JORADP · Décret 23-74" }, { category: "Taxes", date: "2026-02-23", title: "Confirmer le code SH et les paramètres du véhicule", summary: "Un taux général de TVA ne remplace pas un calcul complet. Motorisation, cylindrée, origine et valeur douanière influencent le montant final.", source: "Direction générale des impôts" }, { category: "Conformité", date: "2022-11-17", title: "Le contrôle de conformité précède le dédouanement", summary: "Les véhicules neufs exigent les documents techniques, de sécurité et environnementaux du constructeur. Les occasions privées exigent aussi un rapport d’expert local.", source: "JORADP · Décret 22-383" }]
  },
  ar: {
    overline: "مستجدات سياسات الجزائر", title: "مستجدات السياسات", description: "سياسات رسمية لشراء المركبات واستيرادها مع التواريخ والمصادر والأثر العملي.", market: "السوق الجزائرية", verified: "تم التحقق من المصادر الرسمية", note: "هذه المعلومات للتحضير للشراء. تحقق من الجهة المحلية المختصة أو مهني مرخص قبل تقديم الإقرار.",
    items: [{ category: "أهلية الاستيراد", date: "2023-02-22", title: "للسيارات المستعملة الخاصة والجديدة قنوات استيراد مختلفة", summary: "قناة الأفراد مخصصة لسيارات ركوب مستعملة مؤهلة للاستعمال الشخصي لا يتجاوز عمرها ثلاث سنوات، أما المركبات التجارية الجديدة فيستوردها وكلاء جزائريون معتمدون.", source: "JORADP · المرسوم 23-74" }, { category: "الضرائب والرسوم", date: "2026-02-23", title: "يجب تأكيد رمز HS وبيانات المركبة قبل حساب الرسوم", summary: "لا يغني معدل ضريبة عام عن الحساب الكامل. يؤثر نوع المحرك والسعة والمنشأ والتقييم الجمركي في المبلغ النهائي.", source: "المديرية العامة للضرائب" }, { category: "المطابقة", date: "2022-11-17", title: "يلزم فحص المطابقة قبل التخليص في الميناء", summary: "تحتاج المركبات الجديدة إلى مستندات الشركة الفنية واختبارات السلامة والبيئة، كما تحتاج السيارات المستعملة الخاصة إلى تقرير مطابقة من خبير محلي.", source: "JORADP · المرسوم 22-383" }]
  }
} as const;

function PolicyPreview({ locale }: { locale: Locale }) {
  const copy = policyUi[locale];
  return <div className="hc-demo-data hc-policy-preview">
    <small className="hc-demo-overline">{copy.overline}</small><h3>{copy.title}</h3><p>{copy.description}</p>
    <div className="hc-policy-toolbar"><span><Icon name="policy" />{copy.market}</span><span>{copy.verified} <i /></span></div>
    <div className="hc-policy-list">{copy.items.map((item) => <article key={item.title}><div><span>{item.category}</span><time>{item.date}</time></div><h4>{item.title}</h4><p>{item.summary}</p><small>{item.source}</small></article>)}</div>
    <small className="hc-demo-note">{copy.note}</small>
  </div>;
}

const workspaceDetailUi = {
  zh: {
    shipping: { title: "为这次采购，找到合适的航线", description: "运输安排，从清楚的出运需求开始。", fields: [["起运港", "中国 · 南沙"], ["目的港", "阿尔及利亚 · 阿尔及尔"], ["预计出运日期", "选择日期"], ["柜型", "40HQ"]], submit: "进入工作区查询", origin: "南沙", originMeta: "中国 · 南沙", destination: "阿尔及尔", destinationMeta: "阿尔及利亚 · 阿尔及尔" },
    report: { title: "采购前，多一次企业调查", description: "核验主体、经营与风险信息，为采购决定多加一道保障。", reportTitle: "企业调查报告", sections: "主体信息 / 经营状况 / 风险与争议", preview: "调查结果预览", lead: "把风险看在采购之前", steps: ["填写目标企业信息", "核验主体与经营状态", "汇总公开风险线索", "获取企业调查报告"], submit: "申请企业调查报告" }
  },
  en: {
    shipping: { title: "Find the right route for this purchase", description: "A clear shipping plan starts with clear requirements.", fields: [["Port of loading", "Nansha · China"], ["Destination port", "Algiers · Algeria"], ["Estimated shipping date", "Select date"], ["Container", "40HQ"]], submit: "Search in workspace", origin: "Nansha", originMeta: "NANSHA · CHINA", destination: "Algiers", destinationMeta: "ALGIERS · ALGERIA" },
    report: { title: "Investigate the company before you buy", description: "Verify identity, operations and risk information to reduce purchasing uncertainty.", reportTitle: "Company Due Diligence Report", sections: "Identity / Operations / Risks and disputes", preview: "Report preview", lead: "See the risk before purchasing", steps: ["Enter the target company", "Verify identity and operating status", "Compile public risk signals", "Receive the due diligence report"], submit: "Request company report" }
  },
  fr: {
    shipping: { title: "Trouvez l’itinéraire adapté à cet achat", description: "Un transport clair commence par des besoins bien définis.", fields: [["Port de départ", "Nansha · Chine"], ["Port d’arrivée", "Alger · Algérie"], ["Date d’expédition", "Choisir une date"], ["Conteneur", "40HQ"]], submit: "Rechercher dans l’espace", origin: "Nansha", originMeta: "NANSHA · CHINE", destination: "Alger", destinationMeta: "ALGER · ALGÉRIE" },
    report: { title: "Enquêtez sur l’entreprise avant l’achat", description: "Vérifiez l’identité, l’activité et les risques afin de réduire l’incertitude.", reportTitle: "Rapport d’enquête d’entreprise", sections: "Identité / Activité / Risques et litiges", preview: "Aperçu du rapport", lead: "Repérez les risques avant d’acheter", steps: ["Saisir l’entreprise ciblée", "Vérifier l’identité et l’activité", "Regrouper les risques publics", "Recevoir le rapport d’enquête"], submit: "Demander un rapport" }
  },
  ar: {
    shipping: { title: "اعثر على المسار المناسب لهذه العملية", description: "يبدأ ترتيب الشحن الواضح بمتطلبات شحن محددة.", fields: [["ميناء الشحن", "نانشا · الصين"], ["ميناء الوجهة", "الجزائر · الجزائر"], ["تاريخ الشحن المتوقع", "اختر التاريخ"], ["الحاوية", "40HQ"]], submit: "البحث في مساحة العمل", origin: "نانشا", originMeta: "نانشا · الصين", destination: "الجزائر", destinationMeta: "الجزائر · الجزائر" },
    report: { title: "تحقق من الشركة قبل الشراء", description: "تحقق من الهوية والنشاط ومعلومات المخاطر لتقليل عدم اليقين في قرار الشراء.", reportTitle: "تقرير التحقق من الشركة", sections: "الهوية / النشاط / المخاطر والنزاعات", preview: "معاينة التقرير", lead: "اعرف المخاطر قبل الشراء", steps: ["أدخل بيانات الشركة المستهدفة", "تحقق من الهوية وحالة النشاط", "اجمع مؤشرات المخاطر العامة", "احصل على تقرير التحقق"], submit: "طلب تقرير شركة" }
  }
} as const;

function WorkspacePreview({ active, locale, onChange, onStart, previewId = "feature-preview" }: { active: Feature; locale: Locale; onChange: (feature: Feature) => void; onStart: () => void; previewId?: string }) {
  const localizedFeatures = getFeatures(locale);
  const aiCopy = workspaceAiUi[locale];
  const detailCopy = workspaceDetailUi[locale];
  if ((["vehicles", "config"] as Feature[]).includes(active)) {
    return <FigmaPreview feature={active as "vehicles" | "config"} locale={locale} previewId={previewId} onChange={onChange} onStart={onStart} />;
  }
  const current = localizedFeatures.find((feature) => feature.id === active)!;
  return <div className="hc-app-window">
    <DemoSidebar active={active} locale={locale} onChange={onChange} onStart={onStart} />
    <div className="hc-demo-main">
      <header><span>{current.label}</span><span className="hc-demo-label">{sidebarUi[locale].demo} <i /></span></header>
      <div className="hc-demo-content" role="tabpanel" id={previewId} aria-label={current.label}>
        {active === "ai" ? <div className="hc-demo-ai">
          <div className="hc-ai-symbol"><Icon name="ai" /></div>
          <h3>{aiCopy.greeting}</h3><p>{aiCopy.description}</p>
          <button className="hc-demo-composer" onClick={onStart}><span>{aiCopy.example}</span><span><small><Icon name="ai" /> HelloCarCar AI</small><b><Icon name="arrow" /></b></span></button>
          <div className="hc-demo-recommend"><small>{aiCopy.start}</small><div>{localizedFeatures.filter((f) => f.id !== "ai").map((f) => <button key={f.id} onClick={() => onChange(f.id)}><Icon name={f.id} /><span>{f.label}<small>{f.detail.split(" · ")[0]}</small></span><span>↗</span></button>)}</div></div>
          <div className="hc-demo-bottom">{aiCopy.closing}</div>
        </div> : active === "dispute" ? <DisputePreview locale={locale} /> : active === "policy" ? <PolicyPreview locale={locale} /> : active === "vehicles" ? <div className="hc-demo-data">
          <small className="hc-demo-overline">VEHICLE QUOTATIONS</small><h3>找到你的下一款车</h3><p>按品牌和车型查看报价，让每次比较都有依据。</p>
          <div className="hc-demo-search"><span>搜索品牌、车型或配置</span><Icon name="vehicles" /></div>
          <div className="hc-brand-tags"><b>全部品牌</b><span>比亚迪</span><span>吉利</span><span>奇瑞</span><span>长安</span></div>
          <div className="hc-demo-table"><div><span>车型 / 配置</span><span>FOB 报价</span><span>交付地点</span></div>{["海狮06 DM-i · 121KM 领航版", "海豹06 DM-i · 80KM 尊贵型", "秦L DM-i · 120KM 旗舰型"].map((model) => <div key={model}><span><Icon name="vehicles" />{model}</span><span>查询后显示</span><span>查看记录</span></div>)}</div><small className="hc-demo-note">界面示意，实际报价以工作区查询结果为准。</small>
        </div> : active === "shipping" ? <div className="hc-demo-data">
          <small className="hc-demo-overline">OCEAN FREIGHT</small><h3>{detailCopy.shipping.title}</h3><p>{detailCopy.shipping.description}</p>
          <div className="hc-shipping-form">{detailCopy.shipping.fields.map(([label, value]) => <div key={label}><small>{label}</small><span>{value}<b>⌄</b></span></div>)}</div>
          <button className="hc-demo-submit" onClick={onStart}>{detailCopy.shipping.submit} <Icon name="arrow" /></button>
          <div className="hc-route"><div><Icon name="shipping" /><b>{detailCopy.shipping.origin}</b><small>{detailCopy.shipping.originMeta}</small></div><span><i /><i /><i /><i /><Icon name="arrow" /></span><div><Icon name="globe" /><b>{detailCopy.shipping.destination}</b><small>{detailCopy.shipping.destinationMeta}</small></div></div>
        </div> : active === "config" ? <div className="hc-demo-data">
          <small className="hc-demo-overline">VEHICLE SPECIFICATIONS</small><h3>让每一份配置，都清楚易读</h3><p>选择品牌、车型与语言，预览车型配置表。</p>
          <div className="hc-config-steps"><b>1 选择品牌</b><span>2 选择车型</span><span>3 选择语言</span><span>4 PDF 预览</span></div>
          <div className="hc-config-brands">{["BYD", "GEELY", "CHERY", "CHANGAN", "GWM", "GAC"].map((brand) => <button onClick={onStart} key={brand}>{brand}<small>查看车型 →</small></button>)}</div>
          <small className="hc-demo-note">配置表功能设计预览</small>
        </div> : <div className="hc-demo-data">
          <small className="hc-demo-overline">ENTERPRISE DUE DILIGENCE</small><h3>{detailCopy.report.title}</h3><p>{detailCopy.report.description}</p>
          <div className="hc-report-preview"><div><Icon name="reports" /><small>HELLOCARCAR</small><h4>{detailCopy.report.reportTitle}</h4><span>{detailCopy.report.sections}</span><i /><i /><i /><div>{detailCopy.report.preview}</div></div><section><b>{detailCopy.report.lead}</b>{detailCopy.report.steps.map((step) => <span key={step}><Icon name="check" />{step}</span>)}<button className="hc-demo-submit" onClick={onStart}>{detailCopy.report.submit} <Icon name="arrow" /></button></section></div>
        </div>}
      </div>
    </div>
  </div>;
}

export function PublicHomepage() {
  const [active, setActive] = useState<Feature>("ai");
  const [locale, setLocale] = useState<Locale>("zh");
  const [menuOpen, setMenuOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const entryDialogRef = useRef<HTMLDialogElement>(null);
  const localizedFeatures = getFeatures(locale);
  const current = localizedFeatures.find((feature) => feature.id === active)!;
  const copy = pageCopy[locale];
  const previewNote = {
    zh: "车辆报价与配置表按 Figma 最新稿展示；其他页面为功能演示。实际数据、可用功能及交付结果以工作区为准。",
    en: "Vehicle quotes and specification sheets follow the latest Figma designs. Other screens are product demonstrations; live data and deliverables are available in the workspace.",
    fr: "Les devis et fiches techniques suivent les dernières maquettes Figma. Les autres écrans sont des démonstrations ; les données réelles sont disponibles dans l’espace de travail.",
    ar: "تتبع عروض المركبات وجداول المواصفات أحدث تصاميم Figma. الشاشات الأخرى توضيحية، وتتوفر البيانات الفعلية في مساحة العمل."
  }[locale];
  const billingUnit = {
    zh: { monthly: "月", annual: "年" }, en: { monthly: "month", annual: "year" }, fr: { monthly: "mois", annual: "an" }, ar: { monthly: "شهر", annual: "سنة" }
  }[locale];
  const start = () => setEntryOpen(true);
  const demo = () => document.getElementById("product")?.scrollIntoView({ behavior: "smooth" });
  const showFeature = (feature: Feature) => {
    setActive(feature);
    document.getElementById("product")?.scrollIntoView({ behavior: "smooth" });
  };
  const ask = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); start(); };
  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? localizedFeatures.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + localizedFeatures.length) % localizedFeatures.length;
    const nextFeature = localizedFeatures[nextIndex];
    if (!nextFeature) return;
    setActive(nextFeature.id);
    document.getElementById(`feature-${nextFeature.id}`)?.focus();
  };

  useEffect(() => {
    const dialog = entryDialogRef.current;
    if (!dialog) return;
    if (entryOpen && !dialog.open) dialog.showModal();
    if (!entryOpen && dialog.open) dialog.close();
  }, [entryOpen]);

  return <div className="hc-home" lang={locale === "zh" ? "zh-CN" : locale} dir={locale === "ar" ? "rtl" : "ltr"}>
    <a href="#main" className="hc-skip">{locale === "zh" ? "跳转到主要内容" : locale === "fr" ? "Aller au contenu" : locale === "ar" ? "انتقل إلى المحتوى" : "Skip to main content"}</a>
    <AmbientBackdrop />
    <header className="hc-header"><div className="hc-header-inner"><Brand /><nav aria-label={copy.nav[0]} className={menuOpen ? "hc-nav is-open" : "hc-nav"}><a href="#product" onClick={() => setMenuOpen(false)}>{copy.nav[0]}</a><a href="#services" onClick={() => setMenuOpen(false)}>{copy.nav[1]}</a><a href="#membership" onClick={() => setMenuOpen(false)}>{copy.nav[2]}</a></nav><div className="hc-header-actions"><label className="hc-language"><Icon name="globe" /><select aria-label={copy.language} value={locale} onChange={(event) => setLocale(event.target.value as Locale)}><option value="zh">简体中文</option><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select></label><a className="hc-login" href={`${PLATFORM_URL}/sign-in`}>{copy.login}</a><a className="hc-button hc-header-cta" href={`${PLATFORM_URL}/workspace`}>{copy.enter} <Icon name="arrow" /></a><button className="hc-menu" aria-label={menuOpen ? "Close" : "Menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} /></button></div></div></header>
    <main id="main">
      <section className="hc-hero">
        <div className="hc-hero-glow" /><span className="hc-orbit hc-orbit-one" /><span className="hc-orbit hc-orbit-two" />
        <div className="hc-hero-copy"><span className="hc-kicker"><i /> {copy.kicker}</span><h1>{copy.heroTitle[0]} <span>{copy.heroTitle[1]}</span></h1><p>{copy.heroText[0]}<br className="hc-mobile-break" />{copy.heroText[1]}</p><div className="hc-hero-actions"><button className="hc-button" onClick={start}>{copy.start} <Icon name="arrow" /></button><button className="hc-demo-link" onClick={demo}><span><Icon name="play" /></span>{copy.demo}</button></div><div className="hc-hero-note"><span><Icon name="check" /> {copy.notes[0]}</span><i /><span><Icon name="check" /> {copy.notes[1]}</span><i /><span><Icon name="check" /> {copy.notes[2]}</span></div></div>
        <div className="hc-hero-showcase hc-wrap"><div className="hc-showcase-caption"><span><i /> ONE WORKSPACE. MORE CLARITY.</span><span>{copy.productText} ↙</span></div><WorkspacePreview active="ai" locale={locale} onChange={(feature) => { setActive(feature); demo(); }} onStart={start} previewId="hero-feature-preview" /><div className="hc-meteor-lane" aria-hidden="true"><div className="hc-floating-note"><span><Icon name="ai" /></span><div>{copy.notes[1]}<b>{copy.productText}</b></div><span className="hc-note-line" /></div></div></div>
      </section>
      <section id="product" className="hc-product hc-wrap"><div className="hc-section-heading"><span className="hc-section-kicker">MADE FOR YOUR NEXT MOVE</span><h2>{copy.productTitle}</h2><p>{copy.productText}</p></div><div className="hc-feature-tabs" role="tablist" aria-label={copy.nav[0]}>{localizedFeatures.map((feature, index) => <button key={feature.id} id={`feature-${feature.id}`} role="tab" tabIndex={active === feature.id ? 0 : -1} aria-selected={active === feature.id} aria-controls="feature-preview" onClick={() => setActive(feature.id)} onKeyDown={(event) => handleTabKey(event, index)}><Icon name={feature.id} />{feature.label}</button>)}</div><div className="hc-feature-intro"><div><TypewriterTitle text={current.title} /></div><div><p>{current.description}</p><span>{current.detail}</span></div></div><WorkspacePreview active={active} locale={locale} onChange={setActive} onStart={start} /><p className="hc-preview-note">{previewNote}</p></section>
      <section className="hc-question-section"><div className="hc-wrap hc-question-inner"><div className="hc-ai-symbol"><Icon name="ai" /></div><h2>{copy.questionTitle[0]}<br />{copy.questionTitle[1]}</h2><form onSubmit={ask}><label className="hc-sr-only" htmlFor="procurement-question">{copy.questionPlaceholder}</label><input id="procurement-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={copy.questionPlaceholder} maxLength={1000} /><button type="submit" aria-label={copy.start}><Icon name="arrow" /></button></form><div className="hc-prompt-list">{copy.prompts.map((prompt) => <button key={prompt} onClick={() => setQuestion(prompt)}>{prompt}<span>↗</span></button>)}</div><p>{copy.questionLogin}</p></div></section>
      <section className="hc-services hc-wrap" id="services"><div className="hc-section-heading"><span className="hc-section-kicker">MORE THAN INFORMATION</span><h2>{copy.servicesTitle}</h2><p>{copy.servicesText}</p></div><div className="hc-service-grid">{[
        { n: "01", icon: "vehicles" as const, en: "CHINA PURCHASING", action: start },
        { n: "02", icon: "shield" as const, en: "DISPUTE SUPPORT", action: () => showFeature("dispute") },
        { n: "03", icon: "globe" as const, en: "POLICY UPDATES", action: () => showFeature("policy") }
      ].map((service, index) => { const localized = copy.services[index]!; return <article key={service.n}><div className="hc-service-top"><Icon name={service.icon} /><span>{service.n}</span></div><small>{service.en}</small><h3>{localized[0]}</h3><p>{localized[1]}</p><button onClick={service.action}>{localized[2]} <Icon name="arrow" /></button></article>; })}</div></section>
      <section className="hc-membership hc-wrap" id="membership"><div className="hc-membership-copy"><span className="hc-section-kicker">A LITTLE MORE SUPPORT</span><h2>{copy.membershipTitle[0]}<br />{copy.membershipTitle[1]}</h2><p>{copy.membershipText[0]}<br />{copy.membershipText[1]}</p><div className="hc-plan-switch" role="group" aria-label={copy.nav[2]}><button className={plan === "monthly" ? "is-active" : ""} aria-pressed={plan === "monthly"} onClick={() => setPlan("monthly")}>{copy.monthly}</button><button className={plan === "annual" ? "is-active" : ""} aria-pressed={plan === "annual"} onClick={() => setPlan("annual")}>{copy.annual}</button></div></div><div className="hc-plan-card"><span>{copy.workspace}</span><h3>{copy.allInOne}</h3><p>{copy.workspaceText}</p><ul>{copy.workspaceBenefits.map((item) => <li key={item}><Icon name="check" />{item}</li>)}</ul><button className="hc-outline-button" onClick={start}>{copy.enter} <Icon name="arrow" /></button></div><div className="hc-plan-card hc-plan-pro"><span>{copy.pro} <small>{copy.proBadge}</small></span><h3>${plan === "monthly" ? "99" : "899.90"}<small> / {plan === "monthly" ? billingUnit.monthly : billingUnit.annual}</small></h3><p>{plan === "annual" ? copy.annualText : copy.monthlyText}</p><ul>{copy.proBenefits.map((item) => <li key={item}><Icon name="check" />{item}</li>)}</ul><button className="hc-button" onClick={start}>{copy.benefits} <Icon name="arrow" /></button><small className="hc-plan-footnote">{copy.footnote}</small></div></section>
      <section className="hc-final-cta"><div className="hc-wrap"><h2>{copy.cta[0]}<br />{copy.cta[1]}</h2><button onClick={start}>{copy.open} <Icon name="arrow" /></button><div className="hc-cta-art" aria-hidden="true"><span>hello</span><div /><span>carcar.</span></div></div></section>
    </main>
    <footer className="hc-footer hc-wrap"><div><Brand /><p>{copy.footerTagline}</p></div><div className="hc-footer-links"><a href="#product">{copy.footerLinks[0]}</a><a href="#services">{copy.footerLinks[1]}</a><a href="#membership">{copy.footerLinks[2]}</a><a href={`${PLATFORM_URL}/en`}>{copy.footerLinks[3]}</a></div><div className="hc-footer-bottom"><span>© {new Date().getFullYear()} HelloCarCar</span><span>{copy.disclaimer}</span><a href={`${PLATFORM_URL}/account`}>{copy.account} <Icon name="arrow" /></a></div></footer>
    <dialog ref={entryDialogRef} className="hc-entry-dialog" aria-labelledby="entry-title" onCancel={() => setEntryOpen(false)} onClose={() => setEntryOpen(false)}><button className="hc-dialog-close" aria-label="Close" onClick={() => setEntryOpen(false)}><Icon name="close" /></button><div className="hc-ai-symbol"><Icon name="ai" /></div><h2 id="entry-title">{copy.dialogTitle}</h2><p>{copy.dialogText}</p>{question && <blockquote>{copy.dialogQuestion}{question}<small>{copy.dialogHint}</small></blockquote>}<div className="hc-entry-languages"><a className="is-primary" href={`${PLATFORM_URL}/workspace`}>{copy.dialogWorkspace} <Icon name="arrow" /></a><a href={`${PLATFORM_URL}/sign-in`}>{copy.dialogLogin} <Icon name="arrow" /></a><a href={`${PLATFORM_URL}/workspace/subscription`}>{copy.dialogBenefits} <Icon name="arrow" /></a></div><div className="hc-dialog-locales"><button onClick={() => setLocale("zh")}>中文</button><button onClick={() => setLocale("en")}>English</button><button onClick={() => setLocale("fr")}>Français</button><button onClick={() => setLocale("ar")} lang="ar">العربية</button></div><small>{copy.dialogSupport}</small></dialog>
  </div>;
}
