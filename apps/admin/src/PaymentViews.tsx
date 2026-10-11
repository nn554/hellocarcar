import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { ApiRequestError, apiRequest } from "./api";
import { formatDateTime } from "./model";

type PaymentDestination = { id: string; label: string; bankName: string; beneficiaryName: string; accountNumber: string; swiftCode: string | null; bankAddress: string | null; currencies: string[]; instructions: string | null; isActive: boolean };
type PaymentProof = { id: string; originalName: string | null; mimeType: string | null; status: string; submittedAt: string | null };
type PaymentOrder = { id: string; publicReference: string; payableAmount: string; baseAmountUsd: string; currency: string; planInterval: string; status: string; expiresAt: string; createdAt: string; reviewReason: string | null; organization: { name: string }; createdBy: { email: string }; destination: PaymentDestination; proofs: PaymentProof[]; subscription: Subscription | null };
type ExchangeRate = { id: string; baseCurrency: string; quoteCurrency: string; rate: string; validFrom: string; validUntil: string; createdBy: { email: string; displayName: string | null } };
type StatementImport = { id: string; fileName: string; status: string; totalRows: number; matchedRows: number; failedRows: number; createdAt: string; destination: PaymentDestination };
type Refund = { id: string; amount: string; currency: string; status: string; reason: string; bankReference: string | null; createdAt: string; paymentOrder: { publicReference: string; organization: { name: string } }; requestedBy: { email: string } };
type Subscription = { id: string; status: string; startsAt: string | null; endsAt: string | null; fullReportLimit: number; organization: { name: string }; marketScopes: Array<{ market: { code: string } }>; paymentOrder: { publicReference: string } | null };
type PaymentData = { destinations: PaymentDestination[]; rates: ExchangeRate[]; orders: PaymentOrder[]; statements: StatementImport[]; refunds: Refund[]; subscriptions: Subscription[] };
type Tab = "orders" | "destinations" | "rates" | "statements" | "refunds" | "subscriptions";
type Dialog =
  | { kind: "order"; item: PaymentOrder; decision: "APPROVE" | "REJECT" | "SUPPLEMENT" }
  | { kind: "refund"; item: Refund; decision: "APPROVE" | "REJECT" | "COMPLETE" }
  | { kind: "subscription"; item: Subscription };

const tabs: Array<{ key: Tab; label: string }> = [
  { key: "orders", label: "付款订单" }, { key: "destinations", label: "收款账户" }, { key: "rates", label: "锁定汇率" },
  { key: "statements", label: "银行流水" }, { key: "refunds", label: "退款" }, { key: "subscriptions", label: "订阅" }
];

const statusLabel: Record<string, string> = {
  AWAITING_PAYMENT: "待付款", PROOF_SUBMITTED: "已交凭证", UNDER_REVIEW: "审核中", NEEDS_SUPPLEMENT: "待补充",
  PAID: "已到账", REJECTED: "已驳回", CANCELLED: "已取消", EXPIRED: "已过期", PARTIALLY_REFUNDED: "部分退款",
  REFUNDED: "已退款", REQUESTED: "待审核", APPROVED: "已批准", COMPLETED: "已完成", ACTIVE: "生效中", PENDING_PAYMENT: "待付款",
  PROCESSING: "处理中", FAILED: "失败", MATCHED: "已匹配"
};

function message(error: unknown) {
  if (error instanceof ApiRequestError) return error.message;
  return error instanceof Error ? error.message : "发生未知错误";
}

function money(value: string, currency: string) {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency }).format(Number(value));
}

