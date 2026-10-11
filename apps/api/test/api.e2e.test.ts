import "reflect-metadata";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { HttpEnvelopeInterceptor } from "../src/common/http-envelope.interceptor";
import { HttpExceptionEnvelopeFilter } from "../src/common/http-exception.filter";
import { PrismaService } from "../src/database/prisma.service";

describe("HelloCarCar API foundation", () => {
  let app: INestApplication;
  let db: PrismaService;
  const email = `buyer-${Date.now()}@example.com`;
  const runId = Date.now().toString();
  const unassignedAnalystEmail = `unassigned-analyst-${runId}@example.com`;
  let cookie = "";
  let analystCookie = "";
  let reviewerCookie = "";
  let reviewerUserId = "";
  let paymentDestinationId = "";
  let exchangeRateId = "";
  let paymentOrderId = "";
  let paymentSubscriptionId = "";
  let statementImportId = "";
  let telegramUserId = "";

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.EMAIL_DELIVERY_MODE = "console";
    process.env.OTP_SECRET = "test-otp-secret-with-more-than-32-characters";
    process.env.TELEGRAM_BOT_API_SECRET = "test-telegram-bot-api-secret-32-characters";
    process.env.TELEGRAM_BOT_USERNAME = "hellocarcar_test_bot";
    process.env.OBJECT_STORAGE_BUCKET = "hellocarcar-test";
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalInterceptors(new HttpEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionEnvelopeFilter());
    await app.init();
    db = app.get(PrismaService);

    const operationsOrganization = await db.organization.findUniqueOrThrow({ where: { id: "org-hellocarcar-operations" } });
    const unassignedAnalyst = await db.user.create({
      data: { email: unassignedAnalystEmail, displayName: "Unassigned test analyst", emailVerifiedAt: new Date() }
    });
    await db.membership.create({
      data: { userId: unassignedAnalyst.id, organizationId: operationsOrganization.id, role: "ANALYST" }
    });
  });

  afterAll(async () => {
    const buyer = await db.user.findUnique({
      where: { email },
      include: { memberships: { select: { organizationId: true } } }
    });
    const buyerOrganizationIds = buyer?.memberships.map((membership) => membership.organizationId) ?? [];
    const decisions = buyer ? await db.decisionQuery.findMany({ where: { userId: buyer.id }, select: { id: true } }) : [];
    const reports = buyer ? await db.reportRequest.findMany({ where: { requesterId: buyer.id }, select: { id: true } }) : [];
    const testVehicle = await db.vehicleModel.findFirst({ where: { make: `W3TEST-${runId}` } });
    const testEvidence = await db.evidence.findMany({ where: { sourceRef: { startsWith: `test:${runId}:` } }, select: { id: true } });
    const evidenceIds = testEvidence.map((item) => item.id);
    const testPolicies = await db.countryPolicy.findMany({ where: { title: `W3 test policy ${runId}` }, select: { id: true } });
    const suppliers = await db.supplier.findMany({ where: { legalName: `W3 Test Supplier ${runId}` }, select: { id: true } });
    const capabilities = await db.supplierMarketCapability.findMany({ where: { supplierId: { in: suppliers.map((item) => item.id) } }, select: { id: true } });
    const prices = testVehicle ? await db.priceObservation.findMany({ where: { vehicleModelId: testVehicle.id }, select: { id: true } }) : [];
    const eligibilityRecords = testVehicle ? await db.vehicleMarketEligibility.findMany({ where: { vehicleModelId: testVehicle.id }, select: { id: true } }) : [];
    const testEntityIds = [
      ...evidenceIds,
      ...testPolicies.map((item) => item.id),
      ...suppliers.map((item) => item.id),
      ...capabilities.map((item) => item.id),
      ...prices.map((item) => item.id),
      ...eligibilityRecords.map((item) => item.id),
      ...decisions.map((item) => item.id),
      ...reports.map((item) => item.id),
      ...(paymentOrderId ? [paymentOrderId] : [])
    ];
    const reviewTasks = await db.reviewTask.findMany({ where: { entityId: { in: testEntityIds } }, select: { id: true } });
    const reviewTaskIds = reviewTasks.map((task) => task.id);
    await db.reviewTask.deleteMany({ where: { id: { in: reviewTaskIds } } });
    if (paymentOrderId) {
      await db.refundRecord.deleteMany({ where: { paymentOrderId } });
      await db.statementMatch.deleteMany({ where: { paymentOrderId } });
      await db.paymentProof.deleteMany({ where: { paymentOrderId } });
      await db.paymentOrder.deleteMany({ where: { id: paymentOrderId } });
    }
    if (statementImportId) {
      await db.statementMatch.deleteMany({ where: { statementImportId } });
      await db.statementImport.deleteMany({ where: { id: statementImportId } });
    }
    if (paymentSubscriptionId) {
      await db.subscriptionMarketScope.deleteMany({ where: { subscriptionId: paymentSubscriptionId } });
      await db.subscription.deleteMany({ where: { id: paymentSubscriptionId } });
    }
    if (exchangeRateId) await db.exchangeRateSnapshot.deleteMany({ where: { id: exchangeRateId } });
    if (paymentDestinationId) await db.paymentDestination.deleteMany({ where: { id: paymentDestinationId } });
    const testUsers = await db.user.findMany({ where: { email: { in: [email, unassignedAnalystEmail] } }, select: { id: true } });
    const testUserIds = testUsers.map((item) => item.id);
    await db.notification.deleteMany({ where: { userId: { in: testUserIds } } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: testUserIds } }, { entityId: { in: testEntityIds } }, { entityType: "ReviewTask", entityId: { in: reviewTaskIds } }] } });
    await db.entitlementUsage.deleteMany({ where: { organizationId: { in: buyerOrganizationIds } } });
    await db.reportRequest.deleteMany({ where: { id: { in: reports.map((item) => item.id) } } });
    await db.decisionQuery.deleteMany({ where: { id: { in: decisions.map((item) => item.id) } } });
    if (testVehicle) {
      await db.priceObservation.deleteMany({ where: { vehicleModelId: testVehicle.id } });
      await db.vehicleMarketEligibility.deleteMany({ where: { vehicleModelId: testVehicle.id } });
      await db.vehicleModel.delete({ where: { id: testVehicle.id } });
    }
    await db.countryPolicy.deleteMany({ where: { title: `W3 test policy ${runId}` } });
    await db.supplierMarketCapability.deleteMany({ where: { supplierId: { in: suppliers.map((item) => item.id) } } });
    await db.supplier.deleteMany({ where: { id: { in: suppliers.map((item) => item.id) } } });
    await db.evidence.deleteMany({ where: { id: { in: evidenceIds } } });
    await db.session.deleteMany({ where: { userId: { in: testUserIds } } });
    await db.membership.deleteMany({ where: { userId: { in: testUserIds } } });
    await db.otpChallenge.deleteMany({ where: { email: { in: [email, unassignedAnalystEmail] } } });
    await db.user.deleteMany({ where: { id: { in: testUserIds } } });
    await db.organization.deleteMany({ where: { id: { in: buyerOrganizationIds } } });
    await app?.close();
  });

  const login = async (loginEmail: string) => {
    await db.otpChallenge.deleteMany({ where: { email: loginEmail } });
    const otp = await request(app.getHttpServer()).post("/v1/auth/otp/request").send({ email: loginEmail, marketCode: "DZ" }).expect(201);
    const verified = await request(app.getHttpServer()).post("/v1/auth/otp/verify").send({ email: loginEmail, marketCode: "DZ", code: otp.body.data.debugCode }).expect(201);
    const [setCookie] = verified.get("set-cookie") ?? [];
    const [sessionCookie] = setCookie?.split(";") ?? [];
    if (!sessionCookie) throw new Error(`OTP verification did not return a session cookie for ${loginEmail}`);
    return sessionCookie;
  };

  it("exposes health and isolated market metadata publicly", async () => {
    const health = await request(app.getHttpServer()).get("/health").expect(200);
    expect(health.body.data.mode).toBe("multi-market-foundation");
    const markets = await request(app.getHttpServer()).get("/v1/markets").expect(200);
    expect(markets.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "DZ", status: "ACTIVE" }),
      expect.objectContaining({ code: "IR", status: "PLANNED" })
    ]));
  });

  it("serves only current verified Algeria vehicles and blocks the planned Iran pack", async () => {
    const dz = await request(app.getHttpServer()).get("/v1/vehicles?marketCode=DZ").expect(200);
    expect(Array.isArray(dz.body.data)).toBe(true);
    expect(dz.body.data.every((vehicle: { priceRange: { reviewState: string }; eligibility: { reviewState: string } }) =>
      vehicle.priceRange.reviewState === "VERIFIED" && vehicle.eligibility.reviewState === "VERIFIED"
    )).toBe(true);
    await request(app.getHttpServer()).get("/v1/vehicles?marketCode=IR").expect(404);
  });

  it("publishes only current reviewed policy summaries and keeps the planned market closed", async () => {
    const policies = await request(app.getHttpServer()).get("/v1/policies?marketCode=DZ").expect(200);
    expect(Array.isArray(policies.body.data)).toBe(true);
    for (const policy of policies.body.data) {
      expect(policy).toMatchObject({ id: expect.any(String), title: expect.any(String), updatedAt: expect.any(String) });
      expect(policy).not.toHaveProperty("sourceUrl");
      expect(policy).not.toHaveProperty("reviewState");
    }
    await request(app.getHttpServer()).get("/v1/policies?marketCode=IR").expect(404);
  });

  it("creates an email OTP session cookie", async () => {
    const otp = await request(app.getHttpServer()).post("/v1/auth/otp/request").send({ email, marketCode: "DZ" }).expect(201);
    expect(otp.body.data.debugCode).toMatch(/^\d{6}$/);
    const verified = await request(app.getHttpServer()).post("/v1/auth/otp/verify").send({ email, marketCode: "DZ", code: otp.body.data.debugCode }).expect(201);
    const [setCookie] = verified.get("set-cookie") ?? [];
    const [sessionCookie] = setCookie?.split(";") ?? [];
    if (!sessionCookie) throw new Error("OTP verification did not return a session cookie");
    cookie = sessionCookie;
    const me = await request(app.getHttpServer()).get("/v1/auth/me").set("Cookie", cookie).expect(200);
    expect(me.body.data.email).toBe(email);
    expect(me.body.data.marketScopes).toEqual([]);
  });

  it("links one Telegram identity with a single-use token", async () => {
    const link = await request(app.getHttpServer())
      .post("/v1/auth/telegram/link-token")
      .set("Cookie", cookie)
      .expect(201);
    expect(link.body.data.token).toHaveLength(43);
    expect(link.body.data.deepLink).toContain("https://t.me/hellocarcar_test_bot?start=link_");

    telegramUserId = `${Date.now()}`;
    const claimed = await request(app.getHttpServer())
      .post("/v1/auth/telegram/claim")
      .set("x-telegram-bot-secret", process.env.TELEGRAM_BOT_API_SECRET!)
      .send({ token: link.body.data.token, telegramUserId, username: "hcc_test_buyer", languageCode: "en" })
      .expect(201);
    expect(claimed.body.data).toMatchObject({ linked: true, email, telegramUserId });

    const me = await request(app.getHttpServer()).get("/v1/auth/me").set("Cookie", cookie).expect(200);
    expect(me.body.data.telegram).toMatchObject({ telegramUserId, username: "hcc_test_buyer" });
    const status = await request(app.getHttpServer())
      .get(`/v1/auth/telegram/status/${telegramUserId}`)
      .set("x-telegram-bot-secret", process.env.TELEGRAM_BOT_API_SECRET!)
      .expect(200);
    expect(status.body.data).toMatchObject({ linked: true, email, subscriptions: [] });

    const replay = await request(app.getHttpServer())
      .post("/v1/auth/telegram/claim")
      .set("x-telegram-bot-secret", process.env.TELEGRAM_BOT_API_SECRET!)
      .send({ token: link.body.data.token, telegramUserId })
      .expect(401);
    expect(replay.body.error.code).toBe("TELEGRAM_LINK_INVALID");
  });

  it("persists Telegram conversations and isolates bot actions to the linked user", async () => {
    const botSecret = process.env.TELEGRAM_BOT_API_SECRET!;

    const forbiddenConversation = await request(app.getHttpServer())
      .get(`/v1/bot/conversations/${telegramUserId}`)
      .set("x-telegram-bot-secret", "wrong-secret")
      .expect(403);
    expect(forbiddenConversation.body.error.code).toBe("TELEGRAM_BOT_FORBIDDEN");

    const initialConversation = await request(app.getHttpServer())
      .get(`/v1/bot/conversations/${telegramUserId}`)
      .set("x-telegram-bot-secret", botSecret)
      .expect(200);
    expect(initialConversation.body.data).toMatchObject({
      channel: "TELEGRAM",
      externalConversationId: telegramUserId,
      state: "IDLE",
      context: {}
    });

    const updatedConversation = await request(app.getHttpServer())
      .put(`/v1/bot/conversations/${telegramUserId}`)
      .set("x-telegram-bot-secret", botSecret)
      .send({ state: "AWAITING_DECISION", context: { locale: "en" } })
      .expect(200);
    expect(updatedConversation.body.data).toMatchObject({ state: "AWAITING_DECISION", context: { locale: "en" } });

    const persistedConversation = await request(app.getHttpServer())
      .get(`/v1/bot/conversations/${telegramUserId}`)
      .set("x-telegram-bot-secret", botSecret)
      .expect(200);
    expect(persistedConversation.body.data).toMatchObject({ state: "AWAITING_DECISION", context: { locale: "en" } });

    const forbiddenAction = await request(app.getHttpServer())
      .post("/v1/bot/actions")
      .set("x-telegram-bot-secret", "wrong-secret")
      .send({ telegramUserId, marketCode: "DZ", action: "REPORTS" })
      .expect(403);
    expect(forbiddenAction.body.error.code).toBe("TELEGRAM_BOT_FORBIDDEN");

    const unlinkedAction = await request(app.getHttpServer())
      .post("/v1/bot/actions")
      .set("x-telegram-bot-secret", botSecret)
      .send({ telegramUserId: "99999999999999999999", marketCode: "DZ", action: "REPORTS" })
      .expect(401);
    expect(unlinkedAction.body.error.code).toBe("TELEGRAM_ACCOUNT_NOT_LINKED");

    const botDecision = await request(app.getHttpServer())
      .post("/v1/bot/actions")
      .set("x-telegram-bot-secret", botSecret)
      .send({
        telegramUserId,
        marketCode: "DZ",
        action: "DECISION",
        locale: "en",
        question: "Should this linked buyer consider a verified SUV for Algeria?"
      })
      .expect(201);
    const linkedBuyer = await db.user.findUniqueOrThrow({ where: { email }, include: { memberships: true } });
    const storedDecision = await db.decisionQuery.findUniqueOrThrow({
      where: { id: botDecision.body.data.id },
      include: { user: { include: { memberships: true } } }
    });
    expect(storedDecision.userId).toBe(linkedBuyer.id);
    expect(storedDecision.user.memberships[0]!.organizationId).toBe(linkedBuyer.memberships[0]!.organizationId);
  });

  it("routes unconfigured AI decisions to human review without consuming successful-query allowance", async () => {
    for (let index = 0; index < 4; index += 1) {
      const result = await request(app.getHttpServer())
        .post("/v1/decisions")
        .set("Cookie", cookie)
        .send({ marketCode: "DZ", locale: "en", question: `Should I consider vehicle option number ${index + 1} for Algeria?` })
        .expect(201);
      expect(result.body.data.status).toBe("HUMAN_REVIEW_REQUIRED");
    }
    const buyer = await db.user.findUniqueOrThrow({ where: { email }, include: { memberships: true } });
    const consumed = await db.entitlementUsage.count({
      where: { organizationId: buyer.memberships[0]!.organizationId, kind: "FREE_DECISION" }
    });
    expect(consumed).toBe(0);
  });

  it("queues one masked report preview and blocks the second", async () => {
    const first = await request(app.getHttpServer())
      .post("/v1/reports")
      .set("Cookie", cookie)
      .send({ marketCode: "DZ", locale: "en", scope: "Compare verified FOB evidence and supplier risks for one electric SUV." })
      .expect(201);
    expect(first.body.data.isMasked).toBe(true);
    expect(first.body.data.reportType).toBe("STANDARD");
    expect(first.body.data.status).toBe("PREVIEW_GENERATING");

    await request(app.getHttpServer())
      .get(`/v1/reports/${first.body.data.id}/download`)
      .set("Cookie", cookie)
      .expect(404);

    const second = await request(app.getHttpServer())
      .post("/v1/reports")
      .set("Cookie", cookie)
      .send({ marketCode: "DZ", locale: "en", scope: "Generate another complete supplier report without a VIP subscription." })
      .expect(402);
    expect(second.body.error.code).toBe("VIP_REQUIRED");
  });

  it("does not expose another organization's seeded PI order", async () => {
    const result = await request(app.getHttpServer())
      .get("/v1/orders/lookup?marketCode=DZ&pi=NBS-2026-AL-001")
      .set("Cookie", cookie)
      .expect(404);
    expect(result.body.error.code).toBe("ORDER_NOT_FOUND");
  });

  it("enforces trusted-data roles and analyst market assignments", async () => {
    const buyerDenied = await request(app.getHttpServer())
      .get("/v1/admin/trusted-data/evidence?marketCode=DZ")
      .set("Cookie", cookie)
      .expect(403);
    expect(buyerDenied.body.error.code).toBe("ROLE_FORBIDDEN");

    const unassignedCookie = await login(unassignedAnalystEmail);
    const marketDenied = await request(app.getHttpServer())
      .get("/v1/admin/trusted-data/evidence?marketCode=DZ")
      .set("Cookie", unassignedCookie)
      .expect(403);
    expect(marketDenied.body.error.code).toBe("MARKET_ASSIGNMENT_REQUIRED");

    analystCookie = await login("analyst@hellocarcar.local");
    reviewerCookie = await login("reviewer@hellocarcar.local");
    const me = await request(app.getHttpServer()).get("/v1/auth/me").set("Cookie", analystCookie).expect(200);
    expect(me.body.data).toMatchObject({ role: "ANALYST", marketScopes: ["DZ"] });
    const reviewerMe = await request(app.getHttpServer()).get("/v1/auth/me").set("Cookie", reviewerCookie).expect(200);
    reviewerUserId = reviewerMe.body.data.id;
  });

  it("activates one subscription after a reviewed corporate bank transfer", async () => {
    const destination = await request(app.getHttpServer())
      .post("/v1/admin/payments/destinations")
      .set("Cookie", reviewerCookie)
      .send({
        label: `Test corporate account ${runId}`,
        bankName: "Test Hong Kong Bank",
        beneficiaryName: "HelloCarCar Test Limited",
        accountNumber: `TEST-${runId}`,
        swiftCode: "TESTHKHH",
        currencies: ["USD", "CNY"]
      })
      .expect(201);
    paymentDestinationId = destination.body.data.id;
    const destinations = await request(app.getHttpServer()).get("/v1/admin/payments/destinations").set("Cookie", reviewerCookie).expect(200);
    expect(destinations.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: paymentDestinationId, isActive: true })]));
    await request(app.getHttpServer()).patch(`/v1/admin/payments/destinations/${paymentDestinationId}`).set("Cookie", reviewerCookie).send({ isActive: false }).expect(200);
    await request(app.getHttpServer()).patch(`/v1/admin/payments/destinations/${paymentDestinationId}`).set("Cookie", reviewerCookie).send({ isActive: true }).expect(200);
    const rate = await request(app.getHttpServer())
      .post("/v1/admin/payments/exchange-rates")
      .set("Cookie", reviewerCookie)
      .send({ quoteCurrency: "CNY", rate: 7.2 })
      .expect(201);
    exchangeRateId = rate.body.data.id;
    const rates = await request(app.getHttpServer()).get("/v1/admin/payments/exchange-rates").set("Cookie", reviewerCookie).expect(200);
    expect(rates.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: exchangeRateId, quoteCurrency: "CNY" })]));

    const order = await request(app.getHttpServer())
      .post("/v1/payments/orders")
      .set("Cookie", cookie)
      .send({ marketCode: "DZ", plan: "MONTHLY", currency: "CNY", destinationId: paymentDestinationId })
      .expect(201);
    paymentOrderId = order.body.data.id;
    expect(order.body.data).toMatchObject({ status: "AWAITING_PAYMENT", currency: "CNY" });
    expect(Number(order.body.data.payableAmount)).toBe(719.28);

    const proof = await request(app.getHttpServer())
      .post(`/v1/payments/orders/${paymentOrderId}/proofs`)
      .set("Cookie", cookie)
      .attach("file", Buffer.from("%PDF-1.4\n% HelloCarCar test payment proof\n"), { filename: "payment-proof.pdf", contentType: "application/pdf" })
      .expect(201);
    expect(proof.body.data).toMatchObject({ status: "PENDING_REVIEW", mimeType: "application/pdf" });
    const proofDownload = await request(app.getHttpServer())
      .get(`/v1/admin/payments/orders/${paymentOrderId}/proofs/${proof.body.data.id}/download`)
      .set("Cookie", reviewerCookie)
      .expect(200);
    expect(proofDownload.body.data.url).toContain("hellocarcar-test");

    const statementCsv = [
      "bank_reference,payer_name,payment_reference,amount,currency,occurred_at",
      `BANK-${runId},Test Buyer,${order.body.data.publicReference},719.28,CNY,2026-08-14T06:00:00.000Z`
    ].join("\n");
    const statementImport = await request(app.getHttpServer())
      .post(`/v1/admin/payments/destinations/${paymentDestinationId}/statement-imports`)
      .set("Cookie", reviewerCookie)
      .attach("file", Buffer.from(statementCsv), { filename: `statement-${runId}.csv`, contentType: "text/csv" })
      .expect(201);
    statementImportId = statementImport.body.data.id;
    expect(statementImport.body.data).toMatchObject({ status: "COMPLETED", totalRows: 1, matchedRows: 1, failedRows: 0 });
    expect(statementImport.body.data.matches[0]).toMatchObject({ paymentOrderId, status: "MATCHED" });

    const approved = await request(app.getHttpServer())
      .patch(`/v1/admin/payments/orders/${paymentOrderId}/review`)
      .set("Cookie", reviewerCookie)
      .send({ decision: "APPROVE", reason: "Net CNY amount and bank reference verified in closed test." })
      .expect(200);
    paymentSubscriptionId = approved.body.data.subscriptionId;
    expect(approved.body.data).toMatchObject({ status: "PAID", subscription: { status: "ACTIVE", fullReportLimit: 1 } });

    const repeatedApproval = await request(app.getHttpServer())
      .patch(`/v1/admin/payments/orders/${paymentOrderId}/review`)
      .set("Cookie", reviewerCookie)
      .send({ decision: "APPROVE", reason: "Idempotency retry after client timeout." })
      .expect(200);
    expect(repeatedApproval.body.data.subscriptionId).toBe(paymentSubscriptionId);
    expect(await db.subscription.count({ where: { id: paymentSubscriptionId } })).toBe(1);

    const automaticReport = await request(app.getHttpServer())
      .post("/v1/reports")
      .set("Cookie", cookie)
      .send({ marketCode: "DZ", locale: "en", reportType: "STANDARD", scope: "Create an automatic paid PDF from the currently verified supplier evidence." })
      .expect(201);
    expect(automaticReport.body.data).toMatchObject({ reportType: "STANDARD", isMasked: false, status: "FULL_GENERATING" });

    const expertReport = await request(app.getHttpServer())
      .post("/v1/reports")
      .set("Cookie", cookie)
      .send({ marketCode: "DZ", locale: "en", reportType: "EXPERT", scope: "Prepare the monthly expert assessment with a human review before release." })
      .expect(201);
    expect(expertReport.body.data).toMatchObject({ reportType: "EXPERT", isMasked: false, status: "FULL_PENDING_REVIEW" });

    const reportReviewDetail = await request(app.getHttpServer())
      .get(`/v1/admin/reports/${expertReport.body.data.id}`)
      .set("Cookie", reviewerCookie)
      .expect(200);
    expect(reportReviewDetail.body.data).toMatchObject({
      id: expertReport.body.data.id,
      reportType: "EXPERT",
      status: "FULL_PENDING_REVIEW",
      organization: { id: expect.any(String) },
      requester: { email },
      reviewTask: { type: "REPORT", status: "OPEN" }
    });

    await request(app.getHttpServer())
      .get(`/v1/admin/reports/${expertReport.body.data.id}`)
      .set("Cookie", cookie)
      .expect(403);

    const reviewedReport = await request(app.getHttpServer())
      .patch(`/v1/admin/reports/${expertReport.body.data.id}/review`)
      .set("Cookie", reviewerCookie)
      .send({ decision: "APPROVE", notes: "Evidence scope and customer request reviewed for generation." })
      .expect(200);
    expect(reviewedReport.body.data.status).toBe("FULL_GENERATING");

    const secondExpert = await request(app.getHttpServer())
      .post("/v1/reports")
      .set("Cookie", cookie)
      .send({ marketCode: "DZ", locale: "en", reportType: "EXPERT", scope: "Request a second expert report in the same subscription month." })
      .expect(402);
    expect(secondExpert.body.error.code).toBe("REPORT_LIMIT_REACHED");

    const subscriptions = await request(app.getHttpServer()).get("/v1/admin/payments/subscriptions").set("Cookie", reviewerCookie).expect(200);
    expect(subscriptions.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: paymentSubscriptionId, status: "ACTIVE" })]));
    const extendedEnd = new Date(new Date(approved.body.data.subscription.endsAt).getTime() + 24 * 60 * 60_000).toISOString();
    const adjusted = await request(app.getHttpServer())
      .patch(`/v1/admin/payments/subscriptions/${paymentSubscriptionId}`)
      .set("Cookie", reviewerCookie)
      .send({ endsAt: extendedEnd })
      .expect(200);
    expect(new Date(adjusted.body.data.endsAt).toISOString()).toBe(extendedEnd);

    const requestedRefund = await request(app.getHttpServer())
      .post(`/v1/payments/orders/${paymentOrderId}/refunds`)
      .set("Cookie", cookie)
      .send({ amount: 10, reason: "Closed-test partial refund request." })
      .expect(201);
    const refunds = await request(app.getHttpServer()).get("/v1/admin/payments/refunds").set("Cookie", reviewerCookie).expect(200);
    expect(refunds.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: requestedRefund.body.data.id, status: "REQUESTED" })]));
    await request(app.getHttpServer()).patch(`/v1/admin/payments/refunds/${requestedRefund.body.data.id}`).set("Cookie", reviewerCookie).send({ decision: "APPROVE", reason: "Approved for offline bank processing." }).expect(200);
    const completedRefund = await request(app.getHttpServer()).patch(`/v1/admin/payments/refunds/${requestedRefund.body.data.id}`).set("Cookie", reviewerCookie).send({ decision: "COMPLETE", reason: "Bank transfer completed.", bankReference: `REFUND-${runId}` }).expect(200);
    expect(completedRefund.body.data).toMatchObject({ status: "COMPLETED", bankReference: `REFUND-${runId}` });
  });

  it("publishes a new DZ vehicle only after evidence-backed admin review", async () => {
    const dz = await db.market.findUniqueOrThrow({ where: { code: "DZ" } });
    const vehicle = await db.vehicleModel.create({
      data: { make: `W3TEST-${runId}`, name: "Review Gate Vehicle", modelYear: 2026, bodyType: "SUV", energyType: "EV", seats: 5 }
    });

    const evidence = await request(app.getHttpServer())
      .post("/v1/admin/trusted-data/evidence")
      .set("Cookie", analystCookie)
      .send({
        marketCode: "DZ",
        kind: "CLOSED_TEST_SOURCE",
        title: `W3 test evidence ${runId}`,
        sourceSystem: "MANUAL",
        sourceRef: `test:${runId}:evidence`,
        observedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86_400_000).toISOString(),
        contentHash: `0123456789abcdef${runId}`
      })
      .expect(201);
    const evidenceId = evidence.body.data.id as string;

    const editedEvidence = await request(app.getHttpServer())
      .patch("/v1/admin/trusted-data/evidence/" + evidenceId + "?marketCode=DZ")
      .set("Cookie", analystCookie)
      .send({ title: "W3 edited evidence " + runId })
      .expect(200);
    expect(editedEvidence.body.data.title).toBe("W3 edited evidence " + runId);

    await request(app.getHttpServer())
      .post(`/v1/admin/trusted-data/evidence/${evidenceId}/transitions?marketCode=DZ`)
      .set("Cookie", analystCookie)
      .send({ to: "PENDING_REVIEW", reason: "Ready for independent review" })
      .expect(201);
    const lockedDraft = await request(app.getHttpServer())
      .patch("/v1/admin/trusted-data/evidence/" + evidenceId + "?marketCode=DZ")
      .set("Cookie", analystCookie)
      .send({ title: "This edit must be rejected after submission" })
      .expect(400);
    expect(lockedDraft.body.error.code).toBe("DRAFT_EDIT_ONLY");
    const selfReview = await request(app.getHttpServer())
      .post(`/v1/admin/trusted-data/evidence/${evidenceId}/transitions?marketCode=DZ`)
      .set("Cookie", analystCookie)
      .send({ to: "VERIFIED", reason: "Attempted self review" })
      .expect(403);
    expect(selfReview.body.error.code).toBe("REVIEWER_REQUIRED");
    await request(app.getHttpServer())
      .post(`/v1/admin/trusted-data/evidence/${evidenceId}/transitions?marketCode=DZ`)
      .set("Cookie", reviewerCookie)
      .send({ to: "VERIFIED", reason: "Source snapshot and validity checked" })
      .expect(201);

    const patchConflictEvidence = await request(app.getHttpServer())
      .post("/v1/admin/trusted-data/evidence")
      .set("Cookie", analystCookie)
      .send({
        marketCode: "DZ",
        kind: "CLOSED_TEST_SOURCE",
        title: `W3 patch conflict evidence ${runId}`,
        sourceSystem: "MANUAL",
        sourceRef: `test:${runId}:patch-conflict`,
        observedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86_400_000).toISOString(),
        contentHash: `abcdef0123456789${runId}`
      })
      .expect(201);
    const patchConflict = await request(app.getHttpServer())
      .patch(`/v1/admin/trusted-data/evidence/${patchConflictEvidence.body.data.id}?marketCode=DZ`)
      .set("Cookie", analystCookie)
      .send({ sourceRef: `test:${runId}:evidence` })
      .expect(200);
    expect(patchConflict.body.data.reviewState).toBe("NEEDS_LOCAL_CONFIRMATION");
    const patchConflictTask = await db.reviewTask.findFirst({
      where: { entityType: "Evidence", entityId: patchConflictEvidence.body.data.id, status: "OPEN" }
    });
    expect(patchConflictTask).toBeTruthy();

    const conflictingEvidence = await request(app.getHttpServer())
      .post("/v1/admin/trusted-data/evidence")
      .set("Cookie", analystCookie)
      .send({
        marketCode: "DZ",
        kind: "CLOSED_TEST_SOURCE",
        title: `W3 conflicting evidence ${runId}`,
        sourceSystem: "MANUAL",
        sourceRef: `test:${runId}:evidence`,
        observedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86_400_000).toISOString(),
        contentHash: `fedcba9876543210${runId}`
      })
      .expect(201);
    expect(conflictingEvidence.body.data.reviewState).toBe("NEEDS_LOCAL_CONFIRMATION");
    await request(app.getHttpServer())
      .post(`/v1/admin/trusted-data/evidence/${conflictingEvidence.body.data.id}/transitions?marketCode=DZ`)
      .set("Cookie", analystCookie)
      .send({ to: "PENDING_REVIEW", reason: "Escalate conflicting source snapshot" })
      .expect(201);
    const conflictBlocked = await request(app.getHttpServer())
      .post(`/v1/admin/trusted-data/evidence/${conflictingEvidence.body.data.id}/transitions?marketCode=DZ`)
      .set("Cookie", reviewerCookie)
      .send({ to: "VERIFIED", reason: "Should remain blocked while conflict is open" })
      .expect(400);
    expect(conflictBlocked.body.error.code).toBe("EVIDENCE_CONFLICT_OPEN");

    const taskList = await request(app.getHttpServer())
      .get("/v1/admin/review-tasks?marketCode=DZ&status=OPEN")
      .set("Cookie", analystCookie)
      .expect(200);
    const conflictTask = taskList.body.data.items.find((task: { entityId: string }) => task.entityId === conflictingEvidence.body.data.id);
    expect(conflictTask).toBeTruthy();
    await request(app.getHttpServer())
      .patch("/v1/admin/review-tasks/" + conflictTask.id + "?marketCode=DZ")
      .set("Cookie", analystCookie)
      .send({ assignedToId: reviewerUserId })
      .expect(403);
    await request(app.getHttpServer())
      .patch("/v1/admin/review-tasks/" + conflictTask.id + "?marketCode=DZ")
      .set("Cookie", reviewerCookie)
      .send({ assignedToId: reviewerUserId })
      .expect(200);
    const completedTask = await request(app.getHttpServer())
      .patch("/v1/admin/review-tasks/" + conflictTask.id + "?marketCode=DZ")
      .set("Cookie", reviewerCookie)
      .send({ status: "COMPLETED", resolution: "Compared both snapshots and documented the accepted source." })
      .expect(200);
    expect(completedTask.body.data).toMatchObject({ status: "COMPLETED", completedById: reviewerUserId });
    await request(app.getHttpServer())
      .post("/v1/admin/trusted-data/evidence/" + conflictingEvidence.body.data.id + "/transitions?marketCode=DZ")
      .set("Cookie", reviewerCookie)
      .send({ to: "VERIFIED", reason: "Conflict review task completed by an administrator" })
      .expect(201);

    const price = await request(app.getHttpServer())
      .post("/v1/admin/trusted-data/price-observations")
      .set("Cookie", analystCookie)
      .send({
        marketCode: "DZ",
        vehicleModelId: vehicle.id,
        amount: 19999,
        currency: "USD",
        incoterm: "FOB",
        observedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86_400_000).toISOString(),
        sourceSystem: "MANUAL",
        sourceRef: `test:${runId}:price`,
        evidenceIds: [evidenceId]
      })
      .expect(201);
    const eligibility = await request(app.getHttpServer())
      .post("/v1/admin/trusted-data/eligibility")
      .set("Cookie", analystCookie)
      .send({ marketCode: "DZ", vehicleModelId: vehicle.id, eligible: true, restrictions: { testOnly: true }, evidenceIds: [evidenceId] })
      .expect(201);

    const beforeReview = await request(app.getHttpServer()).get(`/v1/vehicles?marketCode=DZ&query=${runId}`).expect(200);
    expect(beforeReview.body.data).toHaveLength(0);

    for (const [resource, id] of [["price-observations", price.body.data.id], ["eligibility", eligibility.body.data.id]] as const) {
      await request(app.getHttpServer())
        .post(`/v1/admin/trusted-data/${resource}/${id}/transitions?marketCode=DZ`)
        .set("Cookie", analystCookie)
        .send({ to: "PENDING_REVIEW", reason: "Ready for independent review" })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/v1/admin/trusted-data/${resource}/${id}/transitions?marketCode=DZ`)
        .set("Cookie", reviewerCookie)
        .send({ to: "VERIFIED", reason: "Evidence and market scope checked" })
        .expect(201);
    }

    const afterReview = await request(app.getHttpServer()).get(`/v1/vehicles?marketCode=DZ&query=${runId}`).expect(200);
    expect(afterReview.body.data).toHaveLength(1);
    expect(afterReview.body.data[0]).toMatchObject({ id: vehicle.id, eligibility: { eligible: true, reviewState: "VERIFIED" } });
    expect(afterReview.body.data[0].priceRange).toMatchObject({ from: 19999, to: 19999, reviewState: "VERIFIED" });

    const policy = await request(app.getHttpServer())
      .post("/v1/admin/trusted-data/policies")
      .set("Cookie", analystCookie)
      .send({
        marketCode: "DZ",
        category: "CLOSED_TEST",
        title: `W3 test policy ${runId}`,
        summary: "A test-only policy record used to prove evidence linkage and audit behavior.",
        effectiveAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        sourceUrl: "https://example.com/test-policy",
        evidenceIds: [evidenceId]
      })
      .expect(201);
    expect(policy.body.data.id).toBeTruthy();

    const supplier = await request(app.getHttpServer())
      .post("/v1/admin/trusted-data/suppliers")
      .set("Cookie", analystCookie)
      .send({ marketCode: "DZ", legalName: `W3 Test Supplier ${runId}`, displayName: "W3 Test Supplier", countryCode: "CN" })
      .expect(201);
    const capability = await request(app.getHttpServer())
      .post("/v1/admin/trusted-data/supplier-capabilities")
      .set("Cookie", analystCookie)
      .send({ marketCode: "DZ", supplierId: supplier.body.data.id, score: 80, dimensions: { testOnly: true }, evidenceIds: [evidenceId] })
      .expect(201);
    expect(capability.body.data.id).toBeTruthy();

    const auditCount = await db.auditLog.count({
      where: { marketCode: dz.code, entityId: { in: [evidenceId, price.body.data.id, eligibility.body.data.id, policy.body.data.id, supplier.body.data.id, capability.body.data.id] } }
    });
    expect(auditCount).toBeGreaterThanOrEqual(10);
  });

  it("paginates and filters trusted-data and review-task ledgers", async () => {
    const firstEvidencePage = await request(app.getHttpServer())
      .get("/v1/admin/trusted-data/evidence?marketCode=DZ&reviewState=VERIFIED&limit=1")
      .set("Cookie", analystCookie)
      .expect(200);
    expect(firstEvidencePage.body.data).toMatchObject({
      items: [expect.objectContaining({ reviewState: "VERIFIED" })],
      pageInfo: { limit: 1, hasNextPage: true },
      filterMeta: { totalCount: expect.any(Number) }
    });
    expect(firstEvidencePage.body.data.filterMeta.reviewStates).toHaveLength(6);
    const evidenceCursor = firstEvidencePage.body.data.pageInfo.nextCursor as string;
    const secondEvidencePage = await request(app.getHttpServer())
      .get("/v1/admin/trusted-data/evidence?marketCode=DZ&reviewState=VERIFIED&limit=1&cursor=" + encodeURIComponent(evidenceCursor))
      .set("Cookie", analystCookie)
      .expect(200);
    expect(secondEvidencePage.body.data.items).toHaveLength(1);
    expect(secondEvidencePage.body.data.items[0].id).not.toBe(firstEvidencePage.body.data.items[0].id);

    const searchedEvidence = await request(app.getHttpServer())
      .get("/v1/admin/trusted-data/evidence?marketCode=DZ&query=" + encodeURIComponent("W3 edited evidence " + runId))
      .set("Cookie", analystCookie)
      .expect(200);
    expect(searchedEvidence.body.data.filterMeta.totalCount).toBe(1);
    expect(searchedEvidence.body.data.items[0].title).toBe("W3 edited evidence " + runId);

    const invalidCursor = await request(app.getHttpServer())
      .get("/v1/admin/trusted-data/evidence?marketCode=DZ&cursor=bm90LWpzb24")
      .set("Cookie", analystCookie)
      .expect(400);
    expect(invalidCursor.body.error.code).toBe("INVALID_CURSOR");
    const wrongLedgerCursor = await request(app.getHttpServer())
      .get("/v1/admin/trusted-data/policies?marketCode=DZ&cursor=" + encodeURIComponent(evidenceCursor))
      .set("Cookie", analystCookie)
      .expect(400);
    expect(wrongLedgerCursor.body.error.code).toBe("INVALID_CURSOR");

    const firstTaskPage = await request(app.getHttpServer())
      .get("/v1/admin/review-tasks?marketCode=DZ&status=ALL&type=EVIDENCE&limit=1")
      .set("Cookie", analystCookie)
      .expect(200);
    expect(firstTaskPage.body.data.items).toHaveLength(1);
    expect(firstTaskPage.body.data.pageInfo).toMatchObject({ limit: 1, hasNextPage: true });
    expect(firstTaskPage.body.data.filterMeta.statuses).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: "OPEN", count: expect.any(Number) }),
      expect.objectContaining({ value: "COMPLETED", count: expect.any(Number) })
    ]));
    expect(firstTaskPage.body.data.filterMeta.types).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: "EVIDENCE", count: expect.any(Number) })
    ]));
    const secondTaskPage = await request(app.getHttpServer())
      .get("/v1/admin/review-tasks?marketCode=DZ&status=ALL&type=EVIDENCE&limit=1&cursor=" + encodeURIComponent(firstTaskPage.body.data.pageInfo.nextCursor))
      .set("Cookie", analystCookie)
      .expect(200);
    expect(secondTaskPage.body.data.items[0].id).not.toBe(firstTaskPage.body.data.items[0].id);
  });
});
