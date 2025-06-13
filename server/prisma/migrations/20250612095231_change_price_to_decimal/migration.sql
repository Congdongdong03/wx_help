/*
  Warnings:

  - You are about to alter the column `category` on the `posts` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE `posts` MODIFY `category` VARCHAR(50) NULL,
    MODIFY `images` TEXT NULL;