export function PaymentOperations() {
  const [tab, setTab] = useState<Tab>("orders");
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [tab]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [destinations, rates, orders, statements, refunds, subscriptions] = await Promise.all([
        apiRequest<PaymentDestination[]>("/v1/admin/payments/destinations"),
        apiRequest<ExchangeRate[]>("/v1/admin/payments/exchange-rates"),
        apiRequest<PaymentOrder[]>("/v1/admin/payments/orders"),
        apiRequest<StatementImport[]>("/v1/admin/payments/statement-imports"),
        apiRequest<Refund[]>("/v1/admin/payments/refunds"),
        apiRequest<Subscription[]>("/v1/admin/payments/subscriptions")
      ]);
      setData({ destinations, rates, orders, statements, refunds, subscriptions });
    } catch (loadError) {
      setError(message(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const mutate = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      setDialog(null);
      await load();
    } catch (mutationError) {
      setError(message(mutationError));
    } finally {
      setBusy(false);
    }
  };

  const openProof = async (orderId: string, proofId: string) => {
    try {
      const result = await apiRequest<{ url: string }>(`/v1/admin/payments/orders/${orderId}/proofs/${proofId}/download`);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (proofError) {
      setError(message(proofError));
    }
  };

  if (loading && !data) return <div className="loading-state"><span></span>正在读取支付数据</div>;
  return (
    <section className="payment-page">
      <div className="payment-header">
        <div><span>FINANCE OPERATIONS</span><p>仅展示公司对公收款账户；到账审核不会由流水匹配自动通过。</p></div>
        <button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}>刷新</button>
      </div>
      {error ? <div className="form-error payment-error" role="alert">{error}</div> : null}
      <div ref={tabsRef} className="payment-tabs" role="tablist">
        {tabs.map((item) => <button data-tab={item.key} key={item.key} className={tab === item.key ? "selected" : ""} onClick={() => setTab(item.key)}>{item.label}</button>)}
      </div>
      {data && tab === "orders" ? <OrdersView items={data.orders} onReview={(item, decision) => setDialog({ kind: "order", item, decision })} onProof={openProof} /> : null}
      {data && tab === "destinations" ? <DestinationsView items={data.destinations} busy={busy} onChanged={(action) => mutate(action)} /> : null}
      {data && tab === "rates" ? <RatesView items={data.rates} busy={busy} onChanged={(action) => mutate(action)} /> : null}
      {data && tab === "statements" ? <StatementsView items={data.statements} destinations={data.destinations} busy={busy} onChanged={(action) => mutate(action)} /> : null}
      {data && tab === "refunds" ? <RefundsView items={data.refunds} onReview={(item, decision) => setDialog({ kind: "refund", item, decision })} /> : null}
      {data && tab === "subscriptions" ? <SubscriptionsView items={data.subscriptions} onEdit={(item) => setDialog({ kind: "subscription", item })} /> : null}
      {dialog ? <FinanceDialog dialog={dialog} busy={busy} onCancel={() => setDialog(null)} onSubmit={(payload) => mutate(() => submitDialog(dialog, payload))} /> : null}
    </section>
  );
}

function OrdersView({ items, onReview, onProof }: { items: PaymentOrder[]; onReview: (item: PaymentOrder, decision: "APPROVE" | "REJECT" | "SUPPLEMENT") => void; onProof: (orderId: string, proofId: string) => void }) {
  return <TableWrap empty={!items.length}>
    <table className="finance-table"><thead><tr><th>订单</th><th>客户 / 收款账户</th><th>金额</th><th>状态</th><th>凭证</th><th>操作</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}>
      <td><strong>{item.publicReference}</strong><small>{item.planInterval === "ANNUAL" ? "年度" : "月度"} · {formatDateTime(item.createdAt)}</small></td>
      <td><strong>{item.organization.name}</strong><small>{item.destination.bankName} · {item.createdBy.email}</small></td>
      <td>{money(item.payableAmount, item.currency)}<small>基准 USD {item.baseAmountUsd}</small></td>
      <td><span className="status-badge" data-state={item.status}>{statusLabel[item.status] ?? item.status}</span>{item.reviewReason ? <small>{item.reviewReason}</small> : null}</td>
      <td><div className="row-actions">{item.proofs.map((proof) => <button key={proof.id} type="button" onClick={() => onProof(item.id, proof.id)}>{proof.originalName || "查看凭证"}</button>)}</div></td>
      <td><div className="row-actions">{["PROOF_SUBMITTED", "UNDER_REVIEW", "NEEDS_SUPPLEMENT"].includes(item.status) ? <><button className="approve" onClick={() => onReview(item, "APPROVE")}>确认到账</button><button onClick={() => onReview(item, "SUPPLEMENT")}>要求补充</button><button className="danger" onClick={() => onReview(item, "REJECT")}>驳回</button></> : null}</div></td>
    </tr>)}</tbody></table>
  </TableWrap>;
}

