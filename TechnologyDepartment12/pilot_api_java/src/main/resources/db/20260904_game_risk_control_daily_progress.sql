-- `init.sql` 的建表定义已包含该列；本脚本仅用于为已有数据库补充每日风控进度日期。
DROP PROCEDURE IF EXISTS add_game_risk_control_progress_date;
DELIMITER $$
CREATE PROCEDURE add_game_risk_control_progress_date()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'game_risk_control'
      AND column_name = 'progress_date'
  ) THEN
    ALTER TABLE `game_risk_control`
      ADD COLUMN `progress_date` date NULL DEFAULT NULL COMMENT '今日盈利归属日期（系统时区）' AFTER `progress`;
  END IF;
END$$
DELIMITER ;

CALL add_game_risk_control_progress_date();
DROP PROCEDURE IF EXISTS add_game_risk_control_progress_date;

UPDATE `game_risk_control`
SET
  `progress` = 0,
  `progress_date` = CURRENT_DATE()
WHERE `progress_date` IS NULL;
