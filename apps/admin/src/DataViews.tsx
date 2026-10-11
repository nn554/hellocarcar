import {
  formatDate,
  formatDateTime,
  recordDetail,
  recordTitle,
  resourceByKey,
  resources,
  reviewTaskTypeLabels,
  statusLabels
} from "./model";
import type {
  CursorPage,
  Person,
  ReviewState,
  ReviewTask,
  ReviewTaskFilterMeta,
  ReviewTaskStatusFilter,
  ReviewTaskType,
  Role,
  SessionUser,
  TrustedDataFilterMeta,
  TrustedRecord,
  TrustedResource,
  ViewKey
} from "./model";

function StatusBadge({ state }: { state: ReviewState }) {
  return <span className="status-badge" data-state={state}>{statusLabels[state]}</span>;
}

function LedgerPagination({
  count,
  totalCount,
  hasNextPage,
  canPrevious,
  onPrevious,
  onNext
}: {
  count: number;
  totalCount: number;
  hasNextPage: boolean;
  canPrevious: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (!totalCount) return null;
  return (
    <div className="ledger-pagination" aria-label="分页">
      <span>本页 {count} 条 · 筛选后 {totalCount} 条</span>
      <div>
        <button type="button" onClick={onPrevious} disabled={!canPrevious} title="上一页" aria-label="上一页">‹</button>
        <button type="button" onClick={onNext} disabled={!hasNextPage} title="下一页" aria-label="下一页">›</button>
      </div>
    </div>
  );
}

export function Dashboard({
  counts,
  tasks,
  openTaskCount,
  onNavigate
}: {
  counts: Record<string, number>;
  tasks: ReviewTask[];
  openTaskCount: number;
  onNavigate: (view: ViewKey) => void;
}) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return (
    <div className="dashboard">
      <section className="summary-strip" aria-label="运营摘要">
        <div><span>当前市场</span><strong>DZ</strong><small>阿尔及利亚 · ACTIVE</small></div>
        <div><span>可信数据记录</span><strong>{total}</strong><small>六类运营资源</small></div>
        <div><span>待处理审核</span><strong>{openTaskCount}</strong><small>{tasks.filter((task) => task.assignedToId).length} 项已分配（本页）</small></div>
        <div><span>计划市场</span><strong>1</strong><small>IR 暂不开放录入</small></div>
      </section>
      <section className="dashboard-section">
        <div className="section-heading">
          <div><span>DATA OPERATIONS</span><h2>可信数据台账</h2></div>
          <small>刷新时间：{formatDateTime(new Date().toISOString())}</small>
        </div>
        <div className="ledger-grid">
          {resources.map((resource) => (
            <button key={resource.key} className="ledger-row" onClick={() => onNavigate(resource.key)}>
              <span>{resource.eyebrow}</span><strong>{resource.label}</strong><b>{counts[resource.key] ?? 0}</b><em>查看</em>
            </button>
          ))}
        </div>
      </section>
      <section className="dashboard-section">
        <div className="section-heading">
          <div><span>REVIEW QUEUE</span><h2>待处理审核</h2></div>
          <button className="text-button" type="button" onClick={() => onNavigate("review-tasks")}>查看全部</button>
        </div>
        {tasks.length ? (
          <div className="task-preview">
            {tasks.map((task) => (
              <div key={task.id}>
                <span>{reviewTaskTypeLabels[task.type]}</span><strong>{task.reason}</strong>
                <small>{task.assignedTo?.displayName ?? task.assignedTo?.email ?? "未分配"}</small>
              </div>
            ))}
          </div>
        ) : <div className="empty-inline">当前没有待处理审核任务</div>}
      </section>
      <section className="boundary-band">
        <div><span>EXTERNAL BOUNDARY</span><strong>外部来源保持只读</strong></div>
        <p>飞书与 NBS 当前不具备写回权限；未配置凭证时，连接器返回明确的未配置状态。</p>
      </section>
    </div>
  );
}

