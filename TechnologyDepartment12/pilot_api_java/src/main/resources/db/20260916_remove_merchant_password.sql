SET @merchant_edit_pwd_permission_id = (
  SELECT `id`
  FROM `ams_permission`
  WHERE `name` = 'merchant.editPwd'
  LIMIT 1
);

UPDATE `ams_role`
SET `permission_ids` = TRIM(BOTH ',' FROM REPLACE(
  CONCAT(',', `permission_ids`, ','),
  CONCAT(',', @merchant_edit_pwd_permission_id, ','),
  ','
))
WHERE @merchant_edit_pwd_permission_id IS NOT NULL
  AND FIND_IN_SET(CAST(@merchant_edit_pwd_permission_id AS CHAR), `permission_ids`) > 0;

DELETE FROM `ams_permission`
WHERE `name` = 'merchant.editPwd';

DROP PROCEDURE IF EXISTS remove_merchant_password_column;
DELIMITER $$
CREATE PROCEDURE remove_merchant_password_column()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'mms_merchant'
      AND column_name = 'password'
  ) THEN
    ALTER TABLE `mms_merchant` DROP COLUMN `password`;
  END IF;
END$$
DELIMITER ;

CALL remove_merchant_password_column();
DROP PROCEDURE IF EXISTS remove_merchant_password_column;
