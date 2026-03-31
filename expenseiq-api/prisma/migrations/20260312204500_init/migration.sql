-- CreateTable
CREATE TABLE "Transction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "merchant" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
