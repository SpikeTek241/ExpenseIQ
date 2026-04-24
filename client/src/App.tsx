import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import type { Budget, Transaction, InsightsResponse, Insight } from "./types";
import LoginForm from "./components/LoginForm";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

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
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("all");

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

  const analyticsTransactions = useMemo(() => {
    if (dateRange === "all") return transactions;

    const now = new Date();
    const days = dateRange === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);

    return transactions.filter(
      (transaction) => new Date(transaction.createdAt) >= cutoff
    );
  }, [transactions, dateRange]);

  const categoryChartData = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const transaction of analyticsTransactions) {
      totals[transaction.category] =
        (totals[transaction.category] || 0) + transaction.amount;
    }

    return Object.entries(totals).map(([category, total]) => ({
      category,
      total: Number(total.toFixed(2)),
    }));
  }, [analyticsTransactions]);

  const trendData = useMemo(() => {
    const totalsByDate: Record<string, number> = {};

    for (const transaction of analyticsTransactions) {
      const date = new Date(transaction.createdAt).toLocaleDateString();
      totalsByDate[date] = (totalsByDate[date] || 0) + transaction.amount;
    }

    return Object.entries(totalsByDate).map(([date, amount]) => ({
      date,
      amount: Number(amount.toFixed(2)),
    }));
  }, [analyticsTransactions]);

  const cumulativeTrendData = useMemo(() => {
    let runningTotal = 0;

    const sorted = [...analyticsTransactions].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sorted.map((t) => {
      runningTotal += t.amount;

      return {
        date: new Date(t.createdAt).toLocaleDateString(),
        total: Number(runningTotal.toFixed(2)),
      };
    });
  }, [analyticsTransactions]);

  const categoryPercentages = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const t of analyticsTransactions) {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    }

    const total = analyticsTransactions.reduce((sum, t) => sum + t.amount, 0);

    return Object.entries(totals).map(([category, amount]) => ({
      category,
      percent: total ? Number(((amount / total) * 100).toFixed(1)) : 0,
    }));
  }, [analyticsTransactions]);

  if (!token || !user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute token={token}>
            <AppLayout userEmail={user.email} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              userEmail={user.email}
              totalSpent={totalSpent}
              transactions={transactions}
              topCategory={topCategory}
              monthlyBudget={monthlyBudget}
              setMonthlyBudget={setMonthlyBudget}
              budgetAmount={budgetAmount}
              remainingBudget={remainingBudget}
              budgetStatus={budgetStatus}
              budgetUsedPercent={budgetUsedPercent}
              isSavingBudget={isSavingBudget}
              saveBudget={saveBudget}
              insights={insights}
            />
          }
        />
        <Route
          path="/transactions"
          element={
            <TransactionsPage
              merchant={merchant}
              setMerchant={setMerchant}
              amount={amount}
              setAmount={setAmount}
              category={category}
              setCategory={setCategory}
              editingId={editingId}
              setEditingId={setEditingId}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isSavingTransaction={isSavingTransaction}
              addTransaction={addTransaction}
              filteredTransactions={filteredTransactions}
              startEditing={startEditing}
              deleteTransaction={deleteTransaction}
            />
          }
        />
        <Route
          path="/analytics"
          element={
            <AnalyticsPage
              categoryChartData={categoryChartData}
              trendData={trendData}
              cumulativeTrendData={cumulativeTrendData}
              categoryPercentages={categoryPercentages}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;