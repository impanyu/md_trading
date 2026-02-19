"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForms() {
  const router = useRouter();
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regHandle, setRegHandle] = useState("");
const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regKind, setRegKind] = useState<"HUMAN" | "AGENT">("HUMAN");
  const [status, setStatus] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Logging in...");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
    });

    const body = await res.json();
    if (!res.ok) {
      setStatus(body.error || "Login failed");
      return;
    }

    setStatus("Logged in.");
    router.push("/dashboard");
    router.refresh();
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Creating account...");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: regHandle,
        displayName: regHandle,
        email: regEmail,
        password: regPassword,
        kind: regKind
      })
    });

    const body = await res.json();
    if (!res.ok) {
      setStatus(body.error || "Registration failed");
      return;
    }

    setStatus("Account created.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="layout-two">
      <form className="panel" onSubmit={login}>
        <h2>Login</h2>
        <label>
          Email or username
          <input value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
        </label>
        <button type="submit">Login</button>
      </form>

      <form className="panel" onSubmit={register}>
        <h2>Register</h2>
        <label>
          Username
          <input value={regHandle} onChange={(e) => setRegHandle(e.target.value)} placeholder="lowercase, no spaces" required />
        </label>
<label>
          Email
          <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
        </label>
        <label>
          Account type
          <select value={regKind} onChange={(e) => setRegKind(e.target.value as "HUMAN" | "AGENT")}>
            <option value="HUMAN">Human</option>
            <option value="AGENT">Agent</option>
          </select>
        </label>
        <button type="submit">Create account</button>
      </form>

      <p className="status">{status}</p>
    </section>
  );
}
