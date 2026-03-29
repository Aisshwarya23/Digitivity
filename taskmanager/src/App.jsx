import { useState, useEffect, useRef, useCallback } from "react";

const STATUSES = ["todo", "inprogress", "done"];
const STATUS_META = {
  todo:       { label: "To Do",       color: "#7c6fff", bg: "rgba(124,111,255,0.1)", border: "rgba(124,111,255,0.3)" },
  inprogress: { label: "In Progress", color: "#f7b731", bg: "rgba(247,183,49,0.1)",  border: "rgba(247,183,49,0.28)" },
  done:       { label: "Done",        color: "#4ecdc4", bg: "rgba(78,205,196,0.1)",  border: "rgba(78,205,196,0.28)" },
};
const PRIORITY_META = {
  low:    { icon: "○", color: "#6b6b8a" },
  medium: { icon: "◉", color: "#f7b731" },
  high:   { icon: "⬤", color: "#ff6b6b" },
};

function uid() {
  return "T-" + Math.random().toString(36).substr(2, 6).toUpperCase();
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function ago(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const SEED = [
  { id: uid(), title: "Set up project repository", description: "Initialize Git, add README and branch structure", status: "done",       priority: "high",   created_at: ago(5) },
  { id: uid(), title: "Design database schema",    description: "Define tables for tasks, users, sessions with indexes", status: "done",       priority: "high",   created_at: ago(4) },
  { id: uid(), title: "Build REST API endpoints",  description: "Implement CRUD routes with validation and HTTP codes",  status: "inprogress", priority: "high",   created_at: ago(3) },
  { id: uid(), title: "Add JWT authentication",    description: "Protect routes with Bearer token middleware",           status: "inprogress", priority: "medium", created_at: ago(2) },
  { id: uid(), title: "Write Postman collection",  description: "Document all endpoints with example bodies",            status: "todo",       priority: "medium", created_at: ago(1) },
  { id: uid(), title: "Add pagination support",    description: "Cursor-based pagination with page & limit params",      status: "todo",       priority: "low",    created_at: ago(0.5) },
  { id: uid(), title: "Write unit tests",          description: "Cover all service functions with Jest test suite",      status: "todo",       priority: "high",   created_at: ago(0.3) },
  { id: uid(), title: "Docker setup",              description: "Dockerfile and docker-compose for dev + production",    status: "todo",       priority: "medium", created_at: ago(0.1) },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.tf-root {
  --bg: #0a0a0f;
  --surface: #111118;
  --surface2: #1a1a24;
  --border: rgba(255,255,255,0.08);
  --border-hover: rgba(255,255,255,0.15);
  --accent: #7c6fff;
  --accent2: #ff6b6b;
  --text: #e8e8f0;
  --muted: #6b6b8a;
  font-family: 'DM Mono', monospace;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  position: relative;
}

.tf-root::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: linear-gradient(rgba(124,111,255,0.035) 1px,transparent 1px),
    linear-gradient(90deg,rgba(124,111,255,0.035) 1px,transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

/* HEADER */
.tf-header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(10,10,15,0.88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  height: 62px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 36px;
}
.tf-logo {
  font-family: 'Syne', sans-serif;
  font-weight: 800; font-size: 1.2rem; letter-spacing: -0.02em;
  display: flex; align-items: center; gap: 9px;
}
.tf-logo-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
  animation: tfpulse 2s ease-in-out infinite;
}
@keyframes tfpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.75)} }

.tf-stats { display: flex; gap: 10px; align-items: center; }
.tf-pill {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 20px; padding: 4px 12px;
  font-size: 0.68rem; display: flex; align-items: center; gap: 6px; color: var(--muted);
}
.tf-pill-dot { width: 6px; height: 6px; border-radius: 50%; }

/* BODY */
.tf-body { position: relative; z-index: 1; padding: 36px; }

.tf-toprow {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
}
.tf-page-title {
  font-family: 'Syne', sans-serif; font-weight: 800;
  font-size: 2.6rem; letter-spacing: -0.04em; line-height: 1;
}
.tf-page-title span { color: var(--accent); }
.tf-page-sub { font-size: 0.68rem; color: var(--muted); margin-top: 5px; letter-spacing: .06em; text-transform: uppercase; }

