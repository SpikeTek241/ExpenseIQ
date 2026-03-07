import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type Transaction = {
  id: string;
  merchant: string;
  amount: number;
  category: string;
};

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchTransactions = async () => {
    const { data, error } = await supabase.from("transactions").select("*");

    if (error) {
      console.error("Supabase error:", error);
      setErrorMessage(error.message);
    } else {
      setTransactions(data || []);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", color: "white" }}>
      <h1>Expense IQ</h1>
      <h2>Transactions</h2>

      {errorMessage && <p>Error: {errorMessage}</p>}

      {transactions.length === 0 && !errorMessage ? (
        <p>No transactions yet</p>
      ) : (
        transactions.map((t) => (
          <div key={t.id}>
            {t.merchant} — ${t.amount} ({t.category})
          </div>
        ))
      )}
    </div>
  );
}

export default App;