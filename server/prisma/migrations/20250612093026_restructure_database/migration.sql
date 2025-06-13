/*
  Warnings:

  - You are about to drop the column `city` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `wechat_id` on the `posts` table. All the data in the column will be lost.
  - You are about to alter the column `images` on the `posts` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `price` on the `posts` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Decimal(10,2)`.
  - You are about to drop the `recommendations` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `category` on table `posts` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `recommendations` DROP FOREIGN KEY `fk_recommendations_post`;

-- AlterTable
ALTER TABLE `posts` DROP COLUMN `city`,
    DROP COLUMN `wechat_id`,
    ADD COLUMN `city_code` VARCHAR(50) NULL,
    ADD COLUMN `contact_info` VARCHAR(255) NULL,
    ADD COLUMN `expires_at` DATETIME(0) NULL,
    ADD COLUMN `favorite_count` INTEGER NULL DEFAULT 0,
    ADD COLUMN `last_polished_at` DATETIME(0) NULL,
    ADD COLUMN `pinned_until` DATETIME(0) NULL,
    ADD COLUMN `price_unit` VARCHAR(10) NULL,
    ADD COLUMN `quality_score` DECIMAL(3, 2) NULL DEFAULT 0,
    ADD COLUMN `recommend_score` DECIMAL(5, 2) NULL DEFAULT 0,
    ADD COLUMN `sub_category` VARCHAR(50) NULL,
    ADD COLUMN `view_count` INTEGER NULL DEFAULT 0,
    MODIFY `category` ENUM('help', 'secondhand', 'housing') NOT NULL DEFAULT 'help',
    MODIFY `images` JSON NULL,
    MODIFY `price` DECIMAL(10, 2) NULL;

-- DropTable
DROP TABLE `recommendations`;

-- CreateTable
CREATE TABLE `weekly_deals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL DEFAULT 'WWS/Coles 每周特价打折商品',
    `image_url` VARCHAR(500) NULL,
    `week_start_date` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_week_active`(`week_start_date`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catalogue_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `store_name` VARCHAR(50) NOT NULL,
    `page_number` INTEGER NOT NULL,
    `image_data` LONGTEXT NOT NULL,
    `week_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_store_week`(`store_name`, `week_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_city_code` ON `posts`(`city_code`);

-- CreateIndex
CREATE INDEX `idx_category` ON `posts`(`category`);

-- CreateIndex
CREATE INDEX `idx_status` ON `posts`(`status`);

-- CreateIndex
CREATE INDEX `idx_created_at` ON `posts`(`created_at`);
