/*
  Warnings:

  - A unique constraint covering the columns `[content]` on the table `Detail` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Detail_content_key" ON "Detail"("content");
