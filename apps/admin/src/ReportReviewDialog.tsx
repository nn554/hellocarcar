import type { FormEvent } from "react";
import type { ReportReviewDetail } from "./model";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ReportReviewDialog({ detail, busy, onClose, onReview }: {
  detail: ReportReviewDetail;
  busy: boolean;
  onClose: () => void;
  onReview: (decision: "APPROVE" | "REJECT", notes: string) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    onReview(String(values.get("decision")) as "APPROVE" | "REJECT", String(values.get("notes")));
  };

  return (
    <div className="modal-backdrop">
      <section className="reason-dialog report-review-dialog" role="dialog" aria-modal="true" aria-labelledby="report-review-title">
        <header>
          <div><span>EXPERT REPORT</span><h2 id="report-review-title">报告审核详情</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <div className="report-review-summary">
          <div><span>状态</span><strong>{detail.status}</strong></div>
          <div><span>客户组织</span><strong>{detail.organization.name}</strong></div>
          <div><span>申请人</span><strong>{detail.requester.displayName || detail.requester.email}</strong></div>
          <div><span>市场 / 语言</span><strong>{detail.market.code} / {detail.locale}</strong></div>
          <div><span>车型</span><strong>{detail.vehicleModel ? `${detail.vehicleModel.make} ${detail.vehicleModel.name}` : "未指定"}</strong></div>
          <div><span>申请时间</span><strong>{formatDateTime(detail.createdAt)}</strong></div>
        </div>
        <div className="report-review-scope"><span>报告范围</span><p>{detail.scope}</p></div>
        {detail.reviews.length ? <div className="report-review-history"><span>审核历史</span>{detail.reviews.map((review) => <p key={review.id}><strong>{review.state}</strong> {review.notes} · {review.reviewer.displayName || review.reviewer.email}</p>)}</div> : null}
        {detail.status === "FULL_PENDING_REVIEW" ? (
          <form onSubmit={submit}>
            <label><span>审核说明</span><textarea name="notes" minLength={3} rows={4} required /></label>
            <footer>
              <button className="secondary-button" type="button" onClick={onClose}>取消</button>
              <button className="danger" name="decision" value="REJECT" disabled={busy}>驳回</button>
              <button className="primary-button" name="decision" value="APPROVE" disabled={busy}>批准并生成</button>
            </footer>
          </form>
        ) : <footer><button className="secondary-button" type="button" onClick={onClose}>关闭</button></footer>}
      </section>
    </div>
  );
}
