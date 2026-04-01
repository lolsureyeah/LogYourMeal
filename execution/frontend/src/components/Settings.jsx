// execution/frontend/src/components/Settings.jsx
// Full-screen settings overlay with account, appearance, and danger zone sections

import { useState } from "react";
import { useTheme } from "../theme";

export default function Settings({
  user,
  stats,
  isDark,
  onToggleTheme,
  onUpdateName,
  onLogout,
  onDeleteAccount,
  onClose,
}) {
  const { T } = useTheme();
  const [deleteState, setDeleteState] = useState("idle"); // idle | confirm | deleting | error
  const [deleteError, setDeleteError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(stats?.name || "");

  const S = {
    overlay: {
      position: "fixed", inset: 0, background: T.bg, zIndex: 100,
      overflowY: "auto", fontFamily: "system-ui, -apple-system, sans-serif",
    },
    header: {
      background: T.card, borderBottom: `1px solid ${T.headerBorder}`,
      padding: "12px 20px", position: "sticky", top: 0, zIndex: 10,
    },
    headerInner: {
      maxWidth: 480, margin: "0 auto",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    },
    body: { maxWidth: 480, margin: "0 auto", padding: "20px 16px 48px" },
    section: {
      background: T.card, borderRadius: 18, overflow: "hidden",
      marginBottom: 20, border: `1px solid ${T.border}`,
    },
    sectionLabel: {
      fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: T.textSec,
      textTransform: "uppercase", padding: "14px 18px 6px",
    },
    row: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 18px", borderTop: `1px solid ${T.divider}`,
    },
    rowFirst: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 18px",
    },
    rowLabel: { fontSize: 15, color: T.text, fontWeight: 500 },
    rowValue: { fontSize: 14, color: T.textSec },
    actionBtn: {
      background: "none", border: "none", color: T.accent,
      fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0,
    },
    toggle: (active) => ({
      width: 44, height: 26, borderRadius: 13, border: "none",
      background: active ? T.accent : T.inputBg,
      cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
    }),
    toggleThumb: (active) => ({
      position: "absolute", top: 3, left: active ? 21 : 3,
      width: 20, height: 20, borderRadius: "50%",
      background: active ? "#fff" : T.textSec,
      transition: "left 0.2s",
    }),
    dangerBtn: {
      background: "none", border: `1px solid #FF3B30`, borderRadius: 12,
      padding: "11px 16px", color: "#FF3B30", fontWeight: 600,
      fontSize: 15, cursor: "pointer", width: "100%",
    },
    logoutBtn: {
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: "11px 16px", color: T.text, fontWeight: 600,
      fontSize: 15, cursor: "pointer", width: "100%",
    },
  };

  return (
    <div style={S.overlay}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div style={{ fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: -0.3 }}>Settings</div>
          <button
            onClick={onClose}
            style={{ background: T.inputBg, border: "none", borderRadius: 10, width: 36, height: 36, color: T.textSec, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={S.body}>
        {/* Account */}
        <div style={S.section}>
          <div style={S.sectionLabel}>Account</div>
          <div style={S.rowFirst}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingName ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    autoFocus
                    value={nameVal}
                    onChange={e => setNameVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") { onUpdateName(nameVal); setEditingName(false); }
                      if (e.key === "Escape") { setNameVal(stats?.name || ""); setEditingName(false); }
                    }}
                    style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.accent}`, borderRadius: 10, padding: "8px 12px", color: T.text, fontSize: 15, outline: "none", minWidth: 0 }}
                  />
                  <button onClick={() => { onUpdateName(nameVal); setEditingName(false); }} style={{ background: T.accent, border: "none", borderRadius: 8, padding: "8px 12px", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Save</button>
                  <button onClick={() => { setNameVal(stats?.name || ""); setEditingName(false); }} style={{ background: T.inputBg, border: "none", borderRadius: 8, padding: "8px 12px", color: T.textSec, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>✕</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div>
                    <div style={S.rowLabel}>{stats?.name || "Your Name"}</div>
                    <div style={{ fontSize: 13, color: T.textSec, marginTop: 2 }}>{user?.email}</div>
                  </div>
                  <button onClick={() => { setNameVal(stats?.name || ""); setEditingName(true); }} style={{ background: "none", border: "none", color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "2px 6px" }}>Edit</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div style={S.section}>
          <div style={S.sectionLabel}>Appearance</div>
          <div style={S.rowFirst}>
            <span style={S.rowLabel}>Dark Mode</span>
            <button style={S.toggle(isDark)} onClick={onToggleTheme} aria-label="Toggle dark mode">
              <div style={S.toggleThumb(isDark)} />
            </button>
          </div>
        </div>

        {/* About */}
        <div style={S.section}>
          <div style={S.sectionLabel}>About</div>
          <div style={S.rowFirst}>
            <span style={S.rowLabel}>App</span>
            <span style={S.rowValue}>Khaaya</span>
          </div>
          <div style={S.row}>
            <span style={S.rowLabel}>Version</span>
            <span style={S.rowValue}>3.0</span>
          </div>
        </div>

        {/* Sign Out */}
        <div style={{ marginBottom: 20 }}>
          <button style={S.logoutBtn} onClick={onLogout}>Sign Out</button>
        </div>

        {/* Danger Zone */}
        <div style={{ background: T.card, borderRadius: 18, padding: "18px 18px", border: "1px solid rgba(255,59,48,0.25)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#FF3B30", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
            Danger Zone
          </div>

          {deleteState === "idle" && (
            <button style={S.dangerBtn} onClick={() => setDeleteState("confirm")}>
              Delete Account
            </button>
          )}

          {deleteState === "confirm" && (
            <div style={{ background: "rgba(255,59,48,0.07)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,59,48,0.25)" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>Are you sure?</div>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 16, lineHeight: 1.5 }}>
                Your account and all data will be permanently deleted. This cannot be undone.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setDeleteState("idle")}
                  style={{ flex: 1, background: T.inputBg, border: "none", borderRadius: 10, padding: "11px 0", color: T.text, fontWeight: 600, fontSize: 15, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeleteState("deleting");
                    setDeleteError("");
                    try {
                      await onDeleteAccount();
                    } catch (e) {
                      const msg = e.code === "auth/requires-recent-login"
                        ? "Please sign out and sign back in, then try again."
                        : "Something went wrong. Please try again.";
                      setDeleteError(msg);
                      setDeleteState("error");
                    }
                  }}
                  style={{ flex: 1, background: "#FF3B30", border: "none", borderRadius: 10, padding: "11px 0", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          )}

          {deleteState === "deleting" && (
            <div style={{ textAlign: "center", color: T.textSec, fontSize: 14, padding: "12px 0" }}>
              Deleting account…
            </div>
          )}

          {deleteState === "error" && (
            <div style={{ background: "rgba(255,59,48,0.07)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,59,48,0.25)" }}>
              <div style={{ color: "#FF3B30", fontSize: 13, fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>{deleteError}</div>
              <button
                onClick={() => setDeleteState("idle")}
                style={{ background: T.inputBg, border: "none", borderRadius: 10, padding: "10px 20px", color: T.text, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
