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

type DateRange = "7d" | "30d" | "all";

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
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [sortOption, setSortOption] = useState("newest");

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
    alert("Session expired. Please log in again.");
  };

  const handleLogout = () => {
    handleUnauthorized();
  };

  const fetchTransactions = async () => {
    if (!token) return;

    try {
      setIsLoadingTransactions(true);

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
      alert("Failed to load transactions.");
    } finally {
      setIsLoadingTransactions(false);
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
      alert("Failed to load budgets.");
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
      alert("Failed to load insights.");
    }
  };

  useEffect(() => {
    if (!token) return;

    const loadAll = async () => {
      await Promise.all([fetchTransactions(), fetchBudgets(), fetchInsights()]);
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
      alert("Please enter a valid monthly budget.");
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
      alert("Budget saved!");
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

    const isDuplicate = 
      editingId === null &&
      transactions.some((t) => {
        const sameMerchant = 
          t.merchant.toLowerCase() === merchant.trim().toLocaleLowerCase();

        const sameAmount = t.amount === Number(amount);

        const sameDay = 
          new Date(t.createdAt).toISOString().split("T")[0] ===
          new Date().toISOString().split("T")[0];

        return sameMerchant && sameAmount && sameDay;
      });

    if (isDuplicate) {
      alert("This transaction already exists today.");
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

      alert(
        editingId !== null ? "Transaction updated!" : "Transaction added!"
      );

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

  const seedDemoTransactions = async () => {
    if (isSavingTransaction) return;

    const now = new Date();

    const demoTransactions = [
      { merchant: "Publix", amount: 42.35, category: "Food", daysAgo: 1 },
      { merchant: "Shell", amount: 38.2, category: "Transport", daysAgo: 2 },
      { merchant: "Amazon", amount: 86.99, category: "Shopping", daysAgo: 3 },
      {
        merchant: "Netflix",
        amount: 15.49,
        category: "Entertainment",
        daysAgo: 5,
      },
      { merchant: "FPL", amount: 126.75, category: "Bills", daysAgo: 7 },
    ];

    try {
      setIsSavingTransaction(true);

      for (const transaction of demoTransactions) {
        const date = new Date(now);
        date.setDate(now.getDate() - transaction.daysAgo);

        const res = await fetch(`${API_BASE}/api/transactions`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            merchant: transaction.merchant,
            amount: transaction.amount,
            category: transaction.category,
            createdAt: date.toISOString(),
          }),
        });

        if (res.status === 401) {
          handleUnauthorized();
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to seed demo transaction");
        }
      }

      await fetchTransactions();
      await fetchInsights();
      await fetchBudgets();

      alert("Demo transactions added!");
    } catch (error) {
      console.error("Failed to seed demo transactions:", error);
      alert(error instanceof Error ? error.message : "Demo seed failed");
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const exportTransactionsCSV = () => {
    if (transactions.length === 0) {
      alert("No transactions to export.");
      return;
    }

    const headers = ["Merchant", "Amount", "Category", "Date"];

    const rows = transactions.map((transaction) => [
      transaction.merchant,
      transaction.amount.toFixed(2),
      transaction.category,
      new Date(transaction.createdAt).toISOString().split("T")[0],
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "expenseiq-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);

    alert("CSV exported!");
  };

  const deleteTransaction = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

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

      alert("Transaction deleted.");
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
    return transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
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
    let result = transactions.filter((transaction) => {
      const matchesCategory =
        selectedCategory === "All" || transaction.category === selectedCategory;

      const matchesSearch = transaction.merchant
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
   });

    switch (sortOption) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
         );
      break;
    case "oldest":
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
      break;
    case "highest":
      result.sort((a, b) => b.amount - a.amount);
      break;
    case "lowest":
      result.sort((a, b) => a.amount - b.amount);
      break;
  }

  return result;
}, [transactions, selectedCategory, searchQuery, sortOption]);

  const analyticsTransactions = useMemo(() => {
    if (dateRange === "all") return transactions;

    const days = dateRange === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

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
      const date = new Date(transaction.createdAt).toISOString().split("T")[0];
      totalsByDate[date] = (totalsByDate[date] || 0) + transaction.amount;
    }

    return Object.entries(totalsByDate)
      .map(([date, amount]) => ({
        date,
        amount: Number(amount.toFixed(2)),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [analyticsTransactions]);

  const cumulativeTrendData = useMemo(() => {
    let runningTotal = 0;
    const groupedByDate: Record<string, number> = {};

    for (const transaction of analyticsTransactions) {
      const date = new Date(transaction.createdAt).toISOString().split("T")[0];
      groupedByDate[date] =
        (groupedByDate[date] || 0) + transaction.amount;
    }

    return Object.entries(groupedByDate)
      .map(([date, amount]) => ({
        date,
        amount,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item) => {
        runningTotal += item.amount;

        return {
          date: item.date,
          total: Number(runningTotal.toFixed(2)),
        };
      });
  }, [analyticsTransactions]);

  const categoryPercentages = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const transaction of analyticsTransactions) {
      totals[transaction.category] =
        (totals[transaction.category] || 0) + transaction.amount;
    }

    const total = analyticsTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    return Object.entries(totals).map(([category, amount]) => ({
      category,
      percent: total ? Number(((amount / total) * 100).toFixed(1)) : 0,
    }));
  }, [analyticsTransactions]);

  const analyticsInsights = useMemo(() => {
    if (analyticsTransactions.length === 0) {
      return ["No transactions found for this selected date range."];
    }

    const total = analyticsTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    const highestTransaction = [...analyticsTransactions].sort(
      (a, b) => b.amount - a.amount
    )[0];

    const totalsByDate: Record<string, number> = {};

    for (const transaction of analyticsTransactions) {
      const date = new Date(transaction.createdAt).toISOString().split("T")[0];

      totalsByDate[date] =
        (totalsByDate[date] || 0) + transaction.amount;
    }

    const highestDay = Object.entries(totalsByDate).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const rangeLabel =
      dateRange === "7d"
        ? "the last 7 days"
        : dateRange === "30d"
        ? "the last 30 days"
        : "all time";

    return [
      `You spent $${total.toFixed(2)} during ${rangeLabel}.`,
      `Your largest transaction was $${highestTransaction.amount.toFixed(
        2
      )} at ${highestTransaction.merchant}.`,
      `Your highest spending day was ${highestDay[0]} with $${highestDay[1].toFixed(
        2
      )}.`,
    ];
  }, [analyticsTransactions, dateRange]);

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
              sortOption={sortOption}
              setSortOption={setSortOption}
              isSavingTransaction={isSavingTransaction}
              isLoading={isLoadingTransactions}
              addTransaction={addTransaction}
              seedDemoTransactions={seedDemoTransactions}
              exportTransactionsCSV={exportTransactionsCSV}
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
              analyticsInsights={analyticsInsights}
              isLoading={isLoadingTransactions}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;