.tf-add-btn {
  font-family: 'Syne', sans-serif; font-weight: 700; font-size: .85rem;
  background: var(--accent); border: none; border-radius: 6px;
  color: #fff; padding: 10px 22px; cursor: pointer;
  display: flex; align-items: center; gap: 7px;
  box-shadow: 0 0 22px rgba(124,111,255,.32);
  transition: background .15s, box-shadow .15s;
}
.tf-add-btn:hover { background: #9585ff; box-shadow: 0 0 32px rgba(124,111,255,.5); }

/* TOOLBAR */
.tf-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 24px; }
.tf-filter-btn {
  font-family: 'DM Mono', monospace; font-size: 0.7rem;
  letter-spacing: .05em; text-transform: uppercase;
  padding: 6px 15px; border-radius: 4px;
  border: 1px solid var(--border); background: transparent;
  color: var(--muted); cursor: pointer; transition: all .15s;
}
.tf-filter-btn:hover { border-color: var(--accent); color: var(--accent); }
.tf-filter-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.tf-search { margin-left: auto; position: relative; }
.tf-search input {
  font-family: 'DM Mono', monospace; font-size: .78rem;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 4px; color: var(--text);
  padding: 7px 14px 7px 34px; width: 210px; outline: none;
  transition: border-color .15s;
}
.tf-search input:focus { border-color: var(--accent); }
.tf-search input::placeholder { color: var(--muted); }
.tf-search-icon {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--muted); font-size: .8rem; pointer-events: none;
}

/* BOARD */
.tf-board { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; align-items: start; }
@media(max-width:840px){ .tf-board{grid-template-columns:1fr} }

/* COLUMN */
.tf-col {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
  transition: box-shadow .2s, border-color .2s;
}
.tf-col.drag-over { box-shadow: 0 0 0 2px var(--accent); border-color: var(--accent); }

.tf-col-header {
  padding: 14px 18px; display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid var(--border); position: relative;
}
.tf-col-stripe {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
}
.tf-col-title { font-family: 'Syne',sans-serif; font-weight: 700; font-size: .82rem; letter-spacing: .04em; text-transform: uppercase; }
.tf-col-count {
  margin-left: auto; font-size: .68rem; color: var(--muted);
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 12px; padding: 2px 10px;
}

.tf-col-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 90px; }

.tf-empty { text-align: center; padding: 22px; color: var(--muted); font-size: .7rem; letter-spacing: .04em; }

