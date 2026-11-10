-- 将原全局币种配置迁移为渠道级配置；已有全局记录会复制到每个有效渠道。
DROP PROCEDURE IF EXISTS add_currency_setting_channel_id;
DELIMITER $$
CREATE PROCEDURE add_currency_setting_channel_id()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'cms_currency_setting'
      AND column_name = 'channel_id'
  ) THEN
    ALTER TABLE `cms_currency_setting`
      ADD COLUMN `channel_id` bigint NULL COMMENT '所属渠道ID' AFTER `id`;
  END IF;
END$$
DELIMITER ;

CALL add_currency_setting_channel_id();
DROP PROCEDURE IF EXISTS add_currency_setting_channel_id;

INSERT INTO `cms_currency_setting` (`channel_id`, `currency`, `tag`, `updated_at`, `created_at`)
SELECT
  ch.`id`,
  legacy.`currency`,
  legacy.`tag`,
  legacy.`updated_at`,
  legacy.`created_at`
FROM `cms_currency_setting` legacy
CROSS JOIN `mms_channel` ch
WHERE legacy.`channel_id` IS NULL
  AND ch.`deleted_at` IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `cms_currency_setting` existing
    WHERE existing.`channel_id` = ch.`id`
      AND existing.`currency` = legacy.`currency`
      AND existing.`tag` = legacy.`tag`
      AND existing.`deleted_at` IS NULL
  );

DELETE FROM `cms_currency_setting`
WHERE `channel_id` IS NULL
  AND EXISTS (
    SELECT 1
    FROM `mms_channel`
    WHERE `deleted_at` IS NULL
  );

DROP PROCEDURE IF EXISTS finalize_currency_setting_channel;
DELIMITER $$
CREATE PROCEDURE finalize_currency_setting_channel()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'cms_currency_setting'
      AND column_name = 'channel_id'
      AND is_nullable = 'YES'
  ) AND NOT EXISTS (
    SELECT 1
    FROM `cms_currency_setting`
    WHERE `channel_id` IS NULL
  ) THEN
    ALTER TABLE `cms_currency_setting`
      MODIFY COLUMN `channel_id` bigint NOT NULL COMMENT '所属渠道ID';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'cms_currency_setting'
      AND index_name = 'idx_currency_setting_channel'
  ) THEN
    ALTER TABLE `cms_currency_setting`
      ADD INDEX `idx_currency_setting_channel` (`channel_id`);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'cms_currency_setting'
      AND index_name = 'idx_currency_setting_channel_tag'
  ) THEN
    ALTER TABLE `cms_currency_setting`
      ADD INDEX `idx_currency_setting_channel_tag` (`channel_id`, `tag`);
  END IF;
END$$
DELIMITER ;

CALL finalize_currency_setting_channel();
DROP PROCEDURE IF EXISTS finalize_currency_setting_channel;
