import { useEffect, useMemo, useState } from "react";
import logo from "./assets/logo.png"
import "./App.css";
import type { Budget, Transaction, InsightsResponse } from "./types";
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



function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<number | "">("");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions`);
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/budgets`);
      const data = await res.json();
      setBudgets(data);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/insights`);
      const data: InsightsResponse = await res.json();
      setInsights(data.insights);
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchBudgets();
    fetchInsights();
  }, []);

  useEffect(() => {
    if (budgets.length > 0) {
      setMonthlyBudget(budgets[0].limit);
    }
  }, [budgets]);

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!merchant || !amount || !category) return;

    try {
      if (editingId !== null) {
        await fetch(`${API_BASE}/api/transactions/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merchant,
            amount: Number(amount),
            category,
          }),
        });
      } else {
        await fetch(`${API_BASE}/api/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merchant,
            amount: Number(amount),
            category,
          }),
        });
      }

      setMerchant("");
      setAmount("");
      setCategory("Shopping");
      setEditingId(null);
      fetchTransactions();
      fetchInsights();
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: "DELETE",
      });

      fetchTransactions();
      fetchInsights();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const startEditing = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setMerchant(transaction.merchant);
    setAmount(transaction.amount.toString());
    setCategory(transaction.category);
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

    const counts: Record<string, number> = {};

    for (const transaction of transactions) {
      counts[transaction.category] = (counts[transaction.category] || 0) + 1;
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesCategory =
        selectedCategory === "All" ||
        transaction.category === selectedCategory;

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

  return (
    <main className="dashboard">
      <section className="hero">
        <div>
          <p className="eyebrow">Finance Dashboard</p>
          <h1>ExpenseIQ</h1>
          <p className="subtext">
            Smart expense intelligence for tracking, reviewing, and improving
            spending habits.
          </p>
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
                style={{
                  color: remainingBudget < 0 ? "#ef4444" : "#22c55e",
                }}
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
          <h3>Add Transaction</h3>

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
              style={{
                backgroundColor: editingId !== null ? "#f59e0b" : "#3b82f6",
              }}
            >
              {editingId !== null ? "Update Transaction" : "Add Transaction"}
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
              <p className="empty-state">No insights available yet.</p>
            ) : (
              insights.map((insight, index) => (
                <div key={index} className="insight-item">
                  <span>💡 {insight}</span>
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
                  <Bar
                    dataKey="total"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                  />
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