/* CARD */
.tf-card {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 6px; padding: 14px; cursor: grab;
  transition: border-color .15s, transform .15s, box-shadow .15s;
  animation: tfslide .2s ease;
}
@keyframes tfslide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
.tf-card:hover { border-color: rgba(124,111,255,.35); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
.tf-card.dragging { opacity: .4; cursor: grabbing; }

.tf-card-id { font-size: .63rem; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; display: flex; justify-content: space-between; margin-bottom: 7px; }
.tf-card-title { font-family: 'Syne',sans-serif; font-weight: 600; font-size: .88rem; margin-bottom: 5px; line-height: 1.4; }
.tf-card-desc { font-size: .7rem; color: var(--muted); line-height: 1.6; margin-bottom: 12px; }
.tf-card-footer { display: flex; align-items: center; gap: 6px; }
.tf-card-date { font-size: .63rem; color: var(--muted); margin-left: auto; }

.tf-badge {
  font-size: .6rem; letter-spacing: .06em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 3px;
}

.tf-actions { display: flex; gap: 5px; }
.tf-icon-btn {
  width: 27px; height: 27px; border-radius: 4px;
  border: 1px solid var(--border); background: transparent;
  color: var(--muted); cursor: pointer; font-size: .75rem;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s; font-family: inherit;
}
.tf-icon-btn:hover { border-color: var(--accent2); color: var(--accent2); }
.tf-icon-btn.edit:hover { border-color: var(--accent); color: var(--accent); }

/* PAGINATION */
.tf-pagination { display: flex; justify-content: center; gap: 7px; margin-top: 26px; }
.tf-page-btn {
  font-family: 'DM Mono',monospace; font-size: .7rem;
  width: 32px; height: 32px; border-radius: 4px;
  border: 1px solid var(--border); background: transparent;
  color: var(--muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.tf-page-btn:hover { border-color: var(--accent); color: var(--accent); }
.tf-page-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

/* MODAL BACKDROP */
.tf-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.72); backdrop-filter: blur(8px);
  z-index: 200; display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity .2s;
}
.tf-backdrop.open { opacity: 1; pointer-events: all; }

.tf-modal {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; width: 460px; max-width: 95vw;
  padding: 30px; position: relative;
  transform: translateY(18px); transition: transform .2s;
}
.tf-backdrop.open .tf-modal { transform: translateY(0); }

.tf-modal-title { font-family: 'Syne',sans-serif; font-weight: 800; font-size: 1.35rem; letter-spacing: -.03em; margin-bottom: 5px; }
.tf-modal-sub { font-size: .7rem; color: var(--muted); margin-bottom: 24px; letter-spacing: .03em; }
.tf-modal-close {
  position: absolute; top: 18px; right: 18px;
  background: transparent; border: 1px solid var(--border); border-radius: 4px;
  color: var(--muted); width: 28px; height: 28px;
  cursor: pointer; font-size: .95rem; display: flex; align-items: center; justify-content: center;
  transition: all .15s; font-family: inherit;
}
.tf-modal-close:hover { color: var(--text); border-color: var(--muted); }

.tf-form-group { margin-bottom: 18px; }
.tf-label { display: block; font-size: .65rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 7px; }
.tf-input, .tf-textarea, .tf-select {
  width: 100%; font-family: 'DM Mono',monospace; font-size: .8rem;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 5px; color: var(--text); padding: 9px 13px; outline: none;
  transition: border-color .15s; resize: none;
}
.tf-input:focus, .tf-textarea:focus, .tf-select:focus { border-color: var(--accent); }
.tf-input::placeholder, .tf-textarea::placeholder { color: var(--muted); }
.tf-select option { background: #111118; }
.tf-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.tf-char-count { font-size: .62rem; color: var(--muted); text-align: right; margin-top: 4px; }
.tf-val-err { font-size: .66rem; color: var(--accent2); margin-top: 5px; letter-spacing: .03em; }

.tf-modal-actions { display: flex; gap: 9px; margin-top: 24px; justify-content: flex-end; }
.tf-btn-cancel {
  font-family: 'DM Mono',monospace; font-size: .76rem;
  background: transparent; border: 1px solid var(--border);
  border-radius: 5px; color: var(--muted); padding: 8px 18px; cursor: pointer;
  transition: all .15s;
}
.tf-btn-cancel:hover { border-color: var(--muted); color: var(--text); }
.tf-btn-submit {
  font-family: 'Syne',sans-serif; font-weight: 700; font-size: .85rem;
  background: var(--accent); border: none; border-radius: 5px;
  color: #fff; padding: 8px 22px; cursor: pointer; transition: background .15s;
}
.tf-btn-submit:hover { background: #9585ff; }
.tf-btn-danger {
  font-family: 'Syne',sans-serif; font-weight: 700; font-size: .85rem;
  background: var(--accent2); border: none; border-radius: 5px;
  color: #fff; padding: 8px 20px; cursor: pointer; transition: opacity .15s;
}
.tf-btn-danger:hover { opacity: .85; }

/* TOAST */
.tf-toasts { position: fixed; bottom: 28px; right: 28px; z-index: 300; display: flex; flex-direction: column; gap: 9px; }
.tf-toast {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 6px; padding: 11px 17px; font-size: .76rem;
  display: flex; align-items: center; gap: 9px; min-width: 200px;
  animation: tftoast .25s ease;
}
@keyframes tftoast { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
.tf-toast.success { border-left: 3px solid #4ecdc4; }
.tf-toast.error   { border-left: 3px solid var(--accent2); }
.tf-toast.info    { border-left: 3px solid var(--accent); }
`;

// ─── Components ────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="tf-toasts">
      {toasts.map(t => (
        <div key={t.id} className={`tf-toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

function Badge({ status }) {
  const m = STATUS_META[status];
  return (
    <span className="tf-badge" style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      {m.label}
    </span>
  );
}

function TaskCard({ task, onEdit, onDelete, onDragStart, onDragEnd }) {
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  return (
    <div
      className="tf-card"
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragEnd={onDragEnd}
    >
      <div className="tf-card-id">
        <span>{task.id}</span>
        <span style={{ color: pm.color }} title={`${task.priority} priority`}>{pm.icon}</span>
      </div>
      <div className="tf-card-title">{task.title}</div>
      {task.description && (
        <div className="tf-card-desc">
          {task.description.length > 110 ? task.description.slice(0, 110) + "…" : task.description}
        </div>
      )}
      <div className="tf-card-footer">
        <Badge status={task.status} />
        <span className="tf-card-date">{formatDate(task.created_at)}</span>
        <div className="tf-actions">
          <button className="tf-icon-btn edit" title="Edit" onClick={() => onEdit(task)}>✎</button>
          <button className="tf-icon-btn" title="Delete" onClick={() => onDelete(task.id)}>✕</button>
        </div>
      </div>
    </div>
  );
}

function Column({ status, tasks, onEdit, onDelete, onDragStart, onDragEnd, onDrop }) {
  const [over, setOver] = useState(false);
  const m = STATUS_META[status];
  return (
    <div
      className={`tf-col${over ? " drag-over" : ""}`}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(false); }}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop(status); }}
    >
      <div className="tf-col-header">
        <div className="tf-col-stripe" style={{ background: m.color }} />
        <div className="tf-col-title" style={{ color: m.color }}>{m.label}</div>
        <div className="tf-col-count">{tasks.length}</div>
      </div>
      <div className="tf-col-body">
        {tasks.length === 0
          ? <div className="tf-empty">No tasks here</div>
          : tasks.map(t => (
            <TaskCard key={t.id} task={t} onEdit={onEdit} onDelete={onDelete} onDragStart={onDragStart} onDragEnd={onDragEnd} />
          ))
        }
      </div>
    </div>
  );
}

function Modal({ open, title, sub, onClose, onSubmit, form, setForm, mode }) {
  const titleRef = useRef();
  useEffect(() => { if (open) setTimeout(() => titleRef.current?.focus(), 80); }, [open]);

  const [err, setErr] = useState("");
  const handleSubmit = () => {
    if (!form.title.trim()) { setErr("Title is required."); return; }
    if (form.title.trim().length < 3) { setErr("Title must be at least 3 characters."); return; }
    setErr("");
    onSubmit();
  };

  useEffect(() => { setErr(""); }, [open]);

  return (
    <div className={`tf-backdrop${open ? " open" : ""}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tf-modal">
        <button className="tf-modal-close" onClick={onClose}>✕</button>
        <div className="tf-modal-title">{title}</div>
        <div className="tf-modal-sub">{sub}</div>
        <div className="tf-form-group">
          <label className="tf-label">Title *</label>
          <input
            ref={titleRef}
            className="tf-input"
            maxLength={100}
            placeholder="What needs to be done?"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <div className="tf-char-count">{form.title.length}/100</div>
          {err && <div className="tf-val-err">{err}</div>}
        </div>
        <div className="tf-form-group">
          <label className="tf-label">Description</label>
          <textarea
            className="tf-textarea"
            rows={3}
            maxLength={500}
            placeholder="Add more context..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="tf-char-count">{form.description.length}/500</div>
        </div>
        <div className="tf-form-row">
          <div className="tf-form-group">
            <label className="tf-label">Status</label>
            <select className="tf-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
          <div className="tf-form-group">
            <label className="tf-label">Priority</label>
            <select className="tf-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {["low", "medium", "high"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="tf-modal-actions">
          <button className="tf-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="tf-btn-submit" onClick={handleSubmit}>{mode === "edit" ? "Save Changes" : "Create Task"}</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, onClose, onConfirm }) {
  return (
    <div className={`tf-backdrop${open ? " open" : ""}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tf-modal" style={{ maxWidth: 340 }}>
        <div className="tf-modal-title" style={{ color: "var(--accent2)" }}>Delete Task?</div>
        <div className="tf-modal-sub" style={{ marginBottom: 0 }}>This action cannot be undone.</div>
        <div className="tf-modal-actions">
          <button className="tf-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="tf-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const BLANK_FORM = { title: "", description: "", status: "todo", priority: "medium" };
const PER_PAGE = 10;

export default function App() {
  const [tasks, setTasks] = useState(() => {
    try { const s = localStorage.getItem("tf_tasks"); return s ? JSON.parse(s) : SEED; } catch { return SEED; }
  });
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [toasts, setToasts] = useState([]);
  const dragging = useRef(null);

  useEffect(() => { try { localStorage.setItem("tf_tasks", JSON.stringify(tasks)); } catch {} }, [tasks]);

  const toast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const filtered = tasks.filter(t =>
    (filter === "all" || t.status === filter) &&
    (t.title.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase()))
  );

  const colTasks = status => {
    const col = filtered.filter(t => t.status === status);
    return col.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  };

  const maxPages = Math.max(1, Math.ceil(
    Math.max(...STATUSES.map(s => filtered.filter(t => t.status === s).length)) / PER_PAGE
  ));

  const openCreate = () => {
    setMode("create");
    setEditId(null);
    setForm(BLANK_FORM);
    setModalOpen(true);
  };

  const openEdit = task => {
    setMode("edit");
    setEditId(task.id);
    setForm({ title: task.title, description: task.description, status: task.status, priority: task.priority });
    setModalOpen(true);
  };

  const submitTask = () => {
    if (mode === "create") {
      const t = { id: uid(), ...form, created_at: new Date().toISOString() };
      setTasks(ts => [t, ...ts]);
      toast("Task created", "success");
    } else {
      setTasks(ts => ts.map(t => t.id === editId ? { ...t, ...form } : t));
      toast("Task updated", "success");
    }
    setModalOpen(false);
    setForm(BLANK_FORM);
  };

  const openDelete = id => { setDeleteId(id); setConfirmOpen(true); };
  const confirmDelete = () => {
    setTasks(ts => ts.filter(t => t.id !== deleteId));
    toast("Task deleted", "error");
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const handleDrop = status => {
    if (!dragging.current) return;
    const id = dragging.current;
    const task = tasks.find(t => t.id === id);
    if (task && task.status !== status) {
      setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
      toast(`Moved to ${STATUS_META[status].label}`, "info");
    }
    dragging.current = null;
  };

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") { setModalOpen(false); setConfirmOpen(false); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const stat = s => tasks.filter(t => t.status === s).length;

  return (
    <div className="tf-root">
      <style>{css}</style>

      {/* HEADER */}
      <header className="tf-header">
        <div className="tf-logo">
          <div className="tf-logo-dot" />
          TASKFLOW
        </div>
        <div className="tf-stats">
          {STATUSES.map(s => (
            <div key={s} className="tf-pill">
              <div className="tf-pill-dot" style={{ background: STATUS_META[s].color }} />
              <span style={{ color: "var(--text)" }}>{stat(s)}</span>
              <span>{STATUS_META[s].label.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="tf-body">
        {/* TOP ROW */}
        <div className="tf-toprow">
          <div>
            <div className="tf-page-title">Task <span>Board</span></div>
            <div className="tf-page-sub">drag · drop · ship</div>
          </div>
          <button className="tf-add-btn" onClick={openCreate}>+ New Task</button>
        </div>

        {/* TOOLBAR */}
        <div className="tf-toolbar">
          {["all", ...STATUSES].map(f => (
            <button
              key={f}
              className={`tf-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => { setFilter(f); setPage(1); }}
            >
              {f === "all" ? "All" : STATUS_META[f].label}
            </button>
          ))}
          <div className="tf-search">
            <span className="tf-search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search tasks..."
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* BOARD */}
        <div className="tf-board">
          {STATUSES.map(s => (
            <Column
              key={s}
              status={s}
              tasks={colTasks(s)}
              onEdit={openEdit}
              onDelete={openDelete}
              onDragStart={id => { dragging.current = id; }}
              onDragEnd={() => {}}
              onDrop={handleDrop}
            />
          ))}
        </div>

        {/* PAGINATION */}
        {maxPages > 1 && (
          <div className="tf-pagination">
            {page > 1 && <button className="tf-page-btn" onClick={() => setPage(p => p - 1)}>‹</button>}
            {Array.from({ length: maxPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`tf-page-btn${p === page ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            {page < maxPages && <button className="tf-page-btn" onClick={() => setPage(p => p + 1)}>›</button>}
          </div>
        )}
      </div>

      {/* MODALS */}
      <Modal
        open={modalOpen}
        title={mode === "create" ? "New Task" : "Edit Task"}
        sub={mode === "create" ? "Fill in the details to create a task" : `Editing ${editId}`}
        onClose={() => setModalOpen(false)}
        onSubmit={submitTask}
        form={form}
        setForm={setForm}
        mode={mode}
      />
      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmDelete} />
      <Toast toasts={toasts} />
    </div>
  );
}
