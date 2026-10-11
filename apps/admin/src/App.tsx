import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError, apiRequest } from "./api";
import { Login } from "./Auth";
import { Dashboard, ResourcePage, ReviewQueue } from "./DataViews";
import { ReasonDialog, RecordDrawer } from "./Dialogs";
import { PaymentOperations } from "./PaymentViews";
import { ReportReviewDialog } from "./ReportReviewDialog";
import { ledgerPath, popCursor, pushCursor } from "./ledger-state";
import { recordTitle, resources, viewLabels } from "./model";
import type {
  CursorPage,
  ReviewState,
  ReportReviewDetail,
  ReviewTask,
  ReviewTaskFilterMeta,
  ReviewTaskStatusFilter,
  ReviewTaskType,
  SessionUser,
  TrustedDataFilterMeta,
  TrustedRecord,
  TrustedResource,
  ViewKey,
  WorkspaceOptions
} from "./model";

function errorMessage(error: unknown) {
  if (error instanceof ApiRequestError) return error.message;
  return error instanceof Error ? error.message : "发生未知错误";
}

function AppShell({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [view, setView] = useState<ViewKey>(user.role === "FINANCE" ? "payments" : user.role === "REVIEWER" ? "review-tasks" : "dashboard");
  const [recordPage, setRecordPage] = useState<CursorPage<TrustedRecord, TrustedDataFilterMeta> | null>(null);
  const [reviewPage, setReviewPage] = useState<CursorPage<ReviewTask, ReviewTaskFilterMeta> | null>(null);
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [options, setOptions] = useState<WorkspaceOptions | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [recordQuery, setRecordQuery] = useState("");
  const [recordReviewState, setRecordReviewState] = useState<ReviewState | "ALL">("ALL");
  const [recordCursors, setRecordCursors] = useState<string[]>([]);
  const [reviewQuery, setReviewQuery] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewTaskStatusFilter>("OPEN");
  const [reviewType, setReviewType] = useState<ReviewTaskType | "ALL">("ALL");
  const [reviewCursors, setReviewCursors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [drawer, setDrawer] = useState<{ resource: TrustedResource; record?: TrustedRecord } | null>(null);
  const [transition, setTransition] = useState<{
    resource: TrustedResource;
    record: TrustedRecord;
    to: ReviewState;
    label: string;
  } | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<ReviewTask | null>(null);
  const [reportReview, setReportReview] = useState<ReportReviewDetail | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    navigationRef.current?.querySelector<HTMLElement>(`[data-view="${view}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [view]);

  const refresh = useCallback(() => {
    setRecordCursors([]);
    setReviewCursors([]);
    setRefreshToken((value) => value + 1);
  }, []);

  const navigate = useCallback((nextView: ViewKey) => {
    setView(nextView);
    setPageError("");
    if (nextView === "review-tasks") {
      setReviewQuery("");
      setReviewStatus("OPEN");
      setReviewType("ALL");
      setReviewCursors([]);
    } else if (nextView !== "dashboard") {
      setRecordQuery("");
      setRecordReviewState("ALL");
      setRecordCursors([]);
    }
  }, []);

  useEffect(() => {
    if (!(["ANALYST", "ADMIN"] as const).includes(user.role as "ANALYST" | "ADMIN")) return;
    let active = true;
    apiRequest<WorkspaceOptions>("/v1/admin/trusted-data/workspace-options?marketCode=DZ")
      .then((result) => { if (active) setOptions(result); })
      .catch((loadError) => { if (active) setPageError(errorMessage(loadError)); });
    return () => { active = false; };
  }, [refreshToken, user.role]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPageError("");
    const load = async () => {
      if (view === "payments") {
        return;
      }
      if (view === "dashboard") {
        const [openTasks, ...resourceLists] = await Promise.all([
          apiRequest<CursorPage<ReviewTask, ReviewTaskFilterMeta>>(ledgerPath("/v1/admin/review-tasks", { marketCode: "DZ", status: "OPEN", limit: 5 })),
          ...resources.map((resource) => apiRequest<CursorPage<TrustedRecord, TrustedDataFilterMeta>>(
            ledgerPath("/v1/admin/trusted-data/" + resource.key, { marketCode: "DZ", limit: 1 })
          ))
        ]);
        if (!active) return;
        setTasks(openTasks.items);
        setOpenTaskCount(openTasks.filterMeta.totalCount);
        setCounts(Object.fromEntries(resources.map((resource, index) => [
          resource.key,
          resourceLists[index]?.filterMeta.totalCount ?? 0
        ])));
      } else if (view === "review-tasks") {
        const result = await apiRequest<CursorPage<ReviewTask, ReviewTaskFilterMeta>>(ledgerPath("/v1/admin/review-tasks", {
          marketCode: "DZ",
          status: reviewStatus,
          type: reviewType,
          query: reviewQuery || undefined,
          limit: 20,
          cursor: reviewCursors.at(-1)
        }));
        if (!active) return;
        setReviewPage(result);
        setTasks(result.items);
        setOpenTaskCount(result.filterMeta.statuses.find((option) => option.value === "OPEN")?.count ?? 0);
      } else {
        const result = await apiRequest<CursorPage<TrustedRecord, TrustedDataFilterMeta>>(ledgerPath("/v1/admin/trusted-data/" + view, {
          marketCode: "DZ",
          reviewState: recordReviewState,
          query: recordQuery || undefined,
          limit: 20,
          cursor: recordCursors.at(-1)
        }));
        if (active) setRecordPage(result);
      }
    };
    load()
      .catch((loadError) => { if (active) setPageError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [view, refreshToken, recordQuery, recordReviewState, recordCursors, reviewQuery, reviewStatus, reviewType, reviewCursors]);

  const doTransition = async (reason: string) => {
    if (!transition) return;
    await apiRequest("/v1/admin/trusted-data/" + transition.resource + "/" + transition.record.id + "/transitions?marketCode=DZ", {
      method: "POST",
      body: JSON.stringify({ to: transition.to, reason })
    });
    setTransition(null);
    refresh();
  };

  const assignTask = async (task: ReviewTask, assignedToId: string | null) => {
    try {
      setPageError("");
      await apiRequest("/v1/admin/review-tasks/" + task.id + "?marketCode=DZ", {
        method: "PATCH",
        body: JSON.stringify({ assignedToId })
      });
      refresh();
    } catch (assignError) {
      setPageError(errorMessage(assignError));
    }
  };

  const completeTask = async (resolution: string) => {
    if (!taskToComplete) return;
    await apiRequest("/v1/admin/review-tasks/" + taskToComplete.id + "?marketCode=DZ", {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED", resolution })
    });
    setTaskToComplete(null);
    refresh();
  };

  const openReportReview = async (task: ReviewTask) => {
    try {
      setPageError("");
      setReportReview(await apiRequest<ReportReviewDetail>(`/v1/admin/reports/${task.entityId}`));
    } catch (loadError) {
      setPageError(errorMessage(loadError));
    }
  };

  const reviewReport = async (decision: "APPROVE" | "REJECT", notes: string) => {
    if (!reportReview) return;
    try {
      setReviewBusy(true);
      await apiRequest(`/v1/admin/reports/${reportReview.id}/review`, { method: "PATCH", body: JSON.stringify({ decision, notes }) });
      setReportReview(null);
      refresh();
    } catch (reviewError) {
      setPageError(errorMessage(reviewError));
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">HC</span>
          <div><strong>HelloCarCar</strong><small>运营工作台</small></div>
        </div>
        <nav ref={navigationRef} aria-label="主导航">
          {user.role === "ANALYST" || user.role === "ADMIN" ? <button data-view="dashboard" className={view === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}><span>01</span>工作台</button> : null}
          {user.role === "ANALYST" || user.role === "ADMIN" ? <><div className="nav-label">可信数据</div>
            {resources.map((resource, index) => (
              <button data-view={resource.key} key={resource.key} className={view === resource.key ? "active" : ""} onClick={() => navigate(resource.key)}>
                <span>{String(index + 2).padStart(2, "0")}</span>{resource.shortLabel}
              </button>
            ))}</> : null}
          {user.role === "FINANCE" || user.role === "ADMIN" ? <><div className="nav-label">财务</div>
            <button data-view="payments" className={view === "payments" ? "active" : ""} onClick={() => navigate("payments")}><span>08</span>支付运营</button></> : null}
          {user.role === "ANALYST" || user.role === "REVIEWER" || user.role === "ADMIN" ? <><div className="nav-label">审核</div>
            <button data-view="review-tasks" className={view === "review-tasks" ? "active" : ""} onClick={() => navigate("review-tasks")}>
              <span>09</span>审核队列{openTaskCount ? <b>{openTaskCount}</b> : null}
            </button></> : null}
        </nav>
        <div className="sidebar-boundary"><span>只读连接</span><p>飞书 / NBS</p><strong>未配置</strong></div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div><span className="breadcrumb">DZ / {viewLabels[view]}</span><h1>{viewLabels[view]}</h1></div>
          <div className="topbar-actions">
            <div className="market-switch" aria-label="市场">
              <button className="selected">DZ <small>ACTIVE</small></button>
              <button disabled>IR <small>PLANNED</small></button>
            </div>
            <div className="user-menu"><span>{user.email}</span><strong>{user.role === "ADMIN" ? "管理员审核人" : "市场分析员"}</strong></div>
            <button className="icon-button" type="button" title="退出登录" aria-label="退出登录" onClick={onLogout}>↗</button>
          </div>
        </header>
        {pageError ? (
          <div className="page-alert" role="alert"><span>{pageError}</span><button type="button" onClick={() => setPageError("")} aria-label="关闭">×</button></div>
        ) : null}
        <main className="content">
          {loading ? <div className="loading-state"><span></span>正在读取运营数据</div> : null}
          {!loading && view === "dashboard" ? <Dashboard counts={counts} tasks={tasks} openTaskCount={openTaskCount} onNavigate={navigate} /> : null}
          {!loading && view !== "dashboard" && view !== "review-tasks" && view !== "payments" && recordPage ? (
            <ResourcePage
              resource={view}
              page={recordPage}
              query={recordQuery}
              stateFilter={recordReviewState}
              canPrevious={recordCursors.length > 0}
              user={user}
              onQueryChange={(value) => { setRecordQuery(value); setRecordCursors([]); }}
              onStateFilterChange={(value) => { setRecordReviewState(value); setRecordCursors([]); }}
              onPrevious={() => setRecordCursors(popCursor)}
              onNext={() => {
                const next = recordPage.pageInfo.nextCursor;
                setRecordCursors((value) => pushCursor(value, next));
              }}
              onCreate={() => setDrawer({ resource: view })}
              onEdit={(record) => setDrawer({ resource: view, record })}
              onTransition={(record, to, label) => setTransition({ resource: view, record, to, label })}
            />
          ) : null}
          {!loading && view === "review-tasks" && reviewPage ? (
            <ReviewQueue
              page={reviewPage}
              query={reviewQuery}
              statusFilter={reviewStatus}
              typeFilter={reviewType}
              canPrevious={reviewCursors.length > 0}
              user={user}
              assignees={options?.assignees ?? []}
              onQueryChange={(value) => { setReviewQuery(value); setReviewCursors([]); }}
              onStatusFilterChange={(value) => { setReviewStatus(value); setReviewCursors([]); }}
              onTypeFilterChange={(value) => { setReviewType(value); setReviewCursors([]); }}
              onPrevious={() => setReviewCursors(popCursor)}
              onNext={() => {
                const next = reviewPage.pageInfo.nextCursor;
                setReviewCursors((value) => pushCursor(value, next));
              }}
              onAssign={assignTask}
              onComplete={setTaskToComplete}
              onOpenReport={openReportReview}
            />
          ) : null}
          {!loading && view === "payments" ? <PaymentOperations /> : null}
        </main>
      </div>
      {drawer ? (
        <RecordDrawer
          {...drawer}
          options={options}
          onClose={() => setDrawer(null)}
          onSaved={() => { setDrawer(null); refresh(); }}
        />
      ) : null}
      {transition ? (
        <ReasonDialog
          title={transition.label}
          subject={recordTitle(transition.resource, transition.record)}
          submitLabel={transition.label}
          onCancel={() => setTransition(null)}
          onSubmit={doTransition}
        />
      ) : null}
      {taskToComplete ? (
        <ReasonDialog
          title="完成审核任务"
          subject={taskToComplete.reason}
          submitLabel="确认完成"
          onCancel={() => setTaskToComplete(null)}
          onSubmit={completeTask}
        />
      ) : null}
      {reportReview ? <ReportReviewDialog detail={reportReview} busy={reviewBusy} onClose={() => setReportReview(null)} onReview={reviewReport} /> : null}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    apiRequest<SessionUser>("/v1/auth/me")
      .then((session) => {
        if (["ANALYST", "FINANCE", "REVIEWER", "ADMIN"].includes(session.role)) setUser(session);
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, []);

  const logout = async () => {
    try {
      await apiRequest("/v1/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  if (checking) return <div className="boot-screen"><span className="brand-mark">HC</span><p>正在验证运营会话</p></div>;
  return user ? <AppShell user={user} onLogout={logout} /> : <Login onAuthenticated={setUser} />;
}
