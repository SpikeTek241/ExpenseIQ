import type { Transaction } from "../types";

type TransactionsPageProps = {
  merchant: string;
  setMerchant: React.Dispatch<React.SetStateAction<string>>;
  amount: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  category: string;
  setCategory: React.Dispatch<React.SetStateAction<string>>;
  editingId: number | null;
  setEditingId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isSavingTransaction: boolean;
  addTransaction: (e: React.FormEvent) => Promise<void>;
  seedDemoTransactions: () => Promise<void>;
  filteredTransactions: Transaction[];
  startEditing: (transaction: Transaction) => void;
  deleteTransaction: (id: number) => Promise<void>;
};

export default function TransactionsPage({
  merchant,
  setMerchant,
  amount,
  setAmount,
  category,
  setCategory,
  editingId,
  setEditingId,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  isSavingTransaction,
  addTransaction,
  seedDemoTransactions,
  filteredTransactions,
  startEditing,
  deleteTransaction,
}: TransactionsPageProps) {
  return (
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

          <button
            type="button"
            className="cancel-button"
            onClick={seedDemoTransactions}
            disabled={isSavingTransaction}
          >
            Add Demo Transactions
          </button>
        </form>
      </div>

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
                    type="button"
                    className="edit-button"
                    onClick={() => startEditing(t)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => void deleteTransaction(t.id)}
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
  );
}