export function ResourcePage({
  resource,
  page,
  query,
  stateFilter,
  canPrevious,
  user,
  onQueryChange,
  onStateFilterChange,
  onPrevious,
  onNext,
  onCreate,
  onEdit,
  onTransition
}: {
  resource: TrustedResource;
  page: CursorPage<TrustedRecord, TrustedDataFilterMeta>;
  query: string;
  stateFilter: ReviewState | "ALL";
  canPrevious: boolean;
  user: SessionUser;
  onQueryChange: (value: string) => void;
  onStateFilterChange: (value: ReviewState | "ALL") => void;
  onPrevious: () => void;
  onNext: () => void;
  onCreate: () => void;
  onEdit: (record: TrustedRecord) => void;
  onTransition: (record: TrustedRecord, to: ReviewState, label: string) => void;
}) {
  const definition = resourceByKey[resource];
  const records = page.items;
  const allStateCount = page.filterMeta.reviewStates.reduce((sum, option) => sum + option.count, 0);

  return (
    <section className="resource-page">
      <div className="resource-toolbar">
        <div><span>{definition.eyebrow.toUpperCase()} LEDGER</span><p>{page.filterMeta.totalCount} 条匹配记录</p></div>
        <div className="toolbar-controls">
          <input className="search-input" type="search" placeholder="搜索当前台账" value={query} onChange={(event) => onQueryChange(event.target.value)} />
          <select value={stateFilter} onChange={(event) => onStateFilterChange(event.target.value as ReviewState | "ALL")} aria-label="审核状态">
            <option value="ALL">全部状态 ({allStateCount})</option>
            {page.filterMeta.reviewStates.map(({ value, count }) => <option key={value} value={value}>{statusLabels[value]} ({count})</option>)}
          </select>
          <button className="primary-button compact" type="button" onClick={onCreate}>＋ 新建</button>
        </div>
      </div>
      {records.length ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>记录</th><th>关键信息</th><th>审核状态</th><th>审核人</th><th>有效期 / 更新时间</th><th className="actions-column">操作</th></tr></thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td><strong>{recordTitle(resource, record)}</strong><small>{record.id}</small></td>
                  <td>{recordDetail(resource, record)}</td>
                  <td><StatusBadge state={record.reviewState} /></td>
                  <td>{record.reviewedBy?.displayName ?? record.reviewedBy?.email ?? "未审核"}</td>
                  <td>{formatDate(record.validUntil ?? record.expiresAt ?? record.updatedAt ?? record.createdAt)}</td>
                  <td><RowActions record={record} role={user.role} onEdit={onEdit} onTransition={onTransition} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="empty-state"><strong>没有匹配记录</strong><span>调整筛选条件或新建一条草稿。</span></div>}
      <LedgerPagination
        count={records.length}
        totalCount={page.filterMeta.totalCount}
        hasNextPage={page.pageInfo.hasNextPage}
        canPrevious={canPrevious}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </section>
  );
}

function RowActions({
  record,
  role,
  onEdit,
  onTransition
}: {
  record: TrustedRecord;
  role: Role;
  onEdit: (record: TrustedRecord) => void;
  onTransition: (record: TrustedRecord, to: ReviewState, label: string) => void;
}) {
  return (
    <div className="row-actions">
      {record.reviewState === "DRAFT" ? <button type="button" onClick={() => onEdit(record)}>编辑</button> : null}
      {record.reviewState === "DRAFT" || record.reviewState === "NEEDS_LOCAL_CONFIRMATION" ? (
        <button type="button" onClick={() => onTransition(record, "PENDING_REVIEW", "提交审核")}>送审</button>
      ) : null}
      {record.reviewState === "PENDING_REVIEW" && role === "ADMIN" ? (
        <>
          <button className="approve" type="button" onClick={() => onTransition(record, "VERIFIED", "审核通过")}>通过</button>
          <button className="danger" type="button" onClick={() => onTransition(record, "REJECTED", "驳回")}>驳回</button>
        </>
      ) : null}
      {record.reviewState === "VERIFIED" ? <button type="button" onClick={() => onTransition(record, "EXPIRED", "标记过期")}>过期</button> : null}
      {record.reviewState === "REJECTED" || record.reviewState === "EXPIRED" || record.reviewState === "NEEDS_LOCAL_CONFIRMATION" ? (
        <button type="button" onClick={() => onTransition(record, "DRAFT", "转为草稿")}>转草稿</button>
      ) : null}
    </div>
  );
}

