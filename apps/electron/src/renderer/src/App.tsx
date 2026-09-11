import { useEffect, useState } from "react";

type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function App(): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    const unsubscribeAuthenticated = window.onAuthenticated((next) => {
      setUser(next as AuthUser);
      setError(null);
    });
    const unsubscribeError = window.onAuthError((ctx) => {
      setError(ctx.message ?? "Authentication failed");
    });
    const unsubscribeUpdated = window.onUserUpdated((next) => {
      setUser(next as AuthUser | null);
    });

    return () => {
      unsubscribeAuthenticated();
      unsubscribeError();
      unsubscribeUpdated();
    };
  }, []);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 420,
        margin: "4rem auto",
        padding: "0 1.5rem",
        display: "grid",
        gap: "1rem",
      }}
      data-test="desktop-auth"
    >
      <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Tangerine Desktop</h1>
      <p style={{ margin: 0, opacity: 0.75 }}>
        Blank Electron shell with Better Auth. Sign in opens the system browser; the session is
        stored in the main process.
      </p>

      {error ? (
        <p role="alert" style={{ color: "crimson", margin: 0 }} data-test="desktop-auth-error">
          {error}
        </p>
      ) : null}

      {user ? (
        <section style={{ display: "grid", gap: "0.75rem" }} data-test="desktop-auth-user">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {user.image ? (
              <img src={user.image} alt="" width={40} height={40} style={{ borderRadius: "50%" }} />
            ) : null}
            <div>
              <div style={{ fontWeight: 600 }}>{user.name ?? "Signed in"}</div>
              <div style={{ opacity: 0.7, fontSize: "0.875rem" }}>{user.email}</div>
            </div>
          </div>
          <button type="button" data-test="desktop-sign-out" onClick={() => void window.signOut()}>
            Sign out
          </button>
        </section>
      ) : (
        <section style={{ display: "grid", gap: "0.75rem" }}>
          <button
            type="button"
            data-test="desktop-sign-in"
            onClick={() => {
              setError(null);
              void window.requestAuth({ provider: "github" });
            }}
          >
            Sign in with GitHub
          </button>
          <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.875rem" }}>
            Manual auth code (Linux fallback)
            <input
              data-test="desktop-auth-code"
              value={manualCode}
              maxLength={32}
              placeholder="Paste 32-character code"
              onChange={(event) => {
                const value = event.target.value;
                setManualCode(value);
                if (value.length === 32) {
                  void window.authenticate({ token: value });
                }
              }}
            />
          </label>
        </section>
      )}
    </main>
  );
}

export default App;
