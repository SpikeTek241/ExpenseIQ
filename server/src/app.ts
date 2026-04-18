import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import cors from "cors";
import { authenticate, AuthRequest } from "./middleware/auth";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ message: "ExpenseIQ backend is running" });
});

app.get("/api/transactions", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/api/transactions", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { merchant, amount, category } = req.body ?? {};

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!merchant || amount === undefined || !category) {
      res.status(400).json({
        error: "merchant, amount, and category are required",
      });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        merchant,
        amount: Number(amount),
        category,
        userId,
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Failed to create transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

app.put(
  "/api/transactions/:id",
  authenticate,
  async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
    try {
      const userId = req.user?.userId;
      const id = Number(req.params.id);
      const { merchant, amount, category } = req.body ?? {};

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingTransaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          merchant,
          amount: Number(amount),
          category,
        },
      });

      res.status(200).json(updatedTransaction);
    } catch (error) {
      console.error("Failed to update transaction:", error);
      res.status(500).json({ error: "Failed to update transaction" });
    }
  }
);

app.delete(
  "/api/transactions/:id",
  authenticate,
  async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
    try {
      const userId = req.user?.userId;
      const id = Number(req.params.id);

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingTransaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      await prisma.transaction.delete({
        where: { id },
      });

      res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  }
);

app.get("/api/budgets", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { id: "desc" },
    });

    res.json(budgets);
  } catch (error) {
    console.error("Failed to fetch budgets:", error);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.post("/api/budgets", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { category, limit, month } = req.body ?? {};

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!category || limit === undefined || !month) {
      res.status(400).json({
        error: "category, limit, and month are required",
      });
      return;
    }

    const existingBudget = await prisma.budget.findFirst({
      where: {
        category,
        month,
        userId,
      },
    });

    if (existingBudget) {
      const updatedBudget = await prisma.budget.update({
        where: { id: existingBudget.id },
        data: {
          limit: Number(limit),
        },
      });

      res.status(200).json(updatedBudget);
      return;
    }

    const newBudget = await prisma.budget.create({
      data: {
        category,
        limit: Number(limit),
        month,
        userId,
      },
    });

    res.status(201).json(newBudget);
  } catch (error) {
    console.error("Failed to save budget:", error);
    res.status(500).json({ error: "Failed to save budget" });
  }
});

app.get("/api/insights", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        month: currentMonth,
        category: "Monthly",
      },
      orderBy: { id: "desc" },
    });

    if (transactions.length === 0) {
      res.json({
        insights: [
          "No transactions yet. Add a few expenses to unlock smarter insights.",
        ],
      });
      return;
    }

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

    const categoryTotals: Record<string, number> = {};
    for (const transaction of transactions) {
      categoryTotals[transaction.category] =
        (categoryTotals[transaction.category] || 0) + transaction.amount;
    }

    const sortedCategories = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    );

    const [topCategoryName, topCategoryAmount] = sortedCategories[0];

    const largestExpense = transactions.reduce((max, t) =>
      t.amount > max.amount ? t : max
    );

    const insights: string[] = [];

    if (budget && budget.limit > 0) {
      const percentUsed = (totalSpent / budget.limit) * 100;

      insights.push(
        `You’ve spent $${totalSpent.toFixed(2)} this month, which is ${percentUsed.toFixed(
          1
        )}% of your budget. ${
          percentUsed < 50
            ? "You're in a healthy range."
            : percentUsed < 80
            ? "You're getting close to your limit."
            : "You're close to exceeding your budget."
        }`
      );
    } else {
      insights.push(
        `You’ve spent $${totalSpent.toFixed(
          2
        )} this month. Set a monthly budget to unlock budget-aware insights.`
      );
    }

    const topCategoryPercent = (topCategoryAmount / totalSpent) * 100;
    insights.push(
      `Most of your spending is in ${topCategoryName} ($${topCategoryAmount.toFixed(
        2
      )}), which makes up ${topCategoryPercent.toFixed(
        1
      )}% of your total spending.`
    );

    insights.push(
      `Your largest purchase was $${largestExpense.amount.toFixed(
        2
      )} at ${largestExpense.merchant}, which stands out compared to your other expenses.`
    );

    if (budget && budget.limit > 0) {
      const remaining = budget.limit - totalSpent;

      insights.push(
        `You still have $${Math.max(remaining, 0).toFixed(
          2
        )} remaining this month, so you're ${
          remaining >= 0 ? "on track" : "over budget"
        }.`
      );

      if (remaining < 0) {
        insights.push(
          `You are over budget by $${Math.abs(remaining).toFixed(2)}.`
        );
      }
    }

    res.json({ insights: insights.slice(0, 6) });
  } catch (error) {
    console.error("Failed to generate insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default app;