export function ReviewQueue({
  page,
  query,
  statusFilter,
  typeFilter,
  canPrevious,
  user,
  assignees,
  onQueryChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onPrevious,
  onNext,
  onAssign,
  onComplete,
  onOpenReport
}: {
  page: CursorPage<ReviewTask, ReviewTaskFilterMeta>;
  query: string;
  statusFilter: ReviewTaskStatusFilter;
  typeFilter: ReviewTaskType | "ALL";
  canPrevious: boolean;
  user: SessionUser;
  assignees: Person[];
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: ReviewTaskStatusFilter) => void;
  onTypeFilterChange: (value: ReviewTaskType | "ALL") => void;
  onPrevious: () => void;
  onNext: () => void;
  onAssign: (task: ReviewTask, assignedToId: string | null) => void;
  onComplete: (task: ReviewTask) => void;
  onOpenReport: (task: ReviewTask) => void;
}) {
  const tasks = page.items;
  const adminAssignees = assignees.filter((assignee) => assignee.role === "ADMIN");
  const openCount = page.filterMeta.statuses.find((option) => option.value === "OPEN")?.count ?? 0;
  const allStatusCount = page.filterMeta.statuses.reduce((sum, option) => sum + option.count, 0);
  const allTypeCount = page.filterMeta.types.reduce((sum, option) => sum + option.count, 0);
  return (
    <section className="resource-page">
      <div className="resource-toolbar">
        <div><span>REVIEW OPERATIONS</span><p>{openCount} 项待处理</p></div>
        <div className="review-toolbar-controls">
          <input className="search-input" type="search" placeholder="搜索原因或实体" value={query} onChange={(event) => onQueryChange(event.target.value)} />
          <select value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value as ReviewTaskType | "ALL")} aria-label="任务类型">
            <option value="ALL">全部类型 ({allTypeCount})</option>
            {page.filterMeta.types.map(({ value, count }) => <option key={value} value={value}>{reviewTaskTypeLabels[value]} ({count})</option>)}
          </select>
          <div className="segmented-control">
            {(["OPEN", "COMPLETED", "ALL"] as const).map((value) => {
              const count = value === "ALL" ? allStatusCount : page.filterMeta.statuses.find((option) => option.value === value)?.count ?? 0;
              return (
                <button key={value} className={statusFilter === value ? "selected" : ""} onClick={() => onStatusFilterChange(value)}>
                  {value === "OPEN" ? "待处理" : value === "COMPLETED" ? "已完成" : "全部"} {count}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {tasks.length ? (
        <div className="review-list">
          {tasks.map((task) => (
            <article key={task.id} className="review-row">
              <div className="review-type"><span>{reviewTaskTypeLabels[task.type]}</span><small>{formatDateTime(task.createdAt)}</small></div>
              <div className="review-reason">
                <strong>{task.reason}</strong><small>{task.entityType} · {task.entityId}</small>
                {task.resolution ? <p>{task.resolution}</p> : null}
              </div>
              <div className="review-assignment">
                {task.status === "COMPLETED" ? (
                  <span>{task.completedBy?.displayName ?? task.completedBy?.email ?? "已完成"}</span>
                ) : user.role === "ADMIN" ? (
                  <select value={task.assignedToId ?? ""} onChange={(event) => onAssign(task, event.target.value || null)} aria-label="分配审核人">
                    <option value="">未分配</option>
                    {adminAssignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.displayName ?? assignee.email}</option>)}
                  </select>
                ) : <span>{task.assignedTo?.displayName ?? task.assignedTo?.email ?? "未分配"}</span>}
              </div>
              <div><span className="task-status" data-status={task.status}>{task.status === "OPEN" ? "待处理" : "已完成"}</span></div>
              <div className="review-actions">
                {task.type === "REPORT" ? (
                  <button className="primary-button compact" type="button" onClick={() => onOpenReport(task)}>查看详情</button>
                ) : null}
                {task.type !== "REPORT" && user.role === "ADMIN" && task.status === "OPEN" && task.assignedToId === user.id ? (
                  <button className="primary-button compact" type="button" onClick={() => onComplete(task)}>完成</button>
                ) : null}
                {user.role === "ADMIN" && task.status === "OPEN" && !task.assignedToId ? (
                  <button type="button" onClick={() => onAssign(task, user.id)}>领取</button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : <div className="empty-state"><strong>当前队列为空</strong><span>这个筛选范围内没有审核任务。</span></div>}
      <LedgerPagination
        count={tasks.length}
        totalCount={page.filterMeta.totalCount}
        hasNextPage={page.pageInfo.hasNextPage}
        canPrevious={canPrevious}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </section>
  );
}
