import { useState } from "react";
import type { FormEvent } from "react";
import { ApiRequestError, apiRequest } from "./api";
import {
  resourceByKey,
  statusLabels,
  toDateTimeInput
} from "./model";
import type {
  FieldDefinition,
  TrustedRecord,
  TrustedResource,
  WorkspaceOptions
} from "./model";

function errorMessage(error: unknown) {
  if (error instanceof ApiRequestError) return error.message;
  return error instanceof Error ? error.message : "发生未知错误";
}

export function RecordDrawer({
  resource,
  record,
  options,
  onClose,
  onSaved
}: {
  resource: TrustedResource;
  record?: TrustedRecord;
  options: WorkspaceOptions | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const definition = resourceByKey[resource];
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const fieldOptions = (field: FieldDefinition) => {
    if (field.options) return field.options;
    if (field.optionSource === "vehicles") {
      return (options?.vehicleModels ?? []).map((item) => ({
        value: item.id,
        label: item.make + " " + item.name + (item.modelYear ? " · " + item.modelYear : "")
      }));
    }
    if (field.optionSource === "evidence") {
      return (options?.evidence ?? []).map((item) => ({
        value: item.id,
        label: item.title + " · " + statusLabels[item.reviewState]
      }));
    }
    if (field.optionSource === "suppliers") {
      return (options?.suppliers ?? []).map((item) => ({
        value: item.id,
        label: item.displayName + " · " + item.legalName
      }));
    }
    return [];
  };

  const initialValue = (field: FieldDefinition): string | string[] => {
    if (!record) {
      if (field.name === "observedAt" || field.name === "effectiveAt") return toDateTimeInput(new Date().toISOString());
      if (field.name === "currency") return "USD";
      if (field.name === "incoterm") return "FOB";
      if (field.name === "sourceSystem") return "MANUAL";
      if (field.name === "countryCode") return "CN";
      return field.kind === "multi" ? [] : "";
    }
    if (field.name === "evidenceIds") return record.evidenceLinks?.map((link) => link.evidence.id) ?? [];
    const value = record[field.name as keyof TrustedRecord];
    if (field.kind === "datetime") return toDateTimeInput(value);
    if (field.kind === "json") return value === null || value === undefined ? "" : JSON.stringify(value, null, 2);
    if (typeof value === "boolean") return value ? "true" : "false";
    return value === null || value === undefined ? "" : String(value);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const form = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {};
      for (const field of definition.fields) {
        if (field.kind === "multi") {
          const values = form.getAll(field.name).map(String).filter(Boolean);
          if (values.length) payload[field.name] = values;
          continue;
        }
        const raw = String(form.get(field.name) ?? "").trim();
        if (!raw) {
          if (field.name === "eligible") payload[field.name] = null;
          else if (record && field.nullable) payload[field.name] = null;
          continue;
        }
        if (field.kind === "number") payload[field.name] = Number(raw);
        else if (field.kind === "datetime") payload[field.name] = new Date(raw).toISOString();
        else if (field.kind === "json") {
          const parsed = JSON.parse(raw);
          if ((field.name === "steps" || field.name === "requiredDocuments") && !Array.isArray(parsed)) {
            throw new SyntaxError("Expected JSON array");
          }
          payload[field.name] = parsed;
        }
        else if (field.name === "eligible") payload[field.name] = raw === "true";
        else payload[field.name] = raw;
      }
      if (!record) payload.marketCode = "DZ";
      await apiRequest(
        "/v1/admin/trusted-data/" + resource + (record ? "/" + record.id + "?marketCode=DZ" : ""),
        { method: record ? "PATCH" : "POST", body: JSON.stringify(payload) }
      );
      onSaved();
    } catch (saveError) {
      setFormError(saveError instanceof SyntaxError ? "JSON 字段格式不正确" : errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="record-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header>
          <div><span>{definition.eyebrow.toUpperCase()}</span><h2 id="drawer-title">{record ? "编辑草稿" : "新建" + definition.label}</h2></div>
          <button className="icon-button" type="button" aria-label="关闭" title="关闭" onClick={onClose}>×</button>
        </header>
        <form onSubmit={submit}>
          <div className="drawer-fields">
            {definition.fields.map((field) => {
              const value = initialValue(field);
              const options = fieldOptions(field);
              const full = field.kind === "textarea" || field.kind === "json" || field.kind === "multi";
              return (
                <label key={field.name} className={full ? "full-field" : ""}>
                  <span>{field.label}{field.required ? <b>*</b> : null}</span>
                  {field.kind === "textarea" || field.kind === "json" ? (
                    <textarea name={field.name} rows={field.rows ?? 4} defaultValue={value as string} required={field.required} />
                  ) : field.kind === "select" ? (
                    <select name={field.name} defaultValue={value as string} required={field.required}>
                      {!field.required || field.name === "eligible" ? <option value="">未设置</option> : null}
                      {options.filter((option) => option.value !== "").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : field.kind === "multi" ? (
                    <select name={field.name} multiple size={Math.min(6, Math.max(3, options.length))} defaultValue={value as string[]} required={field.required}>
                      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : (
                    <input
                      name={field.name}
                      type={field.kind === "number" ? "number" : field.kind === "datetime" ? "datetime-local" : field.name.toLowerCase().includes("email") ? "email" : field.name.toLowerCase().includes("url") ? "url" : "text"}
                      step={field.kind === "number" ? "any" : undefined}
                      defaultValue={value as string}
                      required={field.required}
                    />
                  )}
                </label>
              );
            })}
          </div>
          {formError ? <div className="form-error" role="alert">{formError}</div> : null}
          <footer>
            <button className="secondary-button" type="button" onClick={onClose}>取消</button>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "保存中..." : record ? "保存草稿" : "创建草稿"}</button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

export function ReasonDialog({
  title,
  subject,
  submitLabel,
  onCancel,
  onSubmit
}: {
  title: string;
  subject: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setDialogError("");
    try {
      await onSubmit(reason);
    } catch (submitError) {
      setDialogError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="reason-dialog" role="dialog" aria-modal="true" aria-labelledby="reason-title">
        <header>
          <div><span>REVIEW ACTION</span><h2 id="reason-title">{title}</h2></div>
          <button className="icon-button" type="button" aria-label="关闭" onClick={onCancel}>×</button>
        </header>
        <p>{subject}</p>
        <form onSubmit={submit}>
          <label><span>处理说明<b>*</b></span><textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} required autoFocus /></label>
          {dialogError ? <div className="form-error" role="alert">{dialogError}</div> : null}
          <footer>
            <button className="secondary-button" type="button" onClick={onCancel}>取消</button>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "处理中..." : submitLabel}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
