import { createServer } from "node:http";
import { Bot, InlineKeyboard, webhookCallback, type Context } from "grammy";
import { claimAccountLink, getAccountStatus, getConversation, runBotAction, updateConversation, type TelegramProfile } from "./api";
import { paymentConfirmationCallback, paymentSelectionCallback } from "./callback-data";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required");
const bot = new Bot(token);
const webOrigin = (process.env.WEB_ORIGIN || "http://127.0.0.1:4173").replace(/\/$/, "");

const messages = {
  en: { welcome: "Welcome to HelloCarCar. Choose a task below.", linked: (email: string) => `Account linked to ${email}.`, notLinked: "Link this Telegram account from the secure customer workspace first.", noSubscription: "Your account is linked, but there is no active subscription.", active: (endsAt: string | null) => `Subscription active${endsAt ? ` until ${new Date(endsAt).toLocaleDateString("en")}` : ""}.`, failed: "The request could not be completed. Open the secure workspace or try again.", workspace: "Open workspace", status: "Status", decision: "Vehicle decision", suppliers: "Suppliers", shipping: "Shipping", payment: "Payment", reports: "Reports", menu: "Main menu", askDecision: "Send your vehicle procurement question.", askSupplier: "Send a brand or supplier name, or type ALL.", askShipping: "Send: origin port | destination port | 20GP, 40GP or 40HQ", choosePlan: "Choose a subscription plan.", monthly: "Monthly USD 99.90", annual: "Annual USD 899.90", chooseAccount: "Choose the corporate receiving account and currency.", confirmPayment: "Confirm payment order", cancelled: "Current operation cancelled.", askReport: "Describe the report scope.", standardReport: "Automatic PDF", expertReport: "Monthly expert report", noResults: "No matching verified data is currently available.", reportList: "Recent reports", paymentCreated: (reference: string, amount: string, currency: string, account: string) => `Payment order ${reference}\nNet amount: ${currency} ${amount}\nCorporate beneficiary: ${account}\nUse the exact reference and upload proof in the secure workspace.`, decisionQueued: "Your request was recorded. A low-confidence result will be sent for human review.", shippingFormat: "Use this format: Shanghai | Algiers | 40HQ" },
  fr: { welcome: "Bienvenue sur HelloCarCar. Choisissez une action.", linked: (email: string) => `Compte associe a ${email}.`, notLinked: "Associez d'abord Telegram depuis l'espace client securise.", noSubscription: "Le compte est associe, sans abonnement actif.", active: (endsAt: string | null) => `Abonnement actif${endsAt ? ` jusqu'au ${new Date(endsAt).toLocaleDateString("fr")}` : ""}.`, failed: "La demande n'a pas pu aboutir. Reessayez depuis l'espace securise.", workspace: "Ouvrir l'espace", status: "Statut", decision: "Decision vehicule", suppliers: "Fournisseurs", shipping: "Transport", payment: "Paiement", reports: "Rapports", menu: "Menu principal", askDecision: "Envoyez votre question d'achat automobile.", askSupplier: "Envoyez une marque ou un fournisseur, ou ALL.", askShipping: "Envoyez : port origine | port destination | 20GP, 40GP ou 40HQ", choosePlan: "Choisissez un abonnement.", monthly: "Mensuel 99,90 USD", annual: "Annuel 899,90 USD", chooseAccount: "Choisissez le compte professionnel et la devise.", confirmPayment: "Confirmer l'ordre de paiement", cancelled: "Operation annulee.", askReport: "Decrivez le perimetre du rapport.", standardReport: "PDF automatique", expertReport: "Rapport expert mensuel", noResults: "Aucune donnee verifiee correspondante.", reportList: "Rapports recents", paymentCreated: (reference: string, amount: string, currency: string, account: string) => `Ordre ${reference}\nMontant net : ${currency} ${amount}\nBeneficiaire professionnel : ${account}\nUtilisez la reference exacte et ajoutez le justificatif dans l'espace securise.`, decisionQueued: "Votre demande est enregistree. Les resultats incertains passent en revue humaine.", shippingFormat: "Format : Shanghai | Algiers | 40HQ" },
  ar: { welcome: "مرحبا بك في HelloCarCar. اختر الخدمة المطلوبة.", linked: (email: string) => `تم ربط الحساب بالبريد ${email}.`, notLinked: "اربط تيليغرام أولا من مساحة العميل الآمنة.", noSubscription: "الحساب مرتبط، ولكن لا يوجد اشتراك نشط.", active: (endsAt: string | null) => `الاشتراك نشط${endsAt ? ` حتى ${new Date(endsAt).toLocaleDateString("ar-DZ")}` : ""}.`, failed: "تعذر إكمال الطلب. حاول مرة أخرى من مساحة العميل الآمنة.", workspace: "فتح مساحة العميل", status: "حالة الحساب", decision: "قرار السيارة", suppliers: "الموردون", shipping: "الشحن", payment: "الدفع", reports: "التقارير", menu: "القائمة الرئيسية", askDecision: "أرسل سؤال شراء السيارة.", askSupplier: "أرسل اسم علامة أو مورد، أو اكتب ALL.", askShipping: "أرسل: ميناء المغادرة | ميناء الوصول | 20GP أو 40GP أو 40HQ", choosePlan: "اختر خطة الاشتراك.", monthly: "شهري 99.90 دولار", annual: "سنوي 899.90 دولار", chooseAccount: "اختر حساب الشركة المستفيد والعملة.", confirmPayment: "تأكيد أمر الدفع", cancelled: "تم إلغاء العملية الحالية.", askReport: "اكتب نطاق التقرير المطلوب.", standardReport: "PDF تلقائي", expertReport: "تقرير خبير شهري", noResults: "لا توجد حاليا بيانات موثقة مطابقة.", reportList: "التقارير الأخيرة", paymentCreated: (reference: string, amount: string, currency: string, account: string) => `أمر الدفع ${reference}\nالمبلغ الصافي: ${currency} ${amount}\nالمستفيد: ${account}\nاستخدم المرجع نفسه وارفع الإثبات في مساحة العميل.`, decisionQueued: "تم تسجيل الطلب. النتائج منخفضة الثقة ترسل للمراجعة البشرية.", shippingFormat: "الصيغة: Shanghai | Algiers | 40HQ" }
} as const;

type Copy = typeof messages.en | typeof messages.fr | typeof messages.ar;
type Destination = { id: string; label: string; bankName: string; beneficiaryName: string; accountNumber: string; currencies: string[] };
function locale(languageCode?: string): Copy { return languageCode?.startsWith("ar") ? messages.ar : languageCode?.startsWith("fr") ? messages.fr : messages.en; }
function reportLocale(languageCode?: string) { return languageCode?.startsWith("ar") ? "ar-DZ" : languageCode?.startsWith("fr") ? "fr-DZ" : "en"; }
function profile(from: { id: number; username?: string; first_name: string; last_name?: string; language_code?: string }): TelegramProfile { return { telegramUserId: String(from.id), username: from.username, firstName: from.first_name, lastName: from.last_name, languageCode: from.language_code }; }
function mainMenu(copy: Copy) { return new InlineKeyboard().text(copy.decision, "menu_decision").text(copy.suppliers, "menu_suppliers").row().text(copy.shipping, "menu_shipping").text(copy.payment, "menu_payment").row().text(copy.reports, "menu_reports").text(copy.status, "account_status").row().url(copy.workspace, `${webOrigin}/dz/ar/account`); }
async function reset(telegramUserId: string) { await updateConversation(telegramUserId, "IDLE", {}); }

async function sendStatus(ctx: Context) {
  if (!ctx.from) return;
  const copy = locale(ctx.from.language_code);
  try {
    const status = await getAccountStatus(String(ctx.from.id));
    if (!status.linked) return void await ctx.reply(copy.notLinked, { reply_markup: mainMenu(copy) });
    const active = status.subscriptions?.find((item) => item.status === "ACTIVE");
    await ctx.reply(active ? copy.active(active.endsAt) : copy.noSubscription, { reply_markup: mainMenu(copy) });
  } catch { await ctx.reply(copy.failed, { reply_markup: mainMenu(copy) }); }
}

bot.command("start", async (ctx) => {
  if (!ctx.from) return;
  const copy = locale(ctx.from.language_code);
  const startPayload = ctx.match.trim();
  if (startPayload.startsWith("link_")) {
    try { const result = await claimAccountLink(startPayload.slice(5), profile(ctx.from)); await ctx.reply(copy.linked(result.email), { reply_markup: mainMenu(copy) }); }
    catch { await ctx.reply(copy.failed, { reply_markup: mainMenu(copy) }); }
    return;
  }
  await ctx.reply(copy.welcome, { reply_markup: mainMenu(copy) });
});
bot.command("menu", async (ctx) => { if (ctx.from) { await reset(String(ctx.from.id)).catch(() => undefined); await ctx.reply(locale(ctx.from.language_code).welcome, { reply_markup: mainMenu(locale(ctx.from.language_code)) }); } });
bot.command("cancel", async (ctx) => { if (ctx.from) { await reset(String(ctx.from.id)).catch(() => undefined); const copy = locale(ctx.from.language_code); await ctx.reply(copy.cancelled, { reply_markup: mainMenu(copy) }); } });
bot.command("status", sendStatus);
bot.callbackQuery("account_status", async (ctx) => { await ctx.answerCallbackQuery(); await sendStatus(ctx); });

for (const [callback, state, prompt] of [
  ["menu_decision", "AWAITING_DECISION", "askDecision"], ["menu_suppliers", "AWAITING_SUPPLIER", "askSupplier"], ["menu_shipping", "AWAITING_SHIPPING", "askShipping"]
] as const) {
  bot.callbackQuery(callback, async (ctx) => { if (!ctx.from) return; await ctx.answerCallbackQuery(); const copy = locale(ctx.from.language_code); try { await updateConversation(String(ctx.from.id), state); await ctx.reply(copy[prompt]); } catch { await ctx.reply(copy.notLinked, { reply_markup: mainMenu(copy) }); } });
}

bot.callbackQuery("menu_payment", async (ctx) => { if (!ctx.from) return; await ctx.answerCallbackQuery(); const copy = locale(ctx.from.language_code); try { await updateConversation(String(ctx.from.id), "PAYMENT_PLAN"); await ctx.reply(copy.choosePlan, { reply_markup: new InlineKeyboard().text(copy.monthly, "pay_plan_MONTHLY").row().text(copy.annual, "pay_plan_ANNUAL") }); } catch { await ctx.reply(copy.notLinked, { reply_markup: mainMenu(copy) }); } });
bot.callbackQuery(/^pay_plan_(MONTHLY|ANNUAL)$/, async (ctx) => { if (!ctx.from) return; await ctx.answerCallbackQuery(); const copy = locale(ctx.from.language_code); const plan = ctx.match[1] as "MONTHLY" | "ANNUAL"; try { const result = await runBotAction<Destination[]>(String(ctx.from.id), "PAYMENT_DESTINATIONS"); if (!result.length) return void await ctx.reply(copy.noResults, { reply_markup: mainMenu(copy) }); const keyboard = new InlineKeyboard(); for (const destination of result) for (const currency of destination.currencies) keyboard.text(`${destination.label} · ${currency}`, paymentSelectionCallback(plan, currency as "USD" | "CNY" | "HKD", destination.id)).row(); await updateConversation(String(ctx.from.id), "PAYMENT_ACCOUNT", { plan }); await ctx.reply(copy.chooseAccount, { reply_markup: keyboard }); } catch { await ctx.reply(copy.failed, { reply_markup: mainMenu(copy) }); } });
bot.callbackQuery(/^pay_select_(MONTHLY|ANNUAL)_(USD|CNY|HKD)_([a-z0-9]+)$/, async (ctx) => { if (!ctx.from) return; await ctx.answerCallbackQuery(); const copy = locale(ctx.from.language_code); const [, matchedPlan, matchedCurrency, matchedDestinationId] = ctx.match; const plan = matchedPlan as "MONTHLY" | "ANNUAL"; const currency = matchedCurrency as "USD" | "CNY" | "HKD"; const destinationId = matchedDestinationId as string; try { const destinations = await runBotAction<Destination[]>(String(ctx.from.id), "PAYMENT_DESTINATIONS"); const destination = destinations.find((item) => item.id === destinationId); if (!destination) throw new Error("Destination unavailable"); await updateConversation(String(ctx.from.id), "PAYMENT_CONFIRM", { plan, currency, destinationId }); await ctx.reply(`${copy.confirmPayment}\n${plan} · ${currency}\n${destination.bankName}\n${destination.beneficiaryName}\n${destination.accountNumber}`, { reply_markup: new InlineKeyboard().text(copy.confirmPayment, paymentConfirmationCallback(plan, currency, destinationId)) }); } catch { await ctx.reply(copy.failed, { reply_markup: mainMenu(copy) }); } });
bot.callbackQuery(/^pay_confirm_(MONTHLY|ANNUAL)_(USD|CNY|HKD)_([a-z0-9]+)$/, async (ctx) => { if (!ctx.from) return; await ctx.answerCallbackQuery(); const copy = locale(ctx.from.language_code); const [, plan, currency, destinationId] = ctx.match; try { const order = await runBotAction<{ publicReference: string; payableAmount: string; currency: string; destination: { beneficiaryName: string } }>(String(ctx.from.id), "CREATE_PAYMENT_ORDER", { plan, currency, destinationId }); await reset(String(ctx.from.id)); await ctx.reply(copy.paymentCreated(order.publicReference, order.payableAmount, order.currency, order.destination.beneficiaryName), { reply_markup: mainMenu(copy) }); } catch { await ctx.reply(copy.failed, { reply_markup: mainMenu(copy) }); } });

bot.callbackQuery("menu_reports", async (ctx) => { if (!ctx.from) return; await ctx.answerCallbackQuery(); const copy = locale(ctx.from.language_code); try { const reports = await runBotAction<Array<{ id: string; status: string; reportType: string; scope: string }>>(String(ctx.from.id), "REPORTS"); const summary = reports.slice(0, 5).map((item) => `${item.status} · ${item.reportType}\n${item.scope}`).join("\n\n") || copy.noResults; await ctx.reply(`${copy.reportList}\n\n${summary}`, { reply_markup: new InlineKeyboard().text(copy.standardReport, "report_type_STANDARD").row().text(copy.expertReport, "report_type_EXPERT").row().url(copy.workspace, `${webOrigin}/dz/ar/account?view=reports`) }); } catch { await ctx.reply(copy.notLinked, { reply_markup: mainMenu(copy) }); } });
bot.callbackQuery(/^report_type_(STANDARD|EXPERT)$/, async (ctx) => { if (!ctx.from) return; await ctx.answerCallbackQuery(); const reportType = ctx.match[1]; const copy = locale(ctx.from.language_code); try { await updateConversation(String(ctx.from.id), "AWAITING_REPORT_SCOPE", { reportType }); await ctx.reply(copy.askReport); } catch { await ctx.reply(copy.failed, { reply_markup: mainMenu(copy) }); } });

bot.on("message:text", async (ctx) => {
  if (!ctx.from || ctx.message.text.startsWith("/")) return;
  const telegramUserId = String(ctx.from.id);
  const copy = locale(ctx.from.language_code);
  try {
    const conversation = await getConversation(telegramUserId);
    if (conversation.state === "AWAITING_DECISION") {
      await runBotAction(telegramUserId, "DECISION", { locale: reportLocale(ctx.from.language_code), question: ctx.message.text });
      await reset(telegramUserId); await ctx.reply(copy.decisionQueued, { reply_markup: mainMenu(copy) }); return;
    }
    if (conversation.state === "AWAITING_SUPPLIER") {
      const result = await runBotAction<{ items: Array<{ displayName: string; recommendation: string | null; score: number | null; completeness: number }> }>(telegramUserId, "SUPPLIERS", { query: ctx.message.text.toUpperCase() === "ALL" ? undefined : ctx.message.text });
      await reset(telegramUserId); const text = result.items.map((item) => `${item.displayName}\n${item.recommendation || "MASKED"} · ${item.score ?? "-"}/100 · ${item.completeness}%`).join("\n\n") || copy.noResults; await ctx.reply(text, { reply_markup: mainMenu(copy) }); return;
    }
    if (conversation.state === "AWAITING_SHIPPING") {
      const [originPort, destinationPort, containerType] = ctx.message.text.split("|").map((item) => item.trim());
      if (!originPort || !destinationPort || !["20GP", "40GP", "40HQ"].includes(containerType || "")) { await ctx.reply(copy.shippingFormat); return; }
      const quote = await runBotAction<{ carrier: string; oceanFreightUsd: number; transitDays: number; stale: boolean }>(telegramUserId, "SHIPPING", { originPort, destinationPort, containerType });
      await reset(telegramUserId); await ctx.reply(`${quote.stale ? "REVIEW REQUIRED" : "VERIFIED"}\n${quote.carrier}\nUSD ${quote.oceanFreightUsd}\n${quote.transitDays} days`, { reply_markup: mainMenu(copy) }); return;
    }
    if (conversation.state === "AWAITING_REPORT_SCOPE") {
      const reportType = conversation.context?.reportType === "EXPERT" ? "EXPERT" : "STANDARD";
      const report = await runBotAction<{ status: string }>(telegramUserId, "CREATE_REPORT", { locale: reportLocale(ctx.from.language_code), reportType, scope: ctx.message.text });
      await reset(telegramUserId); await ctx.reply(`${copy.reportList}: ${report.status}`, { reply_markup: mainMenu(copy) }); return;
    }
    await ctx.reply(copy.welcome, { reply_markup: mainMenu(copy) });
  } catch { await ctx.reply(copy.failed, { reply_markup: mainMenu(copy) }); }
});

bot.catch((error) => console.error("Telegram bot update failed", error.error));
async function start() {
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL?.replace(/\/$/, "");
  if (webhookUrl) {
    const webhookPath = process.env.TELEGRAM_WEBHOOK_PATH || "/telegram/webhook";
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("TELEGRAM_WEBHOOK_SECRET is required in webhook mode");
    await bot.api.setWebhook(`${webhookUrl}${webhookPath}`, { secret_token: webhookSecret });
    const handleUpdate = webhookCallback(bot, "http");
    const port = Number(process.env.BOT_PORT || 8790);
    createServer((request, response) => {
      if (request.url === "/health") { response.writeHead(200, { "content-type": "application/json" }); response.end(JSON.stringify({ status: "ok" })); return; }
      if (request.url !== webhookPath || request.headers["x-telegram-bot-api-secret-token"] !== webhookSecret) { response.writeHead(404).end(); return; }
      void handleUpdate(request, response);
    }).listen(port, "127.0.0.1", () => console.log(`HelloCarCar Telegram webhook listening on ${port}`));
    return;
  }
  await bot.start({ onStart: () => console.log("HelloCarCar Telegram bot started in long-polling mode") });
}
void start();
