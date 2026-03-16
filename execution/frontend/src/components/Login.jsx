// execution/frontend/src/components/Login.jsx
// Email/Password + Google Sign-In — Apple iOS aesthetic

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useTheme } from "../theme";

export default function Login() {
  const { T, isDark, toggle } = useTheme();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleEmail = async () => {
    if (!email || !password) { setError("Enter email and password."); return; }
    setLoading(true); setError("");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/\(auth.*\)/, "").trim());
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}>
      {/* Theme toggle — top right */}
      <button onClick={toggle} style={{
        position: "fixed", top: 16, right: 16,
        background: T.inputBg, border: "none", borderRadius: 10,
        padding: "8px 12px", fontSize: 16, cursor: "pointer",
      }}>
        {isDark ? "☀️" : "🌙"}
      </button>

      <div style={{
        width: "100%",
        maxWidth: 400,
        background: T.card,
        borderRadius: 24,
        padding: "36px 28px",
        boxShadow: T.cardShadow,
      }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: T.accent, marginBottom: 8 }}>
            LOGYOURMEAL
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleEmail(); }}>
          <input
            id="login-email"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 17,
              color: T.text,
              marginBottom: 12,
              boxSizing: "border-box",
              outline: "none",
            }}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
          />
          <input
            id="login-password"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 17,
              color: T.text,
              marginBottom: 12,
              boxSizing: "border-box",
              outline: "none",
            }}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password (min 6 chars)"
          />

          {error && (
            <div style={{ color: "#FF3B30", fontSize: 13, fontWeight: 500, marginBottom: 12, textAlign: "center" }}>
              {error}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: T.btnPrimary,
              border: "none",
              borderRadius: 14,
              padding: 16,
              color: T.btnPrimaryText,
              fontWeight: 700,
              fontSize: 17,
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          textAlign: "center", color: T.textSec, fontSize: 13, fontWeight: 500,
          marginBottom: 14, display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: T.divider }} />
          or
          <div style={{ flex: 1, height: 1, background: T.divider }} />
        </div>

        {/* Google */}
        <button
          id="login-google"
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: "100%",
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: 14,
            color: T.text,
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        {/* Toggle */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 15, color: T.textSec }}>
          {isSignUp ? "Already have an account? " : "New here? "}
          <span
            style={{ color: T.accent, cursor: "pointer", fontWeight: 600 }}
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          >
            {isSignUp ? "Sign in" : "Create account"}
          </span>
        </div>
      </div>
    </div>
  );
}
