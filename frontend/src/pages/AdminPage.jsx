import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  CheckCircle,
  XCircle,
  Trash,
  Plus,
  PencilSimple,
  Buildings,
  Boat,
  UsersThree,
  ArrowLeft,
  UploadSimple,
  DownloadSimple,
  DeviceMobile,
} from "@phosphor-icons/react";

function CeramicForm({ initial, onSave, onCancel }) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [mapUrl, setMapUrl] = useState(initial?.map_url || "");
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3" data-testid="ceramic-form">
      <input
        data-testid="ceramic-form-name"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
        placeholder={t("form.name.ceramic")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        data-testid="ceramic-form-category"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
        placeholder={t("form.category")}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <input
        data-testid="ceramic-form-map"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm font-mono-jp"
        placeholder={t("form.mapUrl")}
        value={mapUrl}
        onChange={(e) => setMapUrl(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          data-testid="ceramic-form-save"
          onClick={() => onSave({ name, category, map_url: mapUrl })}
          className="h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
        >
          {t("form.save")}
        </button>
        <button
          data-testid="ceramic-form-cancel"
          onClick={onCancel}
          className="h-9 px-4 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors"
        >
          {t("form.cancel")}
        </button>
      </div>
    </div>
  );
}

function YardForm({ initial, onSave, onCancel }) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name || "");
  const [port, setPort] = useState(initial?.port || "Mundra");
  const [mapUrl, setMapUrl] = useState(initial?.map_url || "");
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3" data-testid="yard-form">
      <input
        data-testid="yard-form-name"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
        placeholder={t("form.name.yard")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        data-testid="yard-form-port"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
        value={port}
        onChange={(e) => setPort(e.target.value)}
      >
        <option value="Mundra">Mundra</option>
        <option value="Kandla">Kandla</option>
      </select>
      <input
        data-testid="yard-form-map"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm font-mono-jp"
        placeholder={t("form.mapUrl")}
        value={mapUrl}
        onChange={(e) => setMapUrl(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          data-testid="yard-form-save"
          onClick={() => onSave({ name, port, map_url: mapUrl })}
          className="h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
        >
          {t("form.save")}
        </button>
        <button
          data-testid="yard-form-cancel"
          onClick={onCancel}
          className="h-9 px-4 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors"
        >
          {t("form.cancel")}
        </button>
      </div>
    </div>
  );
}

const CERAMIC_TEMPLATE = "name,category,map_url\nExample Ceramics Pvt Ltd,Wall Tiles,https://www.google.com/maps/place/Morbi,+Gujarat/@22.82,70.83,13z\n";
const YARD_TEMPLATE = "name,port,map_url\nExample Empty Yard,Mundra,https://www.google.com/maps/place/Mundra+Port/@22.74,69.71,13z\n";

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ImportBar({ testidPrefix, templateCsv, templateName, uploadPath, onDone }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const { t } = useT();

  const onPick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error(t("toast.csvOnly"));
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post(uploadPath, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { inserted, errors } = data;
      if (inserted > 0) {
        toast.success(
          inserted === 1
            ? t("toast.imported", { n: inserted })
            : t("toast.imported.plural", { n: inserted })
        );
      }
      if (errors && errors.length > 0) {
        toast.warning(t("toast.importSkipped", { n: errors.length, first: errors[0] }));
      }
      if (inserted === 0 && (!errors || errors.length === 0)) {
        toast.info(t("toast.importEmpty"));
      }
      onDone?.();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        data-testid={`${testidPrefix}-template-btn`}
        onClick={() => downloadCsv(templateName, templateCsv)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <DownloadSimple size={14} weight="bold" />
        {t("admin.template")}
      </button>
      <button
        data-testid={`${testidPrefix}-import-btn`}
        onClick={onPick}
        disabled={busy}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-50 transition-colors"
      >
        <UploadSimple size={14} weight="bold" />
        {busy ? t("admin.import.busy") : t("admin.import")}
      </button>
      <input
        ref={inputRef}
        data-testid={`${testidPrefix}-file-input`}
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        className="hidden"
      />
    </div>
  );
}

function BulkBar({ testidPrefix, count, onDelete, onClear }) {
  const { t } = useT();
  if (count === 0) return null;
  return (
    <div
      data-testid={`${testidPrefix}-bulk-bar`}
      className="mb-3 flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg bg-slate-900 text-white"
    >
      <span className="text-xs font-semibold" data-testid={`${testidPrefix}-bulk-count`}>
        {t("admin.selected", { n: count })}
      </span>
      <div className="flex-1" />
      <button
        data-testid={`${testidPrefix}-bulk-clear`}
        onClick={onClear}
        className="h-8 px-3 rounded-full text-xs font-semibold text-slate-200 hover:text-white transition-colors"
      >
        {t("admin.clearSelection")}
      </button>
      <button
        data-testid={`${testidPrefix}-bulk-delete-btn`}
        onClick={onDelete}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
      >
        <Trash size={14} weight="bold" />
        {t("admin.deleteSelected")}
      </button>
    </div>
  );
}

function Checkbox({ checked, onChange, testid, disabled }) {
  return (
    <input
      type="checkbox"
      data-testid={testid}
      checked={!!checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-slate-300 accent-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    />
  );
}

export default function AdminPage() {
  const { t } = useT();
  const [section, setSection] = useState("users");
  const [users, setUsers] = useState([]);
  const [ceramics, setCeramics] = useState([]);
  const [yards, setYards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCeramic, setEditingCeramic] = useState(null);
  const [editingYard, setEditingYard] = useState(null);
  const [confirm, setConfirm] = useState(null);

  // Selection state for bulk delete (per section)
  const [selUsers, setSelUsers] = useState(() => new Set());
  const [selCeramics, setSelCeramics] = useState(() => new Set());
  const [selYards, setSelYards] = useState(() => new Set());

  const askConfirm = (title, message, onConfirm) =>
    setConfirm({ title, message, onConfirm });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [u, c, y] = await Promise.all([
        api.get("/admin/users"),
        api.get("/ceramics"),
        api.get("/yards"),
      ]);
      setUsers(u.data);
      setCeramics(c.data);
      setYards(y.data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const approve = async (id) => {
    try {
      await api.post(`/admin/users/${id}/approve`);
      toast.success(t("toast.userApproved"));
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const revoke = async (id) => {
    try {
      await api.post(`/admin/users/${id}/revoke`);
      toast.success(t("toast.accessRevoked"));
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const resetDevice = async (id) => {
    try {
      await api.post(`/admin/users/${id}/reset-device`);
      toast.success(t("toast.deviceReset"));
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const deleteUser = (id, name) => {
    askConfirm(
      t("confirm.deleteUser.title"),
      t("confirm.deleteUser.body", { name }),
      async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          toast.success(t("toast.userDeleted"));
          loadAll();
        } catch (e) {
          toast.error(formatApiError(e));
        }
      }
    );
  };

  const saveCeramic = async (payload) => {
    try {
      if (editingCeramic === "new") {
        await api.post("/admin/ceramics", payload);
        toast.success(t("toast.ceramicAdded"));
      } else {
        await api.put(`/admin/ceramics/${editingCeramic.id}`, payload);
        toast.success(t("toast.ceramicUpdated"));
      }
      setEditingCeramic(null);
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const deleteCeramic = (id, name) => {
    askConfirm(
      t("confirm.deleteCeramic.title"),
      t("confirm.deleteCeramic.body", { name }),
      async () => {
        try {
          await api.delete(`/admin/ceramics/${id}`);
          toast.success(t("toast.deleted"));
          loadAll();
        } catch (e) {
          toast.error(formatApiError(e));
        }
      }
    );
  };

  const saveYard = async (payload) => {
    try {
      if (editingYard === "new") {
        await api.post("/admin/yards", payload);
        toast.success(t("toast.yardAdded"));
      } else {
        await api.put(`/admin/yards/${editingYard.id}`, payload);
        toast.success(t("toast.yardUpdated"));
      }
      setEditingYard(null);
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const deleteYard = (id, name) => {
    askConfirm(
      t("confirm.deleteYard.title"),
      t("confirm.deleteYard.body", { name }),
      async () => {
        try {
          await api.delete(`/admin/yards/${id}`);
          toast.success(t("toast.deleted"));
          loadAll();
        } catch (e) {
          toast.error(formatApiError(e));
        }
      }
    );
  };

  // ---------- Bulk delete helpers ----------
  const toggleSel = (setFn) => (id, checked) => {
    setFn((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const toggleAll = (setFn, ids) => (checked) => {
    setFn(() => (checked ? new Set(ids) : new Set()));
  };

  const bulkDelete = async (ids, urlBuilder, setSel) => {
    if (ids.length === 0) return;
    askConfirm(
      t("confirm.bulkDelete.title", { n: ids.length }),
      t("confirm.bulkDelete.body"),
      async () => {
        let ok = 0;
        let fail = 0;
        for (const id of ids) {
          try {
            await api.delete(urlBuilder(id));
            ok += 1;
          } catch {
            fail += 1;
          }
        }
        if (fail === 0) toast.success(t("toast.bulkDeleted", { n: ok }));
        else toast.warning(t("toast.bulkPartial", { ok, fail }));
        setSel(new Set());
        loadAll();
      }
    );
  };

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const nonAdminUsers = users.filter((u) => u.role !== "admin");

  const SECTIONS = [
    { key: "users", label: t("admin.section.users"), icon: UsersThree },
    { key: "ceramics", label: t("admin.section.ceramics"), icon: Buildings },
    { key: "yards", label: t("admin.section.yards"), icon: Boat },
  ];

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="label-eyebrow text-blue-600 mb-1">{t("admin.eyebrow")}</div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900">
              {t("admin.title")}
            </h1>
          </div>
          <Link
            to="/"
            data-testid="admin-back-link"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
          >
            <ArrowLeft size={14} weight="bold" />
            {t("admin.back")}
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            const badge =
              s.key === "users" && pendingCount > 0 ? (
                <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-amber-500 text-white text-[0.6rem] font-bold">
                  {pendingCount}
                </span>
              ) : null;
            return (
              <button
                key={s.key}
                data-testid={`admin-section-${s.key}`}
                onClick={() => setSection(s.key)}
                className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon size={14} weight="bold" />
                {s.label}
                {badge}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 label-eyebrow">
            {t("admin.loading")}
          </div>
        ) : section === "users" ? (
          <div>
            <BulkBar
              testidPrefix="users"
              count={selUsers.size}
              onDelete={() =>
                bulkDelete(
                  Array.from(selUsers),
                  (id) => `/admin/users/${id}`,
                  setSelUsers
                )
              }
              onClear={() => setSelUsers(new Set())}
            />
            <div className="flex items-center gap-3 py-2 px-2 border-b border-slate-200 text-xs text-slate-500">
              <Checkbox
                testid="users-select-all"
                checked={
                  nonAdminUsers.length > 0 &&
                  nonAdminUsers.every((u) => selUsers.has(u.id))
                }
                onChange={toggleAll(setSelUsers, nonAdminUsers.map((u) => u.id))}
                disabled={nonAdminUsers.length === 0}
              />
              <span className="label-eyebrow">
                {t("admin.section.users")} · {users.length}
              </span>
            </div>
            <ul className="divide-y divide-slate-200">
              {users.map((u) => (
                <li
                  key={u.id}
                  data-testid={`admin-user-row-${u.id}`}
                  className="row-line py-4 px-2 flex items-center gap-3"
                >
                  <Checkbox
                    testid={`users-check-${u.id}`}
                    checked={selUsers.has(u.id)}
                    onChange={(v) => toggleSel(setSelUsers)(u.id, v)}
                    disabled={u.role === "admin"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-slate-900">
                      {u.name}
                      {u.role === "admin" && (
                        <span className="ml-2 label-eyebrow text-blue-600 text-[0.6rem]">
                          {t("admin.role.admin")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-mono-jp">{u.mobile}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full label-eyebrow text-[0.6rem] ${
                        u.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}
                    >
                      {u.status === "approved"
                        ? t("admin.status.approved")
                        : t("admin.status.pending")}
                    </span>
                    {u.role !== "admin" && (
                      <span
                        data-testid={`admin-user-device-${u.id}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full label-eyebrow text-[0.6rem] ${
                          u.device_bound
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "bg-slate-50 text-slate-500 border border-slate-200"
                        }`}
                      >
                        <DeviceMobile size={10} weight="bold" />
                        {u.device_bound ? t("admin.device.bound") : t("admin.device.unbound")}
                      </span>
                    )}
                    {u.role !== "admin" && (
                      <>
                        {u.status === "pending" ? (
                          <button
                            data-testid={`admin-approve-${u.id}`}
                            onClick={() => approve(u.id)}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            <CheckCircle size={14} weight="bold" />
                            {t("admin.approve")}
                          </button>
                        ) : (
                          <button
                            data-testid={`admin-revoke-${u.id}`}
                            onClick={() => revoke(u.id)}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors"
                          >
                            <XCircle size={14} weight="bold" />
                            {t("admin.revoke")}
                          </button>
                        )}
                        {u.device_bound && (
                          <button
                            data-testid={`admin-reset-device-${u.id}`}
                            onClick={() => resetDevice(u.id)}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                          >
                            <DeviceMobile size={14} weight="bold" />
                            {t("admin.resetDevice")}
                          </button>
                        )}
                        <button
                          data-testid={`admin-delete-user-${u.id}`}
                          onClick={() => deleteUser(u.id, u.name)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : section === "ceramics" ? (
          <div>
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <ImportBar
                testidPrefix="ceramics"
                templateCsv={CERAMIC_TEMPLATE}
                templateName="ceramics_template.csv"
                uploadPath="/admin/ceramics/import"
                onDone={loadAll}
              />
              <button
                data-testid="admin-add-ceramic-btn"
                onClick={() => setEditingCeramic("new")}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
              >
                <Plus size={14} weight="bold" />
                {t("admin.add.ceramic")}
              </button>
            </div>
            <BulkBar
              testidPrefix="ceramics"
              count={selCeramics.size}
              onDelete={() =>
                bulkDelete(
                  Array.from(selCeramics),
                  (id) => `/admin/ceramics/${id}`,
                  setSelCeramics
                )
              }
              onClear={() => setSelCeramics(new Set())}
            />
            {editingCeramic === "new" && (
              <div className="mb-4">
                <CeramicForm onSave={saveCeramic} onCancel={() => setEditingCeramic(null)} />
              </div>
            )}
            <div className="flex items-center gap-3 py-2 px-2 border-b border-slate-200 text-xs text-slate-500">
              <Checkbox
                testid="ceramics-select-all"
                checked={ceramics.length > 0 && ceramics.every((c) => selCeramics.has(c.id))}
                onChange={toggleAll(setSelCeramics, ceramics.map((c) => c.id))}
                disabled={ceramics.length === 0}
              />
              <span className="label-eyebrow">
                {t("admin.section.ceramics")} · {ceramics.length}
              </span>
            </div>
            <ul className="divide-y divide-slate-200">
              {ceramics.map((c) => (
                <li
                  key={c.id}
                  data-testid={`admin-ceramic-row-${c.id}`}
                  className="row-line py-4 px-2"
                >
                  {editingCeramic?.id === c.id ? (
                    <CeramicForm
                      initial={c}
                      onSave={saveCeramic}
                      onCancel={() => setEditingCeramic(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <Checkbox
                        testid={`ceramics-check-${c.id}`}
                        checked={selCeramics.has(c.id)}
                        onChange={(v) => toggleSel(setSelCeramics)(c.id, v)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-bold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {c.category} ·{" "}
                          <a
                            href={c.map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {c.map_url}
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          data-testid={`admin-edit-ceramic-${c.id}`}
                          onClick={() => setEditingCeramic(c)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors"
                        >
                          <PencilSimple size={14} weight="bold" />
                          {t("admin.edit")}
                        </button>
                        <button
                          data-testid={`admin-delete-ceramic-${c.id}`}
                          onClick={() => deleteCeramic(c.id, c.name)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <ImportBar
                testidPrefix="yards"
                templateCsv={YARD_TEMPLATE}
                templateName="yards_template.csv"
                uploadPath="/admin/yards/import"
                onDone={loadAll}
              />
              <button
                data-testid="admin-add-yard-btn"
                onClick={() => setEditingYard("new")}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
              >
                <Plus size={14} weight="bold" />
                {t("admin.add.yard")}
              </button>
            </div>
            <BulkBar
              testidPrefix="yards"
              count={selYards.size}
              onDelete={() =>
                bulkDelete(
                  Array.from(selYards),
                  (id) => `/admin/yards/${id}`,
                  setSelYards
                )
              }
              onClear={() => setSelYards(new Set())}
            />
            {editingYard === "new" && (
              <div className="mb-4">
                <YardForm onSave={saveYard} onCancel={() => setEditingYard(null)} />
              </div>
            )}
            <div className="flex items-center gap-3 py-2 px-2 border-b border-slate-200 text-xs text-slate-500">
              <Checkbox
                testid="yards-select-all"
                checked={yards.length > 0 && yards.every((y) => selYards.has(y.id))}
                onChange={toggleAll(setSelYards, yards.map((y) => y.id))}
                disabled={yards.length === 0}
              />
              <span className="label-eyebrow">
                {t("admin.section.yards")} · {yards.length}
              </span>
            </div>
            <ul className="divide-y divide-slate-200">
              {yards.map((y) => (
                <li
                  key={y.id}
                  data-testid={`admin-yard-row-${y.id}`}
                  className="row-line py-4 px-2"
                >
                  {editingYard?.id === y.id ? (
                    <YardForm
                      initial={y}
                      onSave={saveYard}
                      onCancel={() => setEditingYard(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <Checkbox
                        testid={`yards-check-${y.id}`}
                        checked={selYards.has(y.id)}
                        onChange={(v) => toggleSel(setSelYards)(y.id, v)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-bold text-slate-900">{y.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {t("dashboard.port", { port: y.port })} ·{" "}
                          <a
                            href={y.map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {y.map_url}
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          data-testid={`admin-edit-yard-${y.id}`}
                          onClick={() => setEditingYard(y)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors"
                        >
                          <PencilSimple size={14} weight="bold" />
                          {t("admin.edit")}
                        </button>
                        <button
                          data-testid={`admin-delete-yard-${y.id}`}
                          onClick={() => deleteYard(y.id, y.name)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {confirm && (
        <div
          data-testid="confirm-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div
            className="absolute inset-0 bg-slate-900/60"
            onClick={() => setConfirm(null)}
          />
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="label-eyebrow text-red-600 mb-2">{t("confirm.eyebrow")}</div>
            <h3 className="font-display font-black text-2xl text-slate-900 mb-2">
              {confirm.title}
            </h3>
            <p className="text-sm text-slate-600 mb-6">{confirm.message}</p>
            <div className="flex justify-end gap-2">
              <button
                data-testid="confirm-dialog-cancel"
                onClick={() => setConfirm(null)}
                className="h-10 px-4 rounded-full border border-slate-300 text-sm font-semibold hover:bg-slate-100 transition-colors"
              >
                {t("confirm.cancel")}
              </button>
              <button
                data-testid="confirm-dialog-confirm"
                onClick={async () => {
                  const fn = confirm.onConfirm;
                  setConfirm(null);
                  await fn();
                }}
                className="h-10 px-4 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                {t("confirm.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
