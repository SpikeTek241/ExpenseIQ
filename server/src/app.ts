import { PrismaClient } from "@prisma/client";
import express, { Request, Response, } from "express";
import cors from "cors";

const app = express();
const prisma = new PrismaClient()

app.use(cors());
app.use(express.json());

app.get("/api/health" , (_req, res) => {
    res.json({ message: "ExpenseIQ backend is running" });
});

app.get("/api/transactions", async (_req, res) => {
  const transactions = await prisma.transaction.findMany()
  res.json(transactions)
})

app.post("/api/transactions", async (req, res) => {
  try {
    const { merchant, amount, category } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        merchant,
        amount: Number(amount),
        category,
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

app.put("/api/transactions/:id", async (req: Request<{ id: string }>, res: Response) => {
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
  });

app.delete("/api/transactions/:id", async (req: Request<{ id: string}>, res: Response) => {
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
});

export default app;