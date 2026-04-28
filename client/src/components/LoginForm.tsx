import { useState } from "react";
import logo from "../assets/logoiq.png";

type AuthFormProps = {
  onLoginSuccess: (token: string, user: { id: number; email: string }) => void;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function LoginForm({ onLoginSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Email and password are required");
      }

      if (mode === "signup") {
        const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
          }),
        });

        const registerData = await registerRes.json();

        if (!registerRes.ok) {
          throw new Error(registerData.error || "Signup failed");
        }
      }

      const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.error || "Login failed");
      }

      localStorage.setItem("token", loginData.token);
      localStorage.setItem("user", JSON.stringify(loginData.user));

      setEmail("");
      setPassword("");

      onLoginSuccess(loginData.token, loginData.user);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setError("");
    setEmail("");
    setPassword("");
    setMode((prev) => (prev === "login" ? "signup" : "login"));
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <img src={logo} alt="ExpenseIQ logo" className="login-logo" />

        <h1 className="auth-title">
          {mode === "login" ? "Welcome to ExpenseIQ" : "Create your account"}
        </h1>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to access your personal expense dashboard."
            : "Create an account to start tracking your budget and spending."}
        </p>

        <form onSubmit={handleAuth} className="auth-form" autoComplete="off">
          <label htmlFor="expenseiq-email">
            Email
            <input
              id="expenseiq-email"
              name="expenseiq-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="off"
            />
          </label>

          <label htmlFor="expenseiq-password">
            Password
            <input
              id="expenseiq-password"
              name="expenseiq-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="new-password"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
              ? "Login"
              : "Sign Up"}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch-button"
          onClick={handleModeSwitch}
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}