function DestinationsView({ items, busy, onChanged }: { items: PaymentDestination[]; busy: boolean; onChanged: (action: () => Promise<unknown>) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currencies = form.getAll("currencies").map(String);
    onChanged(() => apiRequest("/v1/admin/payments/destinations", { method: "POST", body: JSON.stringify(Object.fromEntries([
      ["label", form.get("label")], ["bankName", form.get("bankName")], ["beneficiaryName", form.get("beneficiaryName")], ["accountNumber", form.get("accountNumber")],
      ["swiftCode", form.get("swiftCode") || undefined], ["bankAddress", form.get("bankAddress") || undefined], ["instructions", form.get("instructions") || undefined], ["currencies", currencies]
    ])) }));
  };
  return <><form className="operations-form" onSubmit={submit}><label><span>账户标签</span><input name="label" required /></label><label><span>银行名称</span><input name="bankName" required /></label><label><span>公司收款人</span><input name="beneficiaryName" required /></label><label><span>账号</span><input name="accountNumber" required /></label><label><span>SWIFT</span><input name="swiftCode" /></label><label><span>银行地址</span><input name="bankAddress" /></label><fieldset><legend>收款币种</legend>{["USD", "CNY", "HKD"].map((currency) => <label key={currency}><input type="checkbox" name="currencies" value={currency} defaultChecked={currency === "USD"} />{currency}</label>)}</fieldset><label className="wide-field"><span>付款说明</span><textarea name="instructions" rows={2} /></label><button className="primary-button" disabled={busy}>新增对公账户</button></form>
    <TableWrap empty={!items.length}><table className="finance-table"><thead><tr><th>账户</th><th>公司收款人</th><th>账号 / SWIFT</th><th>币种</th><th>状态</th><th>操作</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.label}</strong><small>{item.bankName}</small></td><td>{item.beneficiaryName}</td><td>{item.accountNumber}<small>{item.swiftCode || "无 SWIFT"}</small></td><td>{item.currencies.join(" / ")}</td><td><span className="status-badge" data-state={item.isActive ? "VERIFIED" : "EXPIRED"}>{item.isActive ? "启用" : "停用"}</span></td><td><button className="secondary-button compact" onClick={() => onChanged(() => apiRequest(`/v1/admin/payments/destinations/${item.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !item.isActive }) }))}>{item.isActive ? "停用" : "启用"}</button></td></tr>)}</tbody></table></TableWrap></>;
}

function RatesView({ items, busy, onChanged }: { items: ExchangeRate[]; busy: boolean; onChanged: (action: () => Promise<unknown>) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onChanged(() => apiRequest("/v1/admin/payments/exchange-rates", { method: "POST", body: JSON.stringify({ quoteCurrency: form.get("quoteCurrency"), rate: Number(form.get("rate")) }) })); };
  return <><form className="operations-form compact-form" onSubmit={submit}><label><span>报价币种</span><select name="quoteCurrency"><option>CNY</option><option>HKD</option></select></label><label><span>1 USD 兑换</span><input name="rate" type="number" step="0.00000001" min="0.00000001" required /></label><button className="primary-button" disabled={busy}>发布 24 小时汇率</button></form><TableWrap empty={!items.length}><table className="finance-table"><thead><tr><th>币对</th><th>汇率</th><th>生效</th><th>失效</th><th>创建人</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.baseCurrency}/{item.quoteCurrency}</strong></td><td>{item.rate}</td><td>{formatDateTime(item.validFrom)}</td><td>{formatDateTime(item.validUntil)}</td><td>{item.createdBy.displayName || item.createdBy.email}</td></tr>)}</tbody></table></TableWrap></>;
}

function StatementsView({ items, destinations, busy, onChanged }: { items: StatementImport[]; destinations: PaymentDestination[]; busy: boolean; onChanged: (action: () => Promise<unknown>) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const destinationId = String(form.get("destinationId")); onChanged(() => apiRequest(`/v1/admin/payments/destinations/${destinationId}/statement-imports`, { method: "POST", body: form })); };
  return <><form className="operations-form compact-form" onSubmit={submit}><label><span>收款账户</span><select name="destinationId" required>{destinations.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.label} · {item.bankName}</option>)}</select></label><label><span>CSV / XLSX 流水</span><input name="file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required /></label><button className="primary-button" disabled={busy || !destinations.length}>导入并匹配</button></form><TableWrap empty={!items.length}><table className="finance-table"><thead><tr><th>文件</th><th>账户</th><th>状态</th><th>总行数</th><th>匹配</th><th>失败</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.fileName}</strong><small>{formatDateTime(item.createdAt)}</small></td><td>{item.destination.label}</td><td>{statusLabel[item.status] ?? item.status}</td><td>{item.totalRows}</td><td>{item.matchedRows}</td><td>{item.failedRows}</td></tr>)}</tbody></table></TableWrap></>;
}

function RefundsView({ items, onReview }: { items: Refund[]; onReview: (item: Refund, decision: "APPROVE" | "REJECT" | "COMPLETE") => void }) { return <TableWrap empty={!items.length}><table className="finance-table"><thead><tr><th>付款订单</th><th>客户</th><th>退款金额</th><th>状态</th><th>原因 / 银行参考</th><th>操作</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.paymentOrder.publicReference}</strong><small>{formatDateTime(item.createdAt)}</small></td><td>{item.paymentOrder.organization.name}<small>{item.requestedBy.email}</small></td><td>{money(item.amount, item.currency)}</td><td>{statusLabel[item.status] ?? item.status}</td><td>{item.reason}<small>{item.bankReference || "尚无银行参考号"}</small></td><td><div className="row-actions">{item.status === "REQUESTED" ? <><button className="approve" onClick={() => onReview(item, "APPROVE")}>批准</button><button className="danger" onClick={() => onReview(item, "REJECT")}>拒绝</button></> : null}{item.status === "APPROVED" ? <button className="approve" onClick={() => onReview(item, "COMPLETE")}>登记线下完成</button> : null}</div></td></tr>)}</tbody></table></TableWrap>; }

function SubscriptionsView({ items, onEdit }: { items: Subscription[]; onEdit: (item: Subscription) => void }) { return <TableWrap empty={!items.length}><table className="finance-table"><thead><tr><th>客户</th><th>市场</th><th>状态</th><th>开始</th><th>结束</th><th>操作</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.organization.name}</strong><small>{item.paymentOrder?.publicReference || "手工订阅"}</small></td><td>{item.marketScopes.map((scope) => scope.market.code).join(" / ")}</td><td>{statusLabel[item.status] ?? item.status}</td><td>{formatDateTime(item.startsAt)}</td><td>{formatDateTime(item.endsAt)}</td><td><button className="secondary-button compact" onClick={() => onEdit(item)}>调整</button></td></tr>)}</tbody></table></TableWrap>; }

function TableWrap({ empty, children }: { empty: boolean; children: ReactNode }) { return empty ? <div className="empty-state"><strong>暂无记录</strong><span>当前分类中还没有数据。</span></div> : <div className="finance-table-wrap">{children}</div>; }

function FinanceDialog({ dialog, busy, onCancel, onSubmit }: { dialog: Dialog; busy: boolean; onCancel: () => void; onSubmit: (payload: { reason?: string; bankReference?: string; status?: string; endsAt?: string }) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSubmit({ reason: String(form.get("reason") || ""), bankReference: String(form.get("bankReference") || ""), status: String(form.get("status") || ""), endsAt: form.get("endsAt") ? new Date(String(form.get("endsAt"))).toISOString() : undefined }); };
  const title = dialog.kind === "order" ? "付款审核" : dialog.kind === "refund" ? "退款处理" : "调整订阅";
  return <div className="modal-backdrop"><section className="reason-dialog" role="dialog" aria-modal="true"><header><div><span>FINANCE ACTION</span><h2>{title}</h2></div><button className="icon-button" onClick={onCancel} aria-label="关闭">×</button></header><form onSubmit={submit}>{dialog.kind === "subscription" ? <><label><span>订阅状态</span><select name="status" defaultValue={dialog.item.status}><option value="ACTIVE">生效中</option><option value="CANCELLED">已取消</option><option value="EXPIRED">已过期</option></select></label><label><span>到期时间</span><input name="endsAt" type="datetime-local" defaultValue={dialog.item.endsAt ? new Date(new Date(dialog.item.endsAt).getTime() - new Date(dialog.item.endsAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : ""} required /></label></> : <><p>{dialog.kind === "order" ? dialog.item.publicReference : dialog.item.paymentOrder.publicReference}</p><label><span>处理说明</span><textarea name="reason" minLength={3} rows={4} required /></label>{dialog.kind === "refund" && dialog.decision === "COMPLETE" ? <label><span>银行退款参考号</span><input name="bankReference" minLength={3} required /></label> : null}</>}<footer><button className="secondary-button" type="button" onClick={onCancel}>取消</button><button className="primary-button" disabled={busy}>{busy ? "处理中..." : "确认"}</button></footer></form></section></div>;
}

function submitDialog(dialog: Dialog, payload: { reason?: string; bankReference?: string; status?: string; endsAt?: string }) {
  if (dialog.kind === "order") return apiRequest(`/v1/admin/payments/orders/${dialog.item.id}/review`, { method: "PATCH", body: JSON.stringify({ decision: dialog.decision, reason: payload.reason }) });
  if (dialog.kind === "refund") return apiRequest(`/v1/admin/payments/refunds/${dialog.item.id}`, { method: "PATCH", body: JSON.stringify({ decision: dialog.decision, reason: payload.reason, bankReference: payload.bankReference || undefined }) });
  return apiRequest(`/v1/admin/payments/subscriptions/${dialog.item.id}`, { method: "PATCH", body: JSON.stringify({ status: payload.status, endsAt: payload.endsAt }) });
}
