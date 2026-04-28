import type { Insight, Transaction } from "../types";

type MonthlyReport = {
  totalSpent: number;
  transactionCount: number;
  topCategory: string;
  largestPurchase: string;
  largestAmount: number;
  budgetStatus: string;
};

type DashboardPageProps = {
  userEmail: string;
  totalSpent: number;
  transactions: Transaction[];
  topCategory: string;
  monthlyReport: MonthlyReport;
  monthlyBudget: number | "";
  setMonthlyBudget: React.Dispatch<React.SetStateAction<number | "">>;
  budgetAmount: number;
  remainingBudget: number;
  budgetStatus: string;
  budgetUsedPercent: number;
  isSavingBudget: boolean;
  saveBudget: () => Promise<void>;
  insights: Insight[];
};

export default function DashboardPage({
  userEmail,
  totalSpent,
  transactions,
  topCategory,
  monthlyReport,
  monthlyBudget,
  setMonthlyBudget,
  budgetAmount,
  remainingBudget,
  budgetStatus,
  budgetUsedPercent,
  isSavingBudget,
  saveBudget,
  insights,
}: DashboardPageProps) {
  const averageTransaction =
    transactions.length > 0 ? totalSpent / transactions.length : 0;

  return (
    <>
      <section className="dashboard-hero">
        <p className="eyebrow">Finance Dashboard</p>
        <h1>ExpenseIQ</h1>
        <p className="hero-subtitle">
          Track spending, monitor budgets, and uncover smarter financial
          insights.
        </p>
        <p className="signed-in-text">Signed in as {userEmail}</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Spent</p>
          <h2 className="stat-value">${totalSpent.toFixed(2)}</h2>
          <p className="stat-sub">This month</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Transactions</p>
          <h2 className="stat-value">{transactions.length}</h2>
          <p className="stat-sub">Recorded</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Top Category</p>
          <h2 className="stat-value">{topCategory}</h2>
          <p className="stat-sub">Highest spend</p>
        </div>
      </section>

      <section className="card report-card">
        <div className="section-header">
          <p className="eyebrow">Monthly Report</p>
          <h3>Your Financial Snapshot</h3>
        </div>

        <div className="report-grid">
          <div className="report-item highlight">
            <span>Largest Purchase</span>
            <strong>
              {monthlyReport.largestPurchase} · $
              {monthlyReport.largestAmount.toFixed(2)}
            </strong>
          </div>

          <div className="report-item">
            <span>Budget Used</span>
            <strong>{budgetUsedPercent.toFixed(1)}%</strong>
          </div>

          <div className="report-item">
            <span>Remaining</span>
            <strong className={remainingBudget >= 0 ? "positive" : "danger"}>
              ${remainingBudget.toFixed(2)}
            </strong>
          </div>

          <div className="report-item">
            <span>Average Transaction</span>
            <strong>${averageTransaction.toFixed(2)}</strong>
          </div>

          <div className="report-item">
            <span>Budget Status</span>
            <strong
              className={`status ${monthlyReport.budgetStatus
                .toLowerCase()
                .replaceAll(" ", "-")}`}
            >
              {monthlyReport.budgetStatus}
            </strong>
          </div>
        </div>
      </section>

      <section className="card budget-card">
        <h3>Monthly Budget</h3>

        <div className="budget-grid">
          <div className="budget-input-section">
            <label className="budget-label">Set Monthly Budget</label>

            <input
              className="budget-input"
              type="number"
              min="0"
              step="0.01"
              value={monthlyBudget}
              onChange={(e) =>
                setMonthlyBudget(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />

            <button
              type="button"
              className="primary-button budget-button"
              onClick={saveBudget}
              disabled={isSavingBudget}
            >
              {isSavingBudget ? "Saving..." : "Save Budget"}
            </button>
          </div>

          <div className="budget-stats">
            <div className="budget-row">
              <span>Budget</span>
              <strong>${budgetAmount.toFixed(2)}</strong>
            </div>

            <div className="budget-row">
              <span>Spent</span>
              <strong>${totalSpent.toFixed(2)}</strong>
            </div>

            <div className="budget-row">
              <span>Remaining</span>
              <strong className={remainingBudget >= 0 ? "positive" : "danger"}>
                ${remainingBudget.toFixed(2)}
              </strong>
            </div>

            <div className="budget-row">
              <span>Status</span>
              <strong
                className={`status ${budgetStatus
                  .toLowerCase()
                  .replaceAll(" ", "-")}`}
              >
                {budgetStatus}
              </strong>
            </div>
          </div>
        </div>

        <div className="progress-track">
          <div
            className={`progress-fill ${
              budgetUsedPercent >= 100
                ? "danger-fill"
                : budgetUsedPercent >= 75
                ? "warning-fill"
                : "positive-fill"
            }`}
            style={{ width: `${budgetUsedPercent}%` }}
          />
        </div>

        <p className="budget-caption">
          {budgetUsedPercent.toFixed(1)}% of monthly budget used
        </p>
      </section>

      <section className="card insights-card">
        <p className="eyebrow">AI Insights</p>
        <h3>Smart Financial Signals</h3>

        {insights.length === 0 ? (
          <p className="empty-state">
            Add transactions and a monthly budget to unlock smarter insights.
          </p>
        ) : (
          <div className="insight-list">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`insight-item ${
                  insight.type === "danger"
                    ? "danger"
                    : insight.type === "warning"
                    ? "warning"
                    : "positive"
                }`}
              >
                <span className="insight-dot" />
                <p>{insight.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}