/*
  Warnings:

  - A unique constraint covering the columns `[tg_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "balance" SET DEFAULT 5,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL;

-- CreateIndex
CREATE UNIQUE INDEX "users_tg_id_key" ON "users"("tg_id");
