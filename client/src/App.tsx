import logo from "./assets/logoiq.png";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import type { Budget, Transaction, InsightsResponse, Insight } from "./types";
import LoginForm from "./components/LoginForm";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

type User = {
  id: number;
  email: string;
};

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<number | "">("");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const handleLoginSuccess = (
    newToken: string,
    loggedInUser: { id: number; email: string }
  ) => {
    setToken(newToken);
    setUser(loggedInUser);
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setInsights([]);
  };

  const handleLogout = () => {
    handleUnauthorized();
  };

  const fetchTransactions = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        headers: authHeaders(),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch transactions");
      }

      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setTransactions([]);
    }
  };

  const fetchBudgets = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/budgets`, {
        headers: authHeaders(),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch budgets");
      }

      setBudgets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
      setBudgets([]);
    }
  };

  const fetchInsights = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/insights`, {
        headers: authHeaders(),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data: InsightsResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || "Failed to fetch insights"
        );
      }

      setInsights(Array.isArray(data?.insights) ? data.insights : []);
    } catch (error) {
      console.error("Failed to fetch insights:", error);
      setInsights([]);
    }
  };

  useEffect(() => {
    if (!token) return;

    const loadAll = async () => {
      await Promise.all([
        fetchTransactions(),
        fetchBudgets(),
        fetchInsights(),
      ]);
    };

    void loadAll();

    const interval = setInterval(() => {
      void loadAll();
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (budgets.length > 0) {
      setMonthlyBudget(budgets[0].limit);
    } else {
      setMonthlyBudget("");
    }
  }, [budgets]);

  const saveBudget = async () => {
    if (monthlyBudget === "" || Number(monthlyBudget) <= 0 || isSavingBudget) {
      return;
    }

    try {
      setIsSavingBudget(true);

      const res = await fetch(`${API_BASE}/api/budgets`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          category: "Monthly",
          limit: Number(monthlyBudget),
          month: new Date().toISOString().slice(0, 7),
        }),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save budget");
      }

      await fetchBudgets();
      await fetchInsights();
    } catch (error) {
      console.error("Failed to save budget:", error);
      alert(error instanceof Error ? error.message : "Budget save failed");
    } finally {
      setIsSavingBudget(false);
    }
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!merchant.trim() || !amount || !category || isSavingTransaction) {
      alert("Please fill in merchant, amount, and category.");
      return;
    }

    try {
      setIsSavingTransaction(true);

      const url =
        editingId !== null
          ? `${API_BASE}/api/transactions/${editingId}`
          : `${API_BASE}/api/transactions`;

      const method = editingId !== null ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          merchant: merchant.trim(),
          amount: Number(amount),
          category,
        }),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save transaction");
      }

      setMerchant("");
      setAmount("");
      setCategory("Shopping");
      setEditingId(null);

      await fetchTransactions();
      await fetchInsights();
      await fetchBudgets();
    } catch (error) {
      console.error("Failed to save transaction:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Transaction failed. Check the console."
      );
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete transaction");
      }

      await fetchTransactions();
      await fetchInsights();
      await fetchBudgets();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      alert(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const startEditing = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setMerchant(transaction.merchant);
    setAmount(transaction.amount.toString());
    setCategory(transaction.category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const budgetAmount = useMemo(() => {
    return monthlyBudget ? Number(monthlyBudget) : 0;
  }, [monthlyBudget]);

  const remainingBudget = useMemo(() => {
    return budgetAmount - totalSpent;
  }, [budgetAmount, totalSpent]);

  const budgetUsedPercent = useMemo(() => {
    if (!budgetAmount) return 0;
    return Math.min((totalSpent / budgetAmount) * 100, 100);
  }, [totalSpent, budgetAmount]);

  const budgetStatus = useMemo(() => {
    if (!budgetAmount) return "No budget set";
    if (totalSpent < budgetAmount * 0.75) return "On track";
    if (totalSpent < budgetAmount) return "Getting close";
    return "Over budget";
  }, [totalSpent, budgetAmount]);

  const topCategory = useMemo(() => {
    if (transactions.length === 0) return "N/A";

    const totals: Record<string, number> = {};

    for (const transaction of transactions) {
      totals[transaction.category] =
        (totals[transaction.category] || 0) + transaction.amount;
    }

    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesCategory =
        selectedCategory === "All" || transaction.category === selectedCategory;

      const matchesSearch = transaction.merchant
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [transactions, selectedCategory, searchQuery]);

  const categoryChartData = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const transaction of filteredTransactions) {
      totals[transaction.category] =
        (totals[transaction.category] || 0) + transaction.amount;
    }

    return Object.entries(totals).map(([category, total]) => ({
      category,
      total: Number(total.toFixed(2)),
    }));
  }, [filteredTransactions]);

  if (!token || !user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <main className="dashboard">
      <section className="hero">
        <div className="hero-content">
          <img src={logo} alt="ExpenseIQ logo" className="hero-logo" />
          <p className="eyebrow">Finance Dashboard</p>
          <h1>ExpenseIQ</h1>
          <p className="subtext">
            Smart expense intelligence for tracking, reviewing, and improving
            spending habits.
          </p>
          <p className="subtext">Signed in as {user.email}</p>
          <button
            type="button"
            className="cancel-button"
            onClick={handleLogout}
          >
            Logout
          </button>
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

      <section className="content-grid">
        <div className="card">
          <h3>{editingId !== null ? "Edit Transaction" : "Add Transaction"}</h3>

          <form className="transaction-form" onSubmit={addTransaction}>
            <label>
              Merchant
              <input
                type="text"
                placeholder="Enter merchant name"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
              />
            </label>

            <label>
              Amount
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>

            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Shopping">Shopping</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Bills">Bills</option>
                <option value="Entertainment">Entertainment</option>
              </select>
            </label>

            <button
              type="submit"
              className={`primary-button ${
                editingId !== null ? "edit-mode" : ""
              }`}
              disabled={isSavingTransaction}
            >
              {isSavingTransaction
                ? "Saving..."
                : editingId !== null
                ? "Update Transaction"
                : "Add Transaction"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setEditingId(null);
                  setMerchant("");
                  setAmount("");
                  setCategory("Shopping");
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        <div className="card">
          <h3>AI Insights</h3>
          <div className="insight-list">
            {insights.length === 0 ? (
              <p className="empty-state">
                Add transactions and a monthly budget to unlock smarter
                insights.
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
        </div>
      </section>

      <section className="bottom-grid">
        <section className="card chart-card">
          <div className="section-header">
            <h3>Spending by Category</h3>
          </div>

          {categoryChartData.length === 0 ? (
            <p className="empty-state">No chart data yet.</p>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fill: "#94a3b8" }} />
                  <YAxis tick={{ fill: "#94a3b8" }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card transactions-card">
          <div className="section-header">
            <h3>Recent Transactions</h3>
          </div>

          <div className="filter-row">
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Shopping">Shopping</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Bills">Bills</option>
              <option value="Entertainment">Entertainment</option>
            </select>

            <input
              className="search-input"
              type="text"
              placeholder="Search merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredTransactions.length === 0 ? (
            <p className="empty-state">No transactions found.</p>
          ) : (
            <div className="transactions-list">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="transaction-row">
                  <div>
                    <p className="merchant">{t.merchant}</p>
                    <p className="category-badge">{t.category}</p>
                  </div>

                  <div className="transaction-actions">
                    <p className="amount">${t.amount.toFixed(2)}</p>
                    <button
                      className="edit-button"
                      onClick={() => startEditing(t)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => deleteTransaction(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;