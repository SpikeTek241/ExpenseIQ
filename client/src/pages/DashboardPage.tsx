import logo from "../assets/logoiq.png";
import type { Insight, Transaction } from "../types";

type DashboardPageProps = {
  userEmail: string;
  totalSpent: number;
  transactions: Transaction[];
  topCategory: string;
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
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <img src={logo} alt="ExpenseIQ logo" className="hero-logo" />
          <p className="eyebrow">Finance Dashboard</p>
          <h1>ExpenseIQ</h1>
          <p className="subtext">
            Smart expense intelligence for tracking, reviewing, and improving
            spending habits.
          </p>
          <p className="subtext">Signed in as {userEmail}</p>
        </div>
      </section>

      <section className="summary-grid">
        <div className="card summary-card">
          <p className="card-label">Total Spent</p>
          <h2>${totalSpent.toFixed(2)}</h2>
        </div>

        <div className="card summary-card">
          <p className="card-label">Transactions</p>
          <h2>{transactions.length}</h2>
        </div>

        <div className="card summary-card">
          <p className="card-label">Top Category</p>
          <h2>{topCategory}</h2>
        </div>
      </section>

      <section className="card budget-card">
        <div className="section-header">
          <h3>Monthly Budget</h3>
        </div>

        <div className="budget-grid">
          <div className="budget-input-side">
            <label className="budget-input-group">
              Set Budget
              <input
                type="number"
                step="0.01"
                placeholder="Enter monthly budget"
                value={monthlyBudget}
                onChange={(e) =>
                  setMonthlyBudget(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </label>

            <button
              type="button"
              className="primary-button"
              onClick={saveBudget}
              disabled={isSavingBudget}
            >
              {isSavingBudget ? "Saving Budget..." : "Save Budget"}
            </button>
          </div>

          <div className="budget-stats">
            <p>
              Budget:{" "}
              <strong>
                {budgetAmount ? `$${budgetAmount.toFixed(2)}` : "Not set"}
              </strong>
            </p>
            <p>
              Spent: <strong>${totalSpent.toFixed(2)}</strong>
            </p>
            <p>
              💶 Remaining:{" "}
              <strong
                style={{ color: remainingBudget < 0 ? "#ef4444" : "#22c55e" }}
              >
                ${remainingBudget.toFixed(2)}
              </strong>
            </p>
            <p>
              Status: <strong>{budgetStatus}</strong>
            </p>
          </div>
        </div>

        <div className="budget-progress">
          <div
            className={`budget-progress-bar ${
              budgetStatus === "On track"
                ? "green"
                : budgetStatus === "Getting close"
                ? "yellow"
                : budgetStatus === "Over budget"
                ? "red"
                : ""
            }`}
            style={{ width: `${budgetUsedPercent}%` }}
          />
        </div>

        <p className="budget-percent">
          {budgetAmount
            ? `${budgetUsedPercent.toFixed(1)}% of monthly budget used`
            : "Set a monthly budget to track progress"}
        </p>
      </section>

      <section className="card">
        <div className="section-header">
          <h3>AI Insights</h3>
        </div>

        <div className="insight-list">
          {insights.length === 0 ? (
            <p className="empty-state">
              Add transactions and a monthly budget to unlock smarter insights.
            </p>
          ) : (
            insights.map((insight, index) => (
              <div key={index} className={`insight-item ${insight.type}`}>
                <span className="insight-icon">
                  {insight.type === "positive" && "🟢"}
                  {insight.type === "warning" && "🟡"}
                  {insight.type === "danger" && "🔴"}
                </span>
                <p>{insight.message}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}