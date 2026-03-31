import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ message: "ExpenseIQ backend is running" });
});

app.get("/api/transactions", async (_req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { merchant, amount, category } = req.body;

    if (!merchant || amount === undefined || !category) {
      return res.status(400).json({
        error: "merchant, amount, and category are required",
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        merchant,
        amount: Number(amount),
        category,
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
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { merchant, amount, category } = req.body;

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
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);

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

app.get("/api/budgets", async (_req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      orderBy: { id: "desc" },
    });

    res.json(budgets);
  } catch (error) {
    console.error("Failed to fetch budgets:", error);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.post("/api/budgets", async (req, res) => {
  try {
    const { category, limit, month } = req.body || {};

    if (!category || limit === undefined || !month) {
      return res.status(400).json({
        error: "category, limit, and month are required",
      });
    }

    const existingBudget = await prisma.budget.findFirst({
      where: {
        category,
        month,
      },
    });

    if (existingBudget) {
      const updatedBudget = await prisma.budget.update({
        where: { id: existingBudget.id },
        data: {
          limit: Number(limit),
        },
      });

      return res.status(200).json(updatedBudget);
    }

    const newBudget = await prisma.budget.create({
      data: {
        category,
        limit: Number(limit),
        month,
      },
    });

    res.status(201).json(newBudget);
  } catch (error) {
    console.error("Failed to save budget:", error);
    res.status(500).json({ error: "Failed to save budget" });
  }
});

app.get("/api/insights", async (_req, res) => {
  try {
    const transactions = await prisma.transaction.findMany();

    if (transactions.length === 0) {
      return res.json({
        insights: ["No transactions yet. Add transactions to generate insights."],
      });
    }

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    const categoryTotals: Record<string, number> = {};

    for (const t of transactions) {
      categoryTotals[t.category] =
        (categoryTotals[t.category] || 0) + t.amount;
    }

    const insights: string[] = [];

    for (const [category, amount] of Object.entries(categoryTotals)) {
      if (amount > total * 0.4) {
        insights.push(`High spending detected in ${category}`);
      }
    }

    const largest = transactions.reduce((max, t) =>
      t.amount > max.amount ? t : max
    );

    insights.push(`Largest expense: ${largest.merchant} - $${largest.amount.toFixed(2)}`);

    res.json({ insights });
  } catch (error) {
    console.error("Failed to generate insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default app;