import { NavLink, Outlet } from "react-router-dom";

type AppLayoutProps = {
  userEmail: string;
  onLogout: () => void;
};

export default function AppLayout({
  userEmail,
  onLogout,
}: AppLayoutProps) {
  return (
    <main className="dashboard">
      <header className="app-nav">
        <div className="app-nav-left">
          <h2 className="app-nav-brand">ExpenseIQ</h2>

          <nav className="app-nav-links">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
          </nav>
        </div>

        <div className="app-nav-right">
          <span className="app-nav-user">{userEmail}</span>
          <button type="button" className="cancel-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <Outlet />
    </main>
  );
}