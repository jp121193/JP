import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";
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
} from "@phosphor-icons/react";

const SECTIONS = [
  { key: "users", label: "Users", icon: UsersThree },
  { key: "ceramics", label: "Ceramics", icon: Buildings },
  { key: "yards", label: "Yards", icon: Boat },
];

function CeramicForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [mapUrl, setMapUrl] = useState(initial?.map_url || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3" data-testid="ceramic-form">
      <input
        data-testid="ceramic-form-name"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
        placeholder="Company name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        data-testid="ceramic-form-category"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
        placeholder="Category (e.g. Vitrified Tiles)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <input
        data-testid="ceramic-form-phone"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm font-mono-jp"
        placeholder="WhatsApp number (e.g. +919825012345)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        data-testid="ceramic-form-map"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm font-mono-jp"
        placeholder="Google Maps URL"
        value={mapUrl}
        onChange={(e) => setMapUrl(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          data-testid="ceramic-form-save"
          onClick={() => onSave({ name, category, map_url: mapUrl, phone: phone || null })}
          className="h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
        >
          Save
        </button>
        <button
          data-testid="ceramic-form-cancel"
          onClick={onCancel}
          className="h-9 px-4 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function YardForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [port, setPort] = useState(initial?.port || "Mundra");
  const [mapUrl, setMapUrl] = useState(initial?.map_url || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3" data-testid="yard-form">
      <input
        data-testid="yard-form-name"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
        placeholder="Yard name"
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
        data-testid="yard-form-phone"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm font-mono-jp"
        placeholder="WhatsApp number (e.g. +912836200001)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        data-testid="yard-form-map"
        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm font-mono-jp"
        placeholder="Google Maps URL"
        value={mapUrl}
        onChange={(e) => setMapUrl(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          data-testid="yard-form-save"
          onClick={() => onSave({ name, port, map_url: mapUrl, phone: phone || null })}
          className="h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
        >
          Save
        </button>
        <button
          data-testid="yard-form-cancel"
          onClick={onCancel}
          className="h-9 px-4 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const CERAMIC_TEMPLATE = "name,category,phone,map_url\nExample Ceramics Pvt Ltd,Wall Tiles,+919825000000,https://www.google.com/maps/place/Morbi,+Gujarat/@22.82,70.83,13z\n";
const YARD_TEMPLATE = "name,port,phone,map_url\nExample Empty Yard,Mundra,+912836000000,https://www.google.com/maps/place/Mundra+Port/@22.74,69.71,13z\n";

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

  const onPick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a .csv file");
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
      if (inserted > 0) toast.success(`Imported ${inserted} row${inserted === 1 ? "" : "s"}`);
      if (errors && errors.length > 0) {
        toast.warning(`${errors.length} row(s) skipped. First: ${errors[0]}`);
      }
      if (inserted === 0 && (!errors || errors.length === 0)) {
        toast.info("Nothing to import");
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
        Template
      </button>
      <button
        data-testid={`${testidPrefix}-import-btn`}
        onClick={onPick}
        disabled={busy}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-50 transition-colors"
      >
        <UploadSimple size={14} weight="bold" />
        {busy ? "Uploading..." : "Import CSV"}
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

export default function AdminPage() {
  const [section, setSection] = useState("users");
  const [users, setUsers] = useState([]);
  const [ceramics, setCeramics] = useState([]);
  const [yards, setYards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCeramic, setEditingCeramic] = useState(null); // "new" or object
  const [editingYard, setEditingYard] = useState(null);
  const [confirm, setConfirm] = useState(null); // { title, message, onConfirm }

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
      toast.success("User approved");
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const revoke = async (id) => {
    try {
      await api.post(`/admin/users/${id}/revoke`);
      toast.success("Access revoked");
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const deleteUser = (id, name) => {
    askConfirm(
      "Delete user?",
      `Remove ${name} permanently. They will lose access immediately.`,
      async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          toast.success("User deleted");
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
        toast.success("Ceramic added");
      } else {
        await api.put(`/admin/ceramics/${editingCeramic.id}`, payload);
        toast.success("Ceramic updated");
      }
      setEditingCeramic(null);
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const deleteCeramic = (id, name) => {
    askConfirm(
      "Delete ceramic entry?",
      `"${name}" will be removed from the directory.`,
      async () => {
        try {
          await api.delete(`/admin/ceramics/${id}`);
          toast.success("Deleted");
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
        toast.success("Yard added");
      } else {
        await api.put(`/admin/yards/${editingYard.id}`, payload);
        toast.success("Yard updated");
      }
      setEditingYard(null);
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const deleteYard = async (id) => {
    if (!window.confirm("Delete this yard?")) return;
    try {
      await api.delete(`/admin/yards/${id}`);
      toast.success("Deleted");
      loadAll();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="label-eyebrow text-blue-600 mb-1">Admin console</div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900">
              Manage JP.
            </h1>
          </div>
          <Link
            to="/"
            data-testid="admin-back-link"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
          >
            <ArrowLeft size={14} weight="bold" />
            Back to directory
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
          <div className="py-16 text-center text-slate-400 label-eyebrow">Loading</div>
        ) : section === "users" ? (
          <ul className="divide-y divide-slate-200 border-t border-slate-200">
            {users.map((u) => (
              <li
                key={u.id}
                data-testid={`admin-user-row-${u.id}`}
                className="row-line py-4 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-display font-bold text-slate-900">
                    {u.name}
                    {u.role === "admin" && (
                      <span className="ml-2 label-eyebrow text-blue-600 text-[0.6rem]">
                        admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono-jp">
                    {u.mobile}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full label-eyebrow text-[0.6rem] ${
                      u.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {u.status}
                  </span>
                  {u.role !== "admin" && (
                    <>
                      {u.status === "pending" ? (
                        <button
                          data-testid={`admin-approve-${u.id}`}
                          onClick={() => approve(u.id)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                        >
                          <CheckCircle size={14} weight="bold" />
                          Approve
                        </button>
                      ) : (
                        <button
                          data-testid={`admin-revoke-${u.id}`}
                          onClick={() => revoke(u.id)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors"
                        >
                          <XCircle size={14} weight="bold" />
                          Revoke
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
                Add ceramic
              </button>
            </div>
            {editingCeramic === "new" && (
              <div className="mb-4">
                <CeramicForm
                  onSave={saveCeramic}
                  onCancel={() => setEditingCeramic(null)}
                />
              </div>
            )}
            <ul className="divide-y divide-slate-200 border-t border-slate-200">
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display font-bold text-slate-900">
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {c.category}
                          {c.phone && <> · <span className="font-mono-jp">{c.phone}</span></>} ·{" "}
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
                          Edit
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
                Add yard
              </button>
            </div>
            {editingYard === "new" && (
              <div className="mb-4">
                <YardForm onSave={saveYard} onCancel={() => setEditingYard(null)} />
              </div>
            )}
            <ul className="divide-y divide-slate-200 border-t border-slate-200">
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display font-bold text-slate-900">
                          {y.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Port · {y.port}
                          {y.phone && <> · <span className="font-mono-jp">{y.phone}</span></>} ·{" "}
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
                          Edit
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
            <div className="label-eyebrow text-red-600 mb-2">Confirm</div>
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
                Cancel
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
