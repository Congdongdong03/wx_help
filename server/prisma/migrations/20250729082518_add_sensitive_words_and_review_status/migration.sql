-- AlterTable
ALTER TABLE `posts` ADD COLUMN `review_note` VARCHAR(191) NULL,
    ADD COLUMN `review_status` VARCHAR(191) NULL DEFAULT 'pending',
    ADD COLUMN `sensitive_words` VARCHAR(191) NULL,
    MODIFY `status` ENUM('draft', 'pending', 'published', 'failed', 'review_required', 'rejected') NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE `sensitive_word` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `word` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sensitive_word_word_category_key`(`word`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
