import { useState } from "react";
import type { FormEvent } from "react";
import { ApiRequestError, apiRequest } from "./api";
import type { SessionUser } from "./model";

function errorMessage(error: unknown) {
  if (error instanceof ApiRequestError) return error.message;
  return error instanceof Error ? error.message : "发生未知错误";
}

export function Login({ onAuthenticated }: { onAuthenticated: (user: SessionUser) => void }) {
  const [email, setEmail] = useState("reviewer@hellocarcar.local");
  const [code, setCode] = useState("");
  const [challengeReady, setChallengeReady] = useState(false);
  const [debugCode, setDebugCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ debugCode?: string }>("/v1/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ email, marketCode: "DZ" })
      });
      const localCode = result.debugCode ?? "";
      setDebugCode(localCode);
      setCode(localCode);
      setChallengeReady(true);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest("/v1/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, code, marketCode: "DZ" })
      });
      const user = await apiRequest<SessionUser>("/v1/auth/me");
      if (!["ANALYST", "FINANCE", "REVIEWER", "ADMIN"].includes(user.role)) {
        throw new ApiRequestError("ROLE_FORBIDDEN", "该账号没有运营后台权限", 403);
      }
      onAuthenticated(user);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="brand-mark">HC</span>
        <div><strong>HelloCarCar</strong><small>OPERATIONS</small></div>
      </div>
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-heading">
          <span>受控访问</span>
          <h1 id="login-title">运营工作台登录</h1>
          <p>阿尔及利亚可信数据与审核流程</p>
        </div>
        {!challengeReady ? (
          <form onSubmit={requestCode}>
            <label><span>工作邮箱</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus /></label>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "发送中..." : "获取验证码"}</button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <label><span>六位验证码</span><input inputMode="numeric" pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value)} required autoFocus /></label>
            {debugCode ? <div className="local-code"><span>本地验证码</span><strong>{debugCode}</strong></div> : null}
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "验证中..." : "登录工作台"}</button>
            <button className="text-button" type="button" onClick={() => setChallengeReady(false)}>更换邮箱</button>
          </form>
        )}
        {error ? <div className="form-error" role="alert">{error}</div> : null}
      </section>
      <footer>数据操作会记录账号、市场与审计时间</footer>
    </div>
  );
}
