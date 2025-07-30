-- CreateTable
CREATE TABLE `statistics_snapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `period_type` VARCHAR(191) NOT NULL,
    `metric_name` VARCHAR(191) NOT NULL,
    `metric_value` DOUBLE NOT NULL,
    `metadata` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `statistics_snapshot_date_period_type_idx`(`date`, `period_type`),
    INDEX `statistics_snapshot_metric_name_idx`(`metric_name`),
    UNIQUE INDEX `statistics_snapshot_date_period_type_metric_name_key`(`date`, `period_type`, `metric_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statistics_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `metric_name` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `statistics_config_metric_name_key`(`metric_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_behavior_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `action_type` VARCHAR(191) NOT NULL,
    `target_type` VARCHAR(191) NULL,
    `target_id` INTEGER NULL,
    `metadata` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_behavior_stats_user_id_action_type_idx`(`user_id`, `action_type`),
    INDEX `user_behavior_stats_created_at_idx`(`created_at`),
    INDEX `user_behavior_stats_action_type_created_at_idx`(`action_type`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
