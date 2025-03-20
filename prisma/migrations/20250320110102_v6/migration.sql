/*
  Warnings:

  - You are about to drop the column `namE` on the `MenuItem` table. All the data in the column will be lost.
  - Added the required column `name` to the `MenuItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "namE",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PLACED';
