/*
 Navicat Premium Data Transfer

 Source Server         : Gaja777_主数据库
 Source Server Type    : MySQL
 Source Server Version : 80045
 Source Host           : gamex5.cluster-cfuk48i8ixca.ap-south-1.rds.amazonaws.com:3306
 Source Schema         : game_pilot

 Target Server Type    : MySQL
 Target Server Version : 80045
 File Encoding         : 65001

 Date: 01/09/2026 00:00:00
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for ams_admin
-- ----------------------------
DROP TABLE IF EXISTS `ams_admin`;
CREATE TABLE `ams_admin`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `platform_id` bigint NOT NULL DEFAULT 10000 COMMENT '平台ID',
  `role_id` int NOT NULL DEFAULT 0 COMMENT '角色id',
  `google_encrypt` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '谷歌验证�?,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状�?1:正常 0:禁止',
  `is_package` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否子渠道包管理�?,
  `password` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `opt_pwd` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '操作密码',
  `package_ids` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '子渠道ID�?,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `admin_type` tinyint NULL DEFAULT NULL COMMENT '管理员类�?0:内部管理�?1:商户管理�?2:渠道管理�?,
  `merchant_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '商户id，多个商户id逗号隔开',
  `channel_id` bigint NULL DEFAULT NULL COMMENT '渠道id',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `admins_name_unique`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '管理员表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ams_admin
-- ----------------------------
INSERT INTO `ams_admin` VALUES (1, 0, 1, 'KCNYYEXASQ6WITRT', 'admin', 1, 0, '$2a$10$dL1mo1tixD4an30oqkfPneqPUVKddWDME4whKObDzr4mxPXC6fDQi', '$2y$10$lBIVk7oIF1E7HFEqp0kA3.CKkMa3pvBOs6p0edc9ViEa7jrMs49Oi', '', '2021-09-16 12:05:41', '2026-06-05 17:50:12', 0, '0', 0);

-- ----------------------------
-- Table structure for ams_admin_login_log
-- ----------------------------
DROP TABLE IF EXISTS `ams_admin_login_log`;
CREATE TABLE `ams_admin_login_log`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL COMMENT '管理员id',
  `login_ip` varchar(512) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '登录ip',
  `login_area` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '登录地域',
  `token` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '登录token',
  `is_offline` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否踢下线（0�?1是）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时�?,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_admin_login_log_token`(`token` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '管理员登录日志表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ams_admin_login_log
-- ----------------------------

-- ----------------------------
-- Table structure for ams_channel_report
-- ----------------------------
DROP TABLE IF EXISTS `ams_channel_report`;
CREATE TABLE `ams_channel_report`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `merchant_id` bigint NULL DEFAULT 0 COMMENT '商户ID',
  `channel_id` bigint NULL DEFAULT 0 COMMENT '渠道ID',
  `bets_number` int NULL DEFAULT 0 COMMENT '投注玩家人数',
  `bets` bigint NULL DEFAULT 0 COMMENT '投注金额',
  `payout` bigint NULL DEFAULT 0 COMMENT '派彩金额',
  `player_wl` bigint NULL DEFAULT 0 COMMENT '玩家输赢',
  `platform_wl` bigint NULL DEFAULT 0 COMMENT '平台盈亏',
  `tag` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT NULL COMMENT '货币标识',
  `game_code` varchar(32) NULL DEFAULT NULL COMMENT 'game code; NULL=legacy',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
  ,INDEX `idx_channel_report_game_code`(`game_code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 44 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '渠道报表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ams_channel_report
-- ----------------------------

-- ----------------------------
-- Table structure for ams_daily_report
-- ----------------------------
DROP TABLE IF EXISTS `ams_daily_report`;
CREATE TABLE `ams_daily_report`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bets_number` int NULL DEFAULT 0 COMMENT '投注玩家数量',
  `bets` bigint NULL DEFAULT 0 COMMENT '投注金额',
  `payout` bigint NULL DEFAULT 0 COMMENT '派彩金额',
  `player_wl` bigint NULL DEFAULT 0 COMMENT '玩家输赢',
  `platform_wl` bigint NULL DEFAULT 0 COMMENT '平台盈亏',
  `tag` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT NULL COMMENT '货币标识',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `date` date NULL DEFAULT NULL COMMENT '日期',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 39 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '日报�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ams_daily_report
-- ----------------------------

-- ----------------------------
-- Table structure for ams_ip_list
-- ----------------------------
DROP TABLE IF EXISTS `ams_ip_list`;
CREATE TABLE `ams_ip_list`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '限制的ip',
  `admin_status` int NULL DEFAULT 1 COMMENT '后台ip�?启用0不启�?,
  `api_status` int NULL DEFAULT 1 COMMENT 'api 1启用0不启�?,
  `remarks` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '备注',
  `admin_name` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '操作管理�?,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'IP白名单表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ams_ip_list
-- ----------------------------

-- ----------------------------
-- Table structure for ams_merchant_report
-- ----------------------------
DROP TABLE IF EXISTS `ams_merchant_report`;
CREATE TABLE `ams_merchant_report`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `merchant_id` bigint NULL DEFAULT 0 COMMENT '商户ID',
  `bets_number` int NULL DEFAULT 0 COMMENT '投注玩家数量',
  `bets` bigint NULL DEFAULT 0 COMMENT '投注金额',
  `payout` bigint NULL DEFAULT 0 COMMENT '派彩金额',
  `player_wl` bigint NULL DEFAULT 0 COMMENT '玩家输赢',
  `platform_wl` bigint NULL DEFAULT 0 COMMENT '平台盈亏',
  `tag` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT NULL COMMENT '货币标识',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 30 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '商户报表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ams_merchant_report
-- ----------------------------

-- ----------------------------
-- Table structure for ams_permission
-- ----------------------------
DROP TABLE IF EXISTS `ams_permission`;
CREATE TABLE `ams_permission`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `pid` bigint NOT NULL DEFAULT 0 COMMENT '父级ID',
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限名称',
  `file_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '文件�?,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '标题',
  `icon` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '图标',
  `path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '访问路径',
  `component` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'vue 对应的组件地址',
  `sort` bigint NOT NULL DEFAULT 1 COMMENT '排序',
  `hidden` tinyint NOT NULL DEFAULT 1 COMMENT '是否隐藏 0=false|不隐�?1=true|隐藏',
  `no_keep_alive` tinyint NOT NULL DEFAULT 0 COMMENT '当前路由是否不缓�?默认值：false)',
  `guard_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '守卫名称',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 104 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '权限�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ams_permission
-- ----------------------------
INSERT INTO `ams_permission` VALUES (1, 0, 'system', 'System', '系统', '', '/system', 'layout/Layout', 4, 0, 0, 'admin', '2021-09-16 12:05:42', '2021-11-02 19:27:34');
INSERT INTO `ams_permission` VALUES (2, 1, 'admin.admins', 'Admin', '管理员列�?, '', '/system/admin', 'system/admin/index', 7, 0, 0, 'admin', '2021-11-02 15:52:08', '2021-11-02 17:10:53');
INSERT INTO `ams_permission` VALUES (3, 2, 'admin.create', '', '添加管理�?, '', 'admin/create', 'admin/create', 1, 1, 0, 'admin', '2021-11-02 15:53:24', '2021-11-02 16:01:27');
INSERT INTO `ams_permission` VALUES (4, 2, 'admin.update', '', '编辑管理�?, '', 'admin/update', 'admin/update', 1, 1, 0, 'admin', '2021-11-02 15:53:57', '2021-11-02 16:01:38');
INSERT INTO `ams_permission` VALUES (5, 2, 'admin.delete', '', '删除管理�?, '', 'admin.delete', 'admin.delete', 1, 1, 0, 'admin', '2021-11-02 15:54:29', '2021-11-02 16:01:49');
INSERT INTO `ams_permission` VALUES (7, 0, 'log.name', 'Log', '日志管理', '', '/log', 'layout/Layout', 2, 0, 0, 'admin', '2021-10-05 10:26:13', '2021-11-02 19:26:30');
INSERT INTO `ams_permission` VALUES (8, 7, 'log.adminOperationLog', 'AdminOperationLog', '管理员操作日�?, '', '/log/admin-operation-log', 'log/admin-operation-log/index', 1, 0, 0, 'admin', '2021-10-15 15:10:47', '2021-10-30 20:21:22');
INSERT INTO `ams_permission` VALUES (9, 1, 'permission.permissions', 'Permissions', '权限列表', '', '/system/permission', 'system/permission/permissions', 2, 0, 0, 'admin', '2021-11-02 17:02:26', '2021-11-02 17:02:26');
INSERT INTO `ams_permission` VALUES (10, 9, 'permission.create', '', '添加权限', '', 'permission/create', 'permission/create', 1, 1, 0, 'admin', '2021-09-16 12:05:42', '2021-09-16 12:05:42');
INSERT INTO `ams_permission` VALUES (11, 9, 'permission.update', '', '编辑权限', '', 'permission/update', 'permission/update', 1, 1, 0, 'admin', '2021-09-16 12:05:42', '2021-09-16 12:05:42');
INSERT INTO `ams_permission` VALUES (12, 9, 'permission.delete', '', '删除权限', '', 'permission/delete', 'permission/delete', 1, 1, 0, 'admin', '2021-09-16 12:05:42', '2021-09-16 12:05:42');
INSERT INTO `ams_permission` VALUES (14, 2, 'role.syncRoles', '', '授权权限', '', 'admin/syncRoles', 'admin/syncRoles', 1, 1, 0, 'admin', '2021-11-02 15:56:10', '2021-11-07 19:10:00');
INSERT INTO `ams_permission` VALUES (15, 2, 'admin.reset', '', 'google验证�?, '', 'admin/reset', 'admin/reset', 1, 1, 0, 'admin', '2021-11-02 15:56:54', '2021-11-02 16:02:27');
INSERT INTO `ams_permission` VALUES (16, 1, 'role.roles', 'Roles', '角色列表', '', '/system/role', 'system/role/roles', 3, 0, 0, 'admin', '2021-11-02 16:51:04', '2021-11-02 17:09:02');
INSERT INTO `ams_permission` VALUES (17, 16, 'role.create', '', '添加角色', '', 'role/create', 'role/create', 2, 1, 0, 'admin', '2021-11-02 16:52:10', '2021-11-07 19:28:52');
INSERT INTO `ams_permission` VALUES (18, 16, 'role.update', '', '编辑角色', '', 'role/update', 'role/update', 1, 1, 0, 'admin', '2021-11-02 16:52:39', '2021-11-02 16:56:46');
INSERT INTO `ams_permission` VALUES (19, 16, 'role.delete', '', '删除角色', '', 'role/delete', 'role/delete', 1, 1, 0, 'admin', '2021-11-02 16:53:13', '2021-11-02 16:56:57');
INSERT INTO `ams_permission` VALUES (20, 16, 'role.syncPermissions', '', '分配权限/目录', '', 'role/syncPermissions', 'role/syncPermissions', 1, 1, 0, 'admin', '2021-11-02 16:54:26', '2021-11-02 16:57:21');
INSERT INTO `ams_permission` VALUES (21, 0, 'gameSetting.name', 'Game_Settings', '游戏设置页面', 'el-icon-document', '/game_settings', 'layout/Layout', 1, 0, 0, 'admin', '2022-04-05 11:46:54', '2022-04-05 14:43:21');
INSERT INTO `ams_permission` VALUES (22, 21, 'gameSetting.list', 'gameSetting', '游戏配置', 'el-icon-document', '/game_settings', 'game_settings/index', 1, 0, 0, 'admin', '2022-04-05 11:53:09', '2022-04-05 14:44:21');
INSERT INTO `ams_permission` VALUES (23, 22, 'gameSetting.update', 'update', '编辑', 'el-icon-document', 'gameSetting/update', 'gameSetting/update', 1, 1, 0, 'admin', '2022-04-05 14:59:14', '2022-04-05 14:59:14');
INSERT INTO `ams_permission` VALUES (30, 0, 'user.name', 'user', '用户中心', 'el-icon-document', '/user', 'layout/Layout', 1, 0, 0, 'admin', '2022-04-07 15:22:50', '2022-04-09 16:47:31');
INSERT INTO `ams_permission` VALUES (31, 30, 'user.list', 'user', '玩家列表', 'el-icon-document', '/user', 'user/index', 1, 0, 0, 'admin', '2022-04-07 15:23:37', '2022-04-07 15:23:52');
INSERT INTO `ams_permission` VALUES (32, 0, 'realTimeMonitoring.name', 'realTimeMonitoring', '实时监控', 'el-icon-document', '/realTime_monitoring', 'layout/Layout', 1, 0, 0, 'admin', '2022-04-09 11:56:25', '2022-04-09 11:56:25');
INSERT INTO `ams_permission` VALUES (33, 32, 'realTimeMonitoring.list', 'realTimeMonitoring', '实时监控', 'el-icon-document', '/realTime_monitoring', 'realTime_monitoring/index', 1, 0, 0, 'admin', '2022-04-09 11:57:42', '2022-04-09 11:57:42');
INSERT INTO `ams_permission` VALUES (35, 1, 'merchant.list', 'merchant', '商户列表', 'el-icon-document', '/merchant', 'merchant/index', 1, 0, 0, 'admin', '2022-04-09 19:07:57', '2022-04-09 19:07:57');
INSERT INTO `ams_permission` VALUES (36, 1, 'channel.list', 'channel', '渠道列表', 'el-icon-document', '/channel', 'channel/index', 1, 0, 0, 'admin', '2022-04-09 19:31:31', '2022-04-09 19:31:31');
INSERT INTO `ams_permission` VALUES (37, 1, 'systemConfig.list', 'systemConfig', '系统配置', 'el-icon-document', '/system_config', 'system_config/index', 1, 0, 0, 'admin', '2022-04-09 20:36:26', '2022-04-09 20:36:26');
INSERT INTO `ams_permission` VALUES (39, 30, 'coinRecord.list', 'coinRecord', '玩家投注记录', 'el-icon-document', '/user_betting_history', 'user_betting_history/index', 1, 0, 0, 'admin', '2022-04-10 20:47:38', '2022-04-10 20:47:38');
INSERT INTO `ams_permission` VALUES (40, 30, 'gameRecord.list', 'gameRecord', '游戏结算记录', 'el-icon-document', '/game_settlement_record', 'game_settlement_record/index', 1, 0, 0, 'admin', '2022-04-10 20:48:30', '2022-04-10 20:48:30');
INSERT INTO `ams_permission` VALUES (41, 0, 'merchantReport.name', 'merchantReport', '商户报表', 'el-icon-document', '/merchant_statement', 'layout/Layout', 1, 0, 0, 'admin', '2022-04-11 18:28:55', '2022-04-11 18:29:18');
INSERT INTO `ams_permission` VALUES (42, 41, 'merchantSummary.list', 'merchantSummary', '商户汇�?, 'el-icon-document', '/merchant_statement/merchant_summary', 'merchant_statement/merchant_summary/index', 1, 0, 0, 'admin', '2022-04-11 18:32:28', '2022-04-11 18:32:28');
INSERT INTO `ams_permission` VALUES (43, 41, 'channelSummary.list', 'channelSummary', '渠道汇�?, 'el-icon-document', '/merchant_statement/channel_summary', 'merchant_statement/channel_summary/index', 1, 0, 0, 'admin', '2022-04-11 20:25:10', '2022-04-11 20:25:10');
INSERT INTO `ams_permission` VALUES (44, 41, 'dailySummary.list', 'dailySummary', '每日汇�?, 'el-icon-document', '/merchant_statement/daily_summary', 'merchant_statement/daily_summary/index', 1, 0, 0, 'admin', '2022-04-11 22:17:19', '2022-04-11 22:17:19');
INSERT INTO `ams_permission` VALUES (46, 32, 'gameControl.list', 'gameControl', '游戏控制', 'el-icon-document', '/game_control', 'game_control/index', 1, 0, 0, 'admin', '2022-04-14 18:24:38', '2022-04-14 18:24:38');
INSERT INTO `ams_permission` VALUES (47, 1, 'serverConfig.list', 'serverConfig', '服务配置', 'el-icon-document', '/server_config', 'server_config/index', 1, 0, 0, 'admin', '2022-04-16 17:29:36', '2022-04-16 17:29:36');
INSERT INTO `ams_permission` VALUES (49, 1, 'currencySetting.list', 'currencySetting', '币种配置', 'el-icon-document', '/currency_setting', 'currency_setting/index', 1, 0, 0, 'admin', '2022-04-18 20:56:43', '2022-04-18 20:56:43');
INSERT INTO `ams_permission` VALUES (50, 30, 'coinLog.list', 'coinLog', '用户转账日志记录', 'el-icon-document', '/coin_log', 'coin_log/index', 1, 0, 0, 'admin', '2022-04-19 15:36:17', '2022-04-19 15:36:17');
INSERT INTO `ams_permission` VALUES (51, 2, 'admin.admin', '', '查看管理�?, '', 'admin/admin', 'admin/admin', 1, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (52, 2, 'admin.syncPermissions', '', '同步权限', '', 'admin/syncPermissions', 'admin/syncPermissions', 1, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (53, 9, 'permission.permission', '', '查看权限', '', 'permission/permission', 'permission/permission', 1, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (54, 16, 'role.role', '', '查看角色', '', 'role/role', 'role/role', 1, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (55, 22, 'gameSetting.add', '', '添加游戏配置', '', 'gameSetting/add', 'gameSetting/add', 1, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (56, 22, 'gameSetting.updateMaintain', '', '游戏维护开�?, '', 'gameSetting/updateMaintain', 'gameSetting/updateMaintain', 1, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (57, 22, 'robotSetting.update', '', '编辑机器人配�?, '', 'robotSetting/update', 'robotSetting/update', 1, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (60, 31, 'user.addCoin', '', '玩家上下�?, '', 'user/addCoin', 'user/addCoin', 6, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (61, 31, 'user.openAll', '', '解锁所有玩�?, '', 'user/openAll', 'user/openAll', 5, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (62, 31, 'user.outAll', '', '踢出所有玩�?, '', 'user/outAll', 'user/outAll', 4, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (63, 31, 'user.stopGame', '', '停止游戏', '', 'user/stopGame', 'user/stopGame', 3, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (64, 31, 'user.updateUserStatus', '', '玩家封号', '', 'user/updateUserStatus', 'user/updateUserStatus', 2, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (65, 31, 'user.outGame', '', '踢玩家下�?, '', 'user/outGame', 'user/outGame', 1, 1, 0, 'admin', '2026-06-05 07:19:46', '2026-06-05 07:19:46');
INSERT INTO `ams_permission` VALUES (68, 35, 'merchant.delMerchant', '', '删除商户', '', 'merchant/delMerchant', 'merchant/delMerchant', 3, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (69, 35, 'merchant.update', '', '编辑商户', '', 'merchant/update', 'merchant/update', 2, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (70, 35, 'merchant.create', '', '添加商户', '', 'merchant/create', 'merchant/create', 1, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (74, 36, 'channel.delChannel', '', '删除渠道', '', 'channel/delChannel', 'channel/delChannel', 3, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (75, 36, 'channel.update', '', '编辑渠道', '', 'channel/update', 'channel/update', 2, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (76, 36, 'channel.create', '', '添加渠道', '', 'channel/create', 'channel/create', 1, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (77, 37, 'systemConfig.delChannel', '', '删除配置', '', 'systemConfig/delSystemConfig', 'systemConfig/delSystemConfig', 3, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (78, 37, 'systemConfig.update', '', '编辑配置', '', 'systemConfig/update', 'systemConfig/update', 2, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (79, 37, 'systemConfig.create', '', '添加配置', '', 'systemConfig/create', 'systemConfig/create', 1, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (80, 47, 'serverConfig.update', '', '编辑服务配置', '', 'serverConfig/update', 'serverConfig/update', 2, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (81, 47, 'serverConfig.create', '', '添加服务配置', '', 'serverConfig/create', 'serverConfig/create', 1, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (83, 41, 'channelRealSummary.list', 'channelRealSummary', '渠道实时汇�?, 'el-icon-document', '/merchant_statement/channel_real_summary', 'merchant_statement/channel_real_summary/index', 1, 0, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (84, 46, 'gameControl.delete', '', '删除(币种配置路由复用)', '', 'gameControl/delete', 'gameControl/delete', 7, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (85, 46, 'gameControl.create', '', '添加(币种配置路由复用)', '', 'gameControl/create', 'gameControl/create', 6, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (86, 46, 'gameControl.updateLowerCoinStatus', '', '开�?关闭游戏中下�?, '', 'gameControl/updateLowerCoinStatus', 'gameControl/updateLowerCoinStatus', 5, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (87, 46, 'gameControl.updateAddCoinStatus', '', '开�?关闭游戏中上�?, '', 'gameControl/updateAddCoinStatus', 'gameControl/updateAddCoinStatus', 4, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (88, 46, 'gameControl.updateMaintain', '', '游戏维护开�?, '', 'gameControl/updateMaintain', 'gameControl/updateMaintain', 3, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (89, 46, 'gameControl.updateGameMax', '', '编辑最大结算倍数', '', 'gameControl/updateGameMax', 'gameControl/updateGameMax', 2, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (90, 46, 'gameControl.update', '', '编辑游戏控制', '', 'gameControl/update', 'gameControl/update', 1, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (91, 0, 'task.name', 'Task', '任务管理', 'el-icon-document', '/task', 'layout/Layout', 1, 0, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (92, 91, 'task.list', 'task', '任务列表', 'el-icon-document', '/task/list', 'task/index', 1, 0, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (93, 91, 'task.capital', '', '任务资金明细', '', '/task/capital', 'task/capital/index', 3, 0, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (94, 95, 'taskUser.acceptTask', '', '任务审核', '', 'taskUser/acceptTask', 'taskUser/acceptTask', 1, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (95, 91, 'task.examination', '', '任务审核列表', '', '/task/examination', 'task/examination/index', 2, 0, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (96, 92, 'task.create', '', '添加/修改任务', '', 'task/create', 'task/create', 1, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (100, 1, 'ipList.list', 'ipList', 'IP白名�?, 'el-icon-document', '/ip_list', 'ip_list/index', 1, 0, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (101, 100, 'ipList.del', '', '删除IP', '', 'ipList/del', 'ipList/del', 3, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (102, 100, 'ipList.update', '', '编辑IP', '', 'ipList/update', 'ipList/update', 2, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');
INSERT INTO `ams_permission` VALUES (103, 100, 'ipList.create', '', '添加IP', '', 'ipList/create', 'ipList/create', 1, 1, 0, 'admin', '2026-06-05 07:19:47', '2026-06-05 07:19:47');

-- ----------------------------
-- Table structure for ams_role
-- ----------------------------
DROP TABLE IF EXISTS `ams_role`;
CREATE TABLE `ams_role`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '角色名称',
  `permission_ids` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '权限id',
  `data_scope` tinyint NOT NULL DEFAULT 0 COMMENT '数据范围: 0=受限, 1=全部',
  `guard_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '守卫名称',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '角色�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ams_role
-- ----------------------------
INSERT INTO `ams_role` VALUES (1, 'Admin', '1,2,3,4,5,7,8,9,10,11,12,14,15,16,17,18,19,20,21,22,23,30,31,32,33,35,36,37,38,39,40,41,42,43,44,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,68,69,70,74,75,76,77,78,79,80,81,83,84,85,86,87,88,89,90,91,92,93,94,95,96,100,101,102,103', 1, '', '2021-09-16 12:05:42', '2026-06-05 19:22:30');

-- ----------------------------
-- Table structure for cms_currency_setting
-- ----------------------------
DROP TABLE IF EXISTS `cms_currency_setting`;
CREATE TABLE `cms_currency_setting`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `currency` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT NULL COMMENT '币种',
  `tag` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT NULL COMMENT '币种符号',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '币种配置�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of cms_currency_setting
-- ----------------------------
INSERT INTO `cms_currency_setting` VALUES (8, 'INR', 'INR', '2026-06-03 09:33:40', '2026-05-06 12:27:08');

-- ----------------------------
-- Table structure for cms_game_control
-- ----------------------------
DROP TABLE IF EXISTS `cms_game_control`;
CREATE TABLE `cms_game_control`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `system` bigint NULL DEFAULT 1 COMMENT '系统配置(id)',
  `channel` bigint NULL DEFAULT 1 COMMENT '渠道(id)',
  `reserve` bigint NULL DEFAULT 0 COMMENT '金额',
  `progress` bigint NULL DEFAULT 0 COMMENT '当前进度',
  `rebate` double NULL DEFAULT 0 COMMENT '公式乘数',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `game_status` tinyint NULL DEFAULT 0 COMMENT '游戏维护状�?0:开�?1:维护�?,
  `game_max` double(10, 0) NULL DEFAULT 0 COMMENT '游戏最大结算倍数',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '游戏控制表（渠道级赔率与限额配置�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of cms_game_control
-- ----------------------------
INSERT INTO `cms_game_control` VALUES (1, 9, 10009, 5000, 14680, 9, '2026-06-16 04:27:06', '2026-06-12 18:56:54', 0, 2000);
INSERT INTO `cms_game_control` VALUES (2, 1, 10006, 100000, 0, 9, '2026-06-10 14:44:19', '2026-04-30 18:56:54', 0, 5000);
INSERT INTO `cms_game_control` VALUES (3, 9, 10008, 5000, 0, 1, '2026-06-13 07:42:36', '2026-04-30 18:56:54', 0, 2000);

-- ----------------------------
-- Table structure for cms_game_setting
-- ----------------------------
DROP TABLE IF EXISTS `cms_game_setting`;
CREATE TABLE `cms_game_setting`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `initial_bet` bigint NOT NULL DEFAULT 0 COMMENT '初始投注金额',
  `btn_bet` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '按钮金额列表',
  `amplitude` bigint NOT NULL DEFAULT 0 COMMENT '递增减幅�?,
  `bet_min` bigint NOT NULL DEFAULT 0 COMMENT '最小投�?,
  `bet_max` bigint NOT NULL DEFAULT 0 COMMENT '最大投�?,
  `settlement_min` decimal(10, 2) NOT NULL COMMENT '最小结算倍数',
  `settlement_max` decimal(10, 2) NOT NULL COMMENT '最大结算倍数',
  `game_max` decimal(10, 2) NULL DEFAULT NULL COMMENT '游戏最大结算倍数',
  `game_status` tinyint NOT NULL DEFAULT 0 COMMENT '游戏维护状�?0:开�?1:维护�?,
  `free_bet_enabled` tinyint NOT NULL DEFAULT 1 COMMENT '是否开启免费下�?,
  `free_bet_amount` bigint NOT NULL DEFAULT 100 COMMENT '单次免费下注金额(�?',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `channel` bigint NOT NULL DEFAULT 1 COMMENT '渠道ID',
  `rule_content` text CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL COMMENT '规则内容',
  `system` bigint NOT NULL DEFAULT 1 COMMENT '系统配置ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '游戏设置�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of cms_game_setting
-- ----------------------------
INSERT INTO `cms_game_setting` VALUES (1, 100, '1,10,20,50', 5, 1, 10000, 100, 1000, 10, 0, 1, 100, '2026-06-12 12:29:17', '2026-06-12 18:56:54', 10009, '', 1);
INSERT INTO `cms_game_setting` VALUES (2, 100, '1,10,20,50', 5, 1, 10000, 1, 10, 10, 0, 1, 100, '2026-06-05 20:59:25', '2026-04-30 18:56:54', 10006, '', 1);
INSERT INTO `cms_game_setting` VALUES (3, 100, '1,10,20,50', 5, 1, 10000, 1, 10, 10, 0, 1, 100, '2026-06-05 20:59:25', '2026-04-30 18:56:54', 10008, '', 1);

-- ----------------------------
-- Table structure for cms_robot_setting
-- ----------------------------
DROP TABLE IF EXISTS `cms_robot_setting`;
CREATE TABLE `cms_robot_setting`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bet_range` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT '' COMMENT '机器人下注范�?10, 20 ,50; . . .) 10 下注基数�?0 最大下注倍数�?0 权重',
  `multiple_range` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '机器人结算倍数范围',
  `betting_odds` int NOT NULL DEFAULT 0 COMMENT '投注几率',
  `robot_number` varchar(20) NOT NULL DEFAULT '0' COMMENT '机器人数量（数字=固定；逗号分隔=随机范围，如5,30�?,
  `robot_enabled` tinyint NOT NULL DEFAULT 1 COMMENT '机器人开�?0=关闭 1=开�?,
  `system` int NULL DEFAULT 1 COMMENT '系统配置(id)',
  `channel` int NULL DEFAULT 1 COMMENT '渠道(id)',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '机器人设置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of cms_robot_setting
-- ----------------------------
INSERT INTO `cms_robot_setting` VALUES (2, '10,20,50', '1,2,3,4,5', 50, 10, 1, 1, 10006, '2026-06-04 15:58:48', '2026-04-30 18:56:54');
INSERT INTO `cms_robot_setting` VALUES (3, '10,20,50', '1,2,3,4,5', 50, 10, 1, 1, 10008, '2026-06-04 15:58:51', '2026-04-30 18:56:54');

-- ----------------------------
-- Table structure for cms_server_config
-- ----------------------------
DROP TABLE IF EXISTS `cms_server_config`;
CREATE TABLE `cms_server_config`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `channel` bigint NULL DEFAULT NULL COMMENT '渠道ID',
  `protocol` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT 'ws或者wss',
  `address` varchar(1024) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT '地址',
  `status` smallint UNSIGNED NOT NULL DEFAULT 1 COMMENT '0=维护�?=开�?,
  `secret` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT '' COMMENT '通信密钥',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '游戏服务器配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of cms_server_config
-- ----------------------------
INSERT INTO `cms_server_config` VALUES (6, 10006, 'wss', 'wsspolt.99ads.vip', 1, 'Aha5KisWztCLhtESUiXtnEiAY9oGzVs/x8LfGMchs2k=', '2026-06-10 09:02:05', '2026-05-06 14:10:56');
INSERT INTO `cms_server_config` VALUES (7, 10008, 'wss', 'wsspolt.99ads.vip', 1, 'Aha5KisWztCLhtESUiXtnEiAY9oGzVs/x8LfGMchs2k=', '2026-06-10 09:02:15', '2026-05-06 14:10:56');
INSERT INTO `cms_server_config` VALUES (8, 10009, 'wss', 'wss.flygame.xyz', 1, 'Aha5KisWztCLhtESUiXtnEiAY9oGzVs/x8LfGMchs2k=', '2026-06-12 12:12:53', '2026-06-12 12:12:23');

-- ----------------------------
-- Table structure for cms_system_config
-- ----------------------------
DROP TABLE IF EXISTS `cms_system_config`;
CREATE TABLE `cms_system_config`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `key` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '�?,
  `value` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '�?,
  `remark` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统配置�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of cms_system_config
-- ----------------------------
INSERT INTO `cms_system_config` VALUES (10, 'MD5Key', '9c882de70a7bbb0fba00338f3638acb4', '11');
INSERT INTO `cms_system_config` VALUES (11, 'apiUrl', 'https://poltapi.99ads.vip', '222');

-- ----------------------------
-- Table structure for lms_admin_operation_log
-- ----------------------------
DROP TABLE IF EXISTS `lms_admin_operation_log`;
CREATE TABLE `lms_admin_operation_log`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` bigint UNSIGNED NOT NULL COMMENT '管理员id',
  `ip` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '请求ip',
  `url` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '请求地址',
  `params` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '请求参数',
  `note` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1246 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '管理员操作记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for lms_coin_log
-- ----------------------------
DROP TABLE IF EXISTS `lms_coin_log`;
CREATE TABLE `lms_coin_log`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '平台订单ID',
  `channel_order_id` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '渠道玩家订单id',
  `user_id` bigint NOT NULL DEFAULT 0 COMMENT '用户ID',
  `coin` bigint NOT NULL DEFAULT 0 COMMENT '金币数量',
  `channel_id` int NOT NULL COMMENT '渠道ID',
  `type` tinyint(1) NOT NULL COMMENT '1转入 2转出',
  `currency` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '币种',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `ix_coinlog_channel_moid`(`channel_order_id` ASC, `channel_id` ASC) USING BTREE,
  INDEX `ix_coinlog_uid`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 331841 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '用户金币变动日志�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of lms_coin_log
-- ----------------------------

-- ----------------------------
-- Table structure for lms_coin_record
-- ----------------------------
DROP TABLE IF EXISTS `lms_coin_record`;
CREATE TABLE `lms_coin_record`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '唯一id',
  `user_id` bigint NOT NULL DEFAULT 0 COMMENT '用户ID',
  `round_id` bigint NOT NULL COMMENT '游戏编号',
  `bet` bigint NOT NULL COMMENT '下注金额',
  `pay_out` decimal(23, 2) NOT NULL DEFAULT 0.00 COMMENT '派彩',
  `bet_type` tinyint NOT NULL DEFAULT 0 COMMENT '投注类型;0:玩家手动;1:玩家自动',
  `settlement_multiple` int NOT NULL DEFAULT 0 COMMENT '玩家结算倍数',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `user_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '用户�?,
  `before_coin` bigint NOT NULL DEFAULT 0 COMMENT '下注后的余额',
  `after_coin` bigint NOT NULL DEFAULT 0 COMMENT '派彩后的余额',
  `bet_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下注时间',
  `finish_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '结束时间',
  `expand` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT '' COMMENT '扩展参数(非必�?',
  `tag` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT NULL COMMENT '货币标识',
  `amount` bigint NOT NULL DEFAULT 0 COMMENT '投注金额（扩展）',
  `game_tag` int NULL DEFAULT 1 COMMENT '游戏标识，默�?.小飞�?2.扫雷',
  `betCount_str` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT '' COMMENT '投注编号字符�?,
  `win_car_num` int NULL DEFAULT NULL COMMENT '押注押中的车辆编�?,
  `channel_id` bigint NOT NULL DEFAULT 0 COMMENT '渠道ID',
  `game_code` varchar(32) NULL DEFAULT NULL COMMENT 'game code; NULL=legacy',
  `expand_time` bigint NOT NULL DEFAULT 0 COMMENT '扩展时间',
  `betNo_str` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT NULL COMMENT '投注编号字符�?,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `cr_rid`(`round_id` ASC) USING BTREE COMMENT '局�?,
  INDEX `cr_uid`(`user_id` ASC) USING BTREE COMMENT '用户id',
  INDEX `cr_ex_time`(`expand_time` ASC) USING BTREE,
  INDEX `cr_tag`(`tag` ASC) USING BTREE,
  INDEX `cr_crtime`(`created_at` ASC) USING BTREE,
  INDEX `idx_round_user`(`round_id` ASC, `user_id` ASC) USING BTREE
  ,INDEX `idx_coin_game_code`(`game_code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4058735 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '投注记录�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for lms_game_record
-- ----------------------------
DROP TABLE IF EXISTS `lms_game_record`;
CREATE TABLE `lms_game_record`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '唯一id',
  `round_id` bigint NOT NULL DEFAULT 0 COMMENT '游戏编号（由年月日时分秒组成得数字）',
  `settlement` bigint NOT NULL DEFAULT 0 COMMENT '正为赢，负为�?,
  `result` bigint NOT NULL DEFAULT 0 COMMENT '结果',
  `billing_type` tinyint NOT NULL DEFAULT 0 COMMENT '游戏结算类型;0:系统自动;1系统手动',
  `operator` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '操作�?,
  `tag` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '货币标识',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `game_tag` int NULL DEFAULT 1 COMMENT '游戏标识，默�?.小飞�?2.扫雷',
  `channel_id` bigint NOT NULL DEFAULT 0 COMMENT '渠道ID',
  `game_code` varchar(32) NULL DEFAULT NULL COMMENT 'game code; NULL=legacy',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `gr_rid`(`round_id` ASC) USING BTREE COMMENT '局�?,
  INDEX `gr_created_at`(`created_at` ASC) USING BTREE COMMENT ' 创建时间'
  ,INDEX `idx_game_record_game_code`(`game_code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 322685 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '游戏结算记录�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for mms_channel
-- ----------------------------
DROP TABLE IF EXISTS `mms_channel`;
CREATE TABLE `mms_channel`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '渠道Id',
  `merchant_id` bigint NOT NULL DEFAULT 0 COMMENT '商户id',
  `name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '渠道名称',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `player_prefix` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '玩家用户名前缀,全局唯一',
  `amount` bigint NULL DEFAULT 0 COMMENT '金额',
  `notify_url` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '回调地址(通知商户)',
  `offline_url` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '回调地址（离线通知�?,
  `tag` int NOT NULL DEFAULT 0 COMMENT '游戏表示�?小飞�?扫雷3赛车以此类推',
  `domain` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '游戏地址',
  `game_code` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '游戏代码',
  `user_win_money` int NULL DEFAULT 0 COMMENT '用户赢钱百分�?,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `c_id`(`id` ASC) USING BTREE,
  INDEX `c.merchantId`(`merchant_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10010 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '渠道�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of mms_channel
-- ----------------------------
INSERT INTO `mms_channel` VALUES (10006, 1, '9gamed', '2026-05-06 12:15:56', '2026-06-04 09:18:03', '9game', 100000000, 'https://api.pubmaticbr.app/dg', 'https://example.com/offline', 1, 'https://polt.99ads.vip', 'aviator', 10000);
INSERT INTO `mms_channel` VALUES (10008, 2, 'gamex5', '2026-05-28 20:11:35', '2026-06-04 09:18:06', 'gamex5', 100000000, 'https://api.pubmaticbr.app/dg', 'https://example.com/offline', 1, 'https://polt.99ads.vip', 'aviator', 10000);
INSERT INTO `mms_channel` VALUES (10009, 3, 'gaja777', '2026-06-12 11:57:31', '2026-06-12 13:44:22', 'gaja777', 1000, 'https://api.5gamex.com/dg', 'https://example.com/offline', 1, 'https://rocket.flygame.xyz', 'rocket', 10000);

-- ----------------------------
-- Table structure for mms_merchant
-- ----------------------------
DROP TABLE IF EXISTS `mms_merchant`;
CREATE TABLE `mms_merchant`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '商户Id',
  `username` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '用户�?,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `secret` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '密钥',
  `skip_url` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '商户跳转地址',
  `wallet_type` int NOT NULL DEFAULT 1 COMMENT '1，共享钱包�?，转账钱�?,
  `return_url` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '0' COMMENT '商户跳转地址',
  `win_proportion` int NOT NULL DEFAULT 0 COMMENT '赢钱比例',
  `win_limit` bigint NOT NULL DEFAULT 0 COMMENT '赢钱上限',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '商户�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of mms_merchant
-- ----------------------------
INSERT INTO `mms_merchant` VALUES (1, 'test001', '2026-05-06 12:06:13', '2026-05-07 11:11:06', '9c882de70a7bbb0fba00338f3638acb4', 'https://example.com/skip', 2, 'https://example.com/return', 95, 1000000);
INSERT INTO `mms_merchant` VALUES (2, 'gamex5', '2026-05-28 20:17:00', '2026-05-28 20:17:24', '9c882de70a7bbb0fba00338f3638acb4', 'https://example.com/skip', 1, 'https://example.com/return', 95, 1000000);
INSERT INTO `mms_merchant` VALUES (3, 'gaja777', '2026-06-12 11:31:32', '2026-06-12 11:33:18', '9c882de70a7bbb0fba00338f3638acb4', 'https://example.com/skip', 1, 'https://example.com/return', 95, 1000000);

-- ----------------------------
-- Table structure for ums_coin
-- ----------------------------
DROP TABLE IF EXISTS `ums_coin`;
CREATE TABLE `ums_coin`  (
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `coin` bigint NOT NULL DEFAULT 0 COMMENT '金币数量',
  `is_lock` smallint NOT NULL DEFAULT 0 COMMENT '是否锁定;0:未锁�?1:已锁�?,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`user_id`) USING BTREE,
  INDEX `c_userId`(`user_id` ASC) USING BTREE COMMENT '用户id'
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '用户金币�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for ums_task
-- ----------------------------
DROP TABLE IF EXISTS `ums_task`;
CREATE TABLE `ums_task`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '任务标题',
  `state` int NULL DEFAULT 0 COMMENT '状�?关闭1开�?,
  `system` int NULL DEFAULT 0 COMMENT '系统配置',
  `channel` int NULL DEFAULT 0 COMMENT '渠道配置',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '任务内容',
  `requirement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '任务要求',
  `num` int NULL DEFAULT NULL COMMENT '任务数量',
  `money` double NULL DEFAULT NULL COMMENT '任务奖励',
  `material` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '任务物料',
  `remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '任务备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `id`(`id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '任务�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ums_task
-- ----------------------------

-- ----------------------------
-- Table structure for ums_task_capital
-- ----------------------------
DROP TABLE IF EXISTS `ums_task_capital`;
CREATE TABLE `ums_task_capital`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '0' COMMENT '用户�?,
  `ref_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '0' COMMENT '结算编号',
  `money` double NOT NULL DEFAULT 0 COMMENT '结算金额',
  `tag` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '结算币种',
  `before_coin` bigint NULL DEFAULT NULL COMMENT '完成前余�?,
  `after_coin` bigint NULL DEFAULT NULL COMMENT '完成后余�?,
  `explain` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '任务说明',
  `type` int NULL DEFAULT 1 COMMENT '类型1增加0减少',
  `created_at` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '任务资金明细�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for ums_user_free_bet
-- ----------------------------
DROP TABLE IF EXISTS `ums_user_free_bet`;
CREATE TABLE `ums_user_free_bet` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `channel_id` bigint NOT NULL,
  `remain_count` int NOT NULL DEFAULT 0 COMMENT '剩余免费次数',
  `total_granted` int NOT NULL DEFAULT 0 COMMENT '累计发放次数',
  `total_used` int NOT NULL DEFAULT 0 COMMENT '累计使用次数',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_user_channel` (`user_id`, `channel_id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户免费次数�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for ums_free_bet_log
-- ----------------------------
DROP TABLE IF EXISTS `ums_free_bet_log`;
CREATE TABLE `ums_free_bet_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `channel_id` bigint NOT NULL,
  `action` tinyint NOT NULL COMMENT '1发放 2使用 3过期 4扣减(运营)',
  `count` int NOT NULL DEFAULT 0 COMMENT '本次变动次数(发放为正,使用为负)',
  `bet_amount` bigint NOT NULL DEFAULT 0 COMMENT '单次免费下注金额(�?,发放时快�?,
  `payout` bigint NOT NULL DEFAULT 0 COMMENT '派彩金额(�?,仅使用时填写',
  `round_id` varchar(64) NULL COMMENT '关联 lms_coin_record.round_id,仅使用时填写',
  `activity_id` varchar(64) NULL COMMENT '上游活动ID',
  `source_order_id` varchar(128) NULL COMMENT '上游发放幂等单号',
  `expire_at` datetime NULL COMMENT '过期时间(发放时设�?为空表示永不过期)',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '0正常 1已过�?,
  `remark` varchar(255) NULL COMMENT '备注',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_source_order` (`source_order_id`),
  UNIQUE KEY `uk_round` (`round_id`),
  KEY `idx_expire_at` (`expire_at`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '免费下注流水�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ums_task_capital
-- ----------------------------

-- ----------------------------
-- Table structure for ums_task_user
-- ----------------------------
DROP TABLE IF EXISTS `ums_task_user`;
CREATE TABLE `ums_task_user`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL DEFAULT 0 COMMENT '任务ID',
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '0' COMMENT '用户�?,
  `channel` int NOT NULL DEFAULT 0 COMMENT '渠道ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '提交审核的内�?,
  `img` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '提交审核的图�?,
  `money` double NOT NULL DEFAULT 0 COMMENT '任务奖励金额',
  `state` int NULL DEFAULT 1 COMMENT '当前状�?待完�?待审�?已完�?未通过',
  `ref_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '结算编号',
  `remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '拒绝原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `task_id`(`task_id` ASC) USING BTREE,
  INDEX `user_id`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 37 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '任务接单�? ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ums_task_user
-- ----------------------------

-- ----------------------------
-- Table structure for ums_user
-- ----------------------------
DROP TABLE IF EXISTS `ums_user`;
CREATE TABLE `ums_user`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `channel_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '渠道ID',
  `username` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '用户�?,
  `status` int NOT NULL DEFAULT 0 COMMENT '帐号启用状�?0->启用�?->禁用',
  `online` int NOT NULL DEFAULT 0 COMMENT '是否在线 0:离线 1:在线',
  `expand` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT '' COMMENT '扩展参数（非必填�?,
  `currency` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '' COMMENT '币种',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `merchant_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL DEFAULT '0' COMMENT '商户id',
  `win_money` bigint NOT NULL DEFAULT 0 COMMENT '用户每天赢钱上限',
  `win_money_day` timestamp NULL DEFAULT NULL COMMENT '用户赢钱上限每天时间记录',
  `balance` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '余额',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `chid`(`channel_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 108355 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_bin COMMENT = '用户�? ROW_FORMAT = DYNAMIC;



-- ============================================================
-- Consolidated migrations merged on 2026-09-01.
-- Fresh databases only need this init.sql file.
-- ============================================================

-- Complete indexes from the free-bet migration.
ALTER TABLE `ums_free_bet_log`
  ADD INDEX `idx_user_channel` (`user_id`, `channel_id`),
  ADD INDEX `idx_created_at` (`created_at`);

-- ----------------------------
-- Integrated from 20260622_soft_delete.sql
-- ----------------------------
-- ============================================================
-- 软删除迁移：为 29 张业务表添加 deleted_at 列（幂等）。
-- 用途：将物理删除改为逻辑删除，DELETE 改为 UPDATE deleted_at = NOW()
-- MyBatis-Plus @TableLogic 自动处理查询/删除逻辑
-- 执行前建议备份！
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS add_deleted_at_if_missing$$

CREATE PROCEDURE add_deleted_at_if_missing(
    IN tbl VARCHAR(64),
    IN after_col VARCHAR(64)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = tbl
          AND COLUMN_NAME = 'deleted_at'
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `deleted_at` datetime NULL DEFAULT NULL COMMENT ''删除时间（NULL=未删除）'' AFTER `', after_col, '`');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- ===== 管理员系统 (ams_*) =====
CALL add_deleted_at_if_missing('ams_admin',             'updated_at');
CALL add_deleted_at_if_missing('ams_role',              'updated_at');
CALL add_deleted_at_if_missing('ams_permission',        'updated_at');
CALL add_deleted_at_if_missing('ams_ip_list',           'updated_at');
CALL add_deleted_at_if_missing('ams_merchant_report',   'updated_at');
CALL add_deleted_at_if_missing('ams_daily_report',      'updated_at');
CALL add_deleted_at_if_missing('ams_channel_report',    'updated_at');

-- ===== 配置管理 (cms_*) =====
CALL add_deleted_at_if_missing('cms_system_config',        'remark');
CALL add_deleted_at_if_missing('cms_currency_setting',     'created_at');
CALL add_deleted_at_if_missing('cms_game_setting',         'updated_at');
CALL add_deleted_at_if_missing('cms_game_control',         'updated_at');
CALL add_deleted_at_if_missing('cms_robot_setting',        'updated_at');
CALL add_deleted_at_if_missing('cms_server_config',        'updated_at');

-- ===== 商户/渠道 (mms_*) =====
CALL add_deleted_at_if_missing('mms_channel',  'user_win_money');
CALL add_deleted_at_if_missing('mms_merchant', 'win_limit');

-- ===== 用户系统 (ums_*) =====
CALL add_deleted_at_if_missing('ums_user',          'updated_at');
CALL add_deleted_at_if_missing('ums_coin',          'updated_at');
CALL add_deleted_at_if_missing('ums_task',          'updated_at');
CALL add_deleted_at_if_missing('ums_task_user',     'updated_at');
CALL add_deleted_at_if_missing('ums_task_capital',  'updated_at');
CALL add_deleted_at_if_missing('ums_free_bet_log',  'updated_at');
CALL add_deleted_at_if_missing('ums_user_free_bet', 'updated_at');

-- ===== 日志系统 (lms_*) =====
CALL add_deleted_at_if_missing('lms_admin_operation_log', 'created_at');
CALL add_deleted_at_if_missing('lms_coin_log',            'created_at');
CALL add_deleted_at_if_missing('lms_coin_record',         'finish_time');
CALL add_deleted_at_if_missing('lms_game_record',         'channel_id');

DROP PROCEDURE IF EXISTS add_deleted_at_if_missing;

-- ----------------------------
-- Integrated from 20260626_notification.sql
-- ----------------------------
-- ============================================================
-- 站内通知迁移：创建 ums_notification 表（幂等）
-- 用途：管理后台站内通知（铃铛组件数据源）
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS create_notification_table$$

CREATE PROCEDURE create_notification_table()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'ums_notification'
    ) THEN
        CREATE TABLE `ums_notification` (
            `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
            `admin_id` bigint NOT NULL COMMENT '管理员ID',
            `title` varchar(255) NOT NULL DEFAULT '' COMMENT '通知标题',
            `message` varchar(500) NOT NULL DEFAULT '' COMMENT '通知内容',
            `avatar` varchar(500) DEFAULT '' COMMENT '头像URL',
            `link` varchar(500) DEFAULT '' COMMENT '跳转链接',
            `is_read` tinyint NOT NULL DEFAULT 0 COMMENT '是否已读 0:未读 1:已读',
            `created_at` datetime DEFAULT NULL COMMENT '创建时间',
            `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
            `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
            PRIMARY KEY (`id`) USING BTREE,
            INDEX `idx_admin_read`(`admin_id`, `is_read`) USING BTREE,
            INDEX `idx_admin_created`(`admin_id`, `created_at`) USING BTREE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内通知表';
    END IF;
END$$

CALL create_notification_table()$$

DROP PROCEDURE IF EXISTS create_notification_table$$

DELIMITER ;

-- ----------------------------
-- Integrated from 20260627_channel_game_config.sql
-- ----------------------------
-- 渠道游戏映射表、Dice 恢复数据及后台权限迁移。

CREATE TABLE IF NOT EXISTS `channel_game_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `channel_id` bigint NOT NULL COMMENT '渠道ID',
  `game_code` varchar(32) NOT NULL COMMENT '游戏代码',
  `domain` varchar(255) NOT NULL DEFAULT '' COMMENT '游戏入口域名',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '0=禁用,1=启用',
  `server_config_id` bigint NULL DEFAULT NULL COMMENT '服务器配置ID',
  `game_setting_id` bigint NULL DEFAULT NULL COMMENT '游戏设置ID',
  `game_control_id` bigint NULL DEFAULT NULL COMMENT '游戏控制ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_channel_game` (`channel_id`, `game_code`),
  KEY `idx_game_code` (`game_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='渠道游戏映射配置';

ALTER TABLE `channel_game_config` COMMENT = '渠道游戏映射配置';

-- Phase 1: create a temporary Dice channel from 9gamed without changing Aviator.
INSERT INTO `mms_channel` (
  `merchant_id`, `name`, `player_prefix`, `amount`, `notify_url`, `offline_url`,
  `tag`, `domain`, `game_code`, `user_win_money`
)
SELECT
  c.`merchant_id`, '9gamed_dice', '9gamedice', 0, c.`notify_url`, c.`offline_url`,
  5, c.`domain`, 'dice', c.`user_win_money`
FROM `mms_channel` c
WHERE c.`name` = '9gamed'
  AND NOT EXISTS (SELECT 1 FROM `mms_channel` x WHERE x.`name` = '9gamed_dice');

INSERT INTO `cms_server_config` (`channel`, `protocol`, `address`, `status`, `secret`)
SELECT d.`id`, sc.`protocol`, sc.`address`, sc.`status`, sc.`secret`
FROM `mms_channel` d
JOIN `mms_channel` src ON src.`name` = '9gamed'
JOIN `cms_server_config` sc ON sc.`channel` = src.`id` AND sc.`status` = 1
WHERE d.`name` = '9gamed_dice'
  AND NOT EXISTS (SELECT 1 FROM `cms_server_config` x WHERE x.`channel` = d.`id`)
LIMIT 1;

INSERT INTO `cms_game_setting` (
  `initial_bet`, `btn_bet`, `amplitude`, `bet_min`, `bet_max`,
  `settlement_min`, `settlement_max`, `game_max`, `game_status`,
  `free_bet_enabled`, `free_bet_amount`, `channel`, `rule_content`, `system`
)
SELECT
  100, '1,10,20,50', 5, 1, 10000,
  1, 50, 50, 0,
  0, 100, d.`id`,
  '<h1>Dice Rules</h1><p>Choose Roll Under or Roll Over, set a target from 2 to 98, and place a bet. Winning payouts are calculated from the displayed multiplier.</p>',
  1
FROM `mms_channel` d
WHERE d.`name` = '9gamed_dice'
  AND NOT EXISTS (SELECT 1 FROM `cms_game_setting` x WHERE x.`channel` = d.`id`);

INSERT INTO `cms_game_control` (`system`, `channel`, `reserve`, `progress`, `rebate`, `game_status`, `game_max`)
SELECT 1, d.`id`, 100000, 0, 9, 0, 5000
FROM `mms_channel` d
WHERE d.`name` = '9gamed_dice'
  AND NOT EXISTS (SELECT 1 FROM `cms_game_control` x WHERE x.`channel` = d.`id`);

-- Backfill compatibility mapping for existing channel-level game_code/tag configs.
INSERT INTO `channel_game_config` (
  `channel_id`, `game_code`, `domain`, `status`,
  `server_config_id`, `game_setting_id`, `game_control_id`
)
SELECT
  c.`id`,
  LOWER(c.`game_code`),
  c.`domain`,
  1,
  sc.`id`,
  gs.`id`,
  gc.`id`
FROM `mms_channel` c
LEFT JOIN `cms_server_config` sc ON sc.`channel` = c.`id` AND sc.`status` = 1
LEFT JOIN `cms_game_setting` gs ON gs.`channel` = c.`id`
LEFT JOIN `cms_game_control` gc ON gc.`channel` = c.`id`
WHERE c.`game_code` <> ''
  AND NOT EXISTS (
    SELECT 1 FROM `channel_game_config` x
    WHERE x.`channel_id` = c.`id` AND x.`game_code` = LOWER(c.`game_code`)
  );

-- Admin menu and API permissions for channel game mapping.
INSERT INTO `ams_permission` (
  `pid`, `name`, `file_name`, `title`, `icon`, `path`, `component`,
  `sort`, `hidden`, `no_keep_alive`, `guard_name`
)
SELECT
  1, 'channelGameConfig.list', 'channelGameConfig', 'Channel Game Config',
  'el-icon-document', '/channel_game_config', 'channel_game_config/index',
  2, 0, 0, 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM `ams_permission` x WHERE x.`name` = 'channelGameConfig.list'
);

INSERT INTO `ams_permission` (
  `pid`, `name`, `file_name`, `title`, `icon`, `path`, `component`,
  `sort`, `hidden`, `no_keep_alive`, `guard_name`
)
SELECT
  p.`id`, 'channelGameConfig.create', '', 'Create Channel Game Config',
  '', 'channelGameConfig/create', 'channelGameConfig/create',
  1, 1, 0, 'admin'
FROM `ams_permission` p
WHERE p.`name` = 'channelGameConfig.list'
  AND NOT EXISTS (
    SELECT 1 FROM `ams_permission` x WHERE x.`name` = 'channelGameConfig.create'
  );

INSERT INTO `ams_permission` (
  `pid`, `name`, `file_name`, `title`, `icon`, `path`, `component`,
  `sort`, `hidden`, `no_keep_alive`, `guard_name`
)
SELECT
  p.`id`, 'channelGameConfig.update', '', 'Update Channel Game Config',
  '', 'channelGameConfig/update', 'channelGameConfig/update',
  2, 1, 0, 'admin'
FROM `ams_permission` p
WHERE p.`name` = 'channelGameConfig.list'
  AND NOT EXISTS (
    SELECT 1 FROM `ams_permission` x WHERE x.`name` = 'channelGameConfig.update'
  );

INSERT INTO `ams_permission` (
  `pid`, `name`, `file_name`, `title`, `icon`, `path`, `component`,
  `sort`, `hidden`, `no_keep_alive`, `guard_name`
)
SELECT
  p.`id`, 'channelGameConfig.delete', '', 'Delete Channel Game Config',
  '', 'channelGameConfig/delete', 'channelGameConfig/delete',
  3, 1, 0, 'admin'
FROM `ams_permission` p
WHERE p.`name` = 'channelGameConfig.list'
  AND NOT EXISTS (
    SELECT 1 FROM `ams_permission` x WHERE x.`name` = 'channelGameConfig.delete'
  );

-- ----------------------------
-- Integrated from 20260701_game_record_rebate.sql
-- ----------------------------
-- 游戏结算记录表新增杀率(rebate)字段
-- 杀率范围 1~99，1 表示不杀（庄家优势最小），99 表示最大杀率
-- 默认值 0 表示历史数据无此字段
-- 历史数据继续保留 0，不在迁移中推断或回填杀率。
ALTER TABLE `lms_game_record`
    ADD COLUMN `rebate` int NOT NULL DEFAULT 0 COMMENT '杀率(1~99)，0=历史数据' AFTER `result`;

-- ----------------------------
-- Integrated from 20260815_channel_game_config_risk_fields.sql
-- ----------------------------
DROP PROCEDURE IF EXISTS add_channel_game_config_column;
DELIMITER $$
CREATE PROCEDURE add_channel_game_config_column(
    IN column_name_value VARCHAR(64),
    IN column_definition_value TEXT,
    IN after_column_value VARCHAR(64)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'channel_game_config'
          AND column_name = column_name_value
    ) THEN
        SET @sql_text = CONCAT(
            'ALTER TABLE `channel_game_config` ADD COLUMN `', column_name_value,
            '` ', column_definition_value,
            ' AFTER `', after_column_value, '`'
        );
        PREPARE statement_to_run FROM @sql_text;
        EXECUTE statement_to_run;
        DEALLOCATE PREPARE statement_to_run;
    END IF;
END$$
DELIMITER ;

CALL add_channel_game_config_column(
    'rebate',
    'int NULL DEFAULT NULL COMMENT ''独立杀率（1-99）''',
    'game_control_id'
);
CALL add_channel_game_config_column(
    'reserve',
    'bigint NULL DEFAULT NULL COMMENT ''日盈利目标''',
    'rebate'
);
CALL add_channel_game_config_column(
    'progress',
    'bigint NULL DEFAULT NULL COMMENT ''当日累计盈利''',
    'reserve'
);
-- 渠道游戏映射增加独立杀率、盈利目标和累计盈利字段。

DROP PROCEDURE IF EXISTS add_channel_game_config_column;

-- ----------------------------
-- Integrated from 20260815_drop_game_control_setting.sql
-- ----------------------------
DELETE FROM `ams_permission` WHERE `name` = 'gameControlSet.list';
DROP TABLE IF EXISTS `cms_game_control_setting`;

-- ----------------------------
-- Integrated from 20260815_drop_pool_setting.sql
-- ----------------------------
DROP TABLE IF EXISTS `cms_pool_setting`;

-- ----------------------------
-- Integrated from 20260815_game_rule.sql
-- ----------------------------
CREATE TABLE IF NOT EXISTS `cms_game_rule` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `game_code` varchar(64) NOT NULL,
  `rule_content` text NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cms_game_rule_game_code` (`game_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='按游戏代码共享的玩家端规则';

INSERT INTO `cms_game_rule` (`game_code`, `rule_content`)
VALUES
  (
    'aviator',
    COALESCE((
      SELECT setting.`rule_content`
      FROM `channel_game_config` mapping
      JOIN `cms_game_setting` setting ON setting.`id` = mapping.`game_setting_id`
      WHERE mapping.`game_code` = 'aviator'
        AND setting.`rule_content` IS NOT NULL
        AND setting.`rule_content` <> ''
      ORDER BY mapping.`id`
      LIMIT 1
    ), '')
  ),
  (
    'dice',
    COALESCE((
      SELECT setting.`rule_content`
      FROM `channel_game_config` mapping
      JOIN `cms_game_setting` setting ON setting.`id` = mapping.`game_setting_id`
      WHERE mapping.`game_code` = 'dice'
        AND setting.`rule_content` IS NOT NULL
        AND setting.`rule_content` <> ''
      ORDER BY mapping.`id`
      LIMIT 1
    ), '')
  ),
  ('rocket', ''),
  ('aviator2', ''),
  ('pilot-chicken', ''),
  ('rathudaan', '')
ON DUPLICATE KEY UPDATE `game_code` = VALUES(`game_code`);

-- ----------------------------
-- Integrated from 20260815_remove_pool_setting.sql
-- ----------------------------
DELETE FROM `ams_permission`
WHERE `name` IN ('poolSetting.create', 'poolSetting.update');

DELETE FROM `ams_permission`
WHERE `name` = 'poolSetting.list';

-- ----------------------------
-- Integrated from 20260819_game_risk_control.sql
-- ----------------------------
CREATE TABLE IF NOT EXISTS `game_risk_control` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `game_code` varchar(64) NOT NULL COMMENT '游戏代码（全局唯一）',
  `rebate` int NULL COMMENT '全局杀率（百分比整数，1-99）',
  `reserve` bigint NULL COMMENT '每日盈利目标（分）',
  `progress` bigint NOT NULL DEFAULT 0 COMMENT '今日盈利（分，由游戏服务维护，后台不可修改）',
  `progress_date` date NULL DEFAULT NULL COMMENT '今日盈利归属日期（系统时区）',
  `initial_bet` bigint NULL COMMENT '默认下注金额（分）',
  `amplitude` bigint NULL COMMENT '下注金额递增减幅度（分）',
  `btn_bet` varchar(255) NULL COMMENT '快捷下注金额列表（元，逗号分隔）',
  `bet_min` bigint NULL COMMENT '最小下注金额（分）',
  `bet_max` bigint NULL COMMENT '最大下注金额（分）',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '全局游戏开关：0-关闭，1-开启',
  `deleted_at` datetime NULL DEFAULT NULL COMMENT '删除时间（NULL=未删除）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_game_risk_control_game_code` (`game_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='按游戏代码全局共享的游戏开关与风控配置';

INSERT INTO `game_risk_control` (`game_code`, `rebate`, `reserve`, `progress`, `status`)
SELECT
  source.`game_code`,
  CASE
    WHEN COUNT(source.`rebate`) = COUNT(*)
      AND COUNT(DISTINCT source.`rebate`) = 1 THEN MIN(source.`rebate`)
    ELSE NULL
  END AS `rebate`,
  CASE
    WHEN COUNT(source.`reserve`) = COUNT(*)
      AND COUNT(DISTINCT source.`reserve`) = 1 THEN MIN(source.`reserve`)
    ELSE NULL
  END AS `reserve`,
  0 AS `progress`,
  CASE
    WHEN COUNT(*) > 0 AND MIN(CASE WHEN source.`status` = 1 THEN 1 ELSE 0 END) = 1 THEN 1
    ELSE 0
  END AS `status`
FROM `channel_game_config` source
WHERE source.`game_code` IS NOT NULL
  AND TRIM(source.`game_code`) <> ''
GROUP BY source.`game_code`
ON DUPLICATE KEY UPDATE `game_code` = VALUES(`game_code`);

-- ----------------------------
-- Integrated from 20260820_game_code_live_routing.sql
-- ----------------------------
-- Replace live game tags with game codes and configure Pinus server routing.

DROP PROCEDURE IF EXISTS drop_live_game_tag_column;
DELIMITER $$
CREATE PROCEDURE drop_live_game_tag_column(IN table_name_value VARCHAR(64), IN index_name_value VARCHAR(64))
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = table_name_value AND index_name = index_name_value
  ) THEN
    SET @drop_index_statement = CONCAT('ALTER TABLE `', table_name_value, '` DROP INDEX `', index_name_value, '`');
    PREPARE drop_index_statement FROM @drop_index_statement;
    EXECUTE drop_index_statement;
    DEALLOCATE PREPARE drop_index_statement;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = table_name_value AND column_name = 'game_tag'
  ) THEN
    SET @drop_column_statement = CONCAT('ALTER TABLE `', table_name_value, '` DROP COLUMN `game_tag`');
    PREPARE drop_column_statement FROM @drop_column_statement;
    EXECUTE drop_column_statement;
    DEALLOCATE PREPARE drop_column_statement;
  END IF;
END$$
DELIMITER ;

CALL drop_live_game_tag_column('channel_game_config', 'idx_game_tag');
CALL drop_live_game_tag_column('game_risk_control', 'idx_game_tag');
DROP PROCEDURE IF EXISTS drop_live_game_tag_column;

CREATE TABLE IF NOT EXISTS `game_server_route` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `game_code` varchar(64) NOT NULL,
  `server_type` varchar(64) NOT NULL,
  `operation_type` varchar(64) NOT NULL,
  `priority` int NOT NULL DEFAULT 100,
  `status` tinyint NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_game_server_route` (`game_code`, `server_type`, `operation_type`),
  KEY `idx_game_server_route_lookup` (`game_code`, `operation_type`, `status`, `priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Pinus 游戏编码到服务类型的路由配置表';

INSERT INTO `game_server_route` (`game_code`, `server_type`, `operation_type`, `priority`, `status`)
VALUES
  ('aviator', 'aviator', 'LOGIN', 100, 1),
  ('aviator', 'aviator', 'DISCONNECT', 100, 1),
  ('aviator', 'aviator', 'GAME_CONFIG_RELOAD', 100, 1),
  ('aviator', 'aviator', 'CONTROL_RELOAD', 100, 1),
  ('aviator', 'aviator', 'RISK_RELOAD', 100, 1),
  ('pilot-chicken', 'pilotChicken', 'LOGIN', 100, 1),
  ('pilot-chicken', 'pilotChicken', 'DISCONNECT', 100, 1),
  ('pilot-chicken', 'pilotChicken', 'GAME_CONFIG_RELOAD', 100, 1),
  ('pilot-chicken', 'pilotChicken', 'CONTROL_RELOAD', 100, 1),
  ('pilot-chicken', 'pilotChicken', 'RISK_RELOAD', 100, 1)
ON DUPLICATE KEY UPDATE
  `priority` = VALUES(`priority`),
  `status` = VALUES(`status`),
  `updated_at` = CURRENT_TIMESTAMP;

-- ----------------------------
-- Integrated from 20260824_robot_game_code.sql
-- ----------------------------
DROP PROCEDURE IF EXISTS add_robot_game_code;
DELIMITER $$
CREATE PROCEDURE add_robot_game_code()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'cms_robot_setting' AND column_name = 'game_code'
    ) THEN
        ALTER TABLE `cms_robot_setting` ADD COLUMN `game_code` varchar(32) NOT NULL DEFAULT 'aviator' AFTER `system`;
    END IF;
END$$
DELIMITER ;
CALL add_robot_game_code();
DROP PROCEDURE IF EXISTS add_robot_game_code;

UPDATE `cms_robot_setting` SET `game_code` = 'aviator' WHERE `game_code` IS NULL OR `game_code` = '';

DROP PROCEDURE IF EXISTS add_robot_game_code_index;
DELIMITER $$
CREATE PROCEDURE add_robot_game_code_index()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'cms_robot_setting' AND index_name = 'idx_robot_channel_game_code'
    ) THEN
        CREATE INDEX `idx_robot_channel_game_code` ON `cms_robot_setting` (`channel`, `game_code`);
    END IF;
END$$
DELIMITER ;
CALL add_robot_game_code_index();
DROP PROCEDURE IF EXISTS add_robot_game_code_index;

-- ----------------------------
-- Integrated from 20260827_chicken_road2_game_code.sql
-- ----------------------------
-- Register Chicken Road 2 as a separate game code while reusing the existing Pilot Chicken service configuration.
-- Risk-control values are intentionally not seeded here so the admin-configured target kill rate is preserved.

DROP PROCEDURE IF EXISTS seed_chicken_road2_channel_game_config;
DELIMITER $$
CREATE PROCEDURE seed_chicken_road2_channel_game_config()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'channel_game_config'
      AND column_name = 'game_tag'
  ) THEN
    INSERT INTO `channel_game_config` (
      `channel_id`, `game_tag`, `game_code`, `domain`, `status`,
      `server_config_id`, `game_setting_id`, `game_control_id`,
      `rebate`, `reserve`, `progress`, `created_at`, `updated_at`, `deleted_at`
    )
    SELECT
      source.`channel_id`, source.`game_tag`, 'chicken-road2', source.`domain`, source.`status`,
      source.`server_config_id`, source.`game_setting_id`, source.`game_control_id`,
      source.`rebate`, source.`reserve`, source.`progress`, NOW(), NOW(), NULL
    FROM `channel_game_config` source
    WHERE source.`game_code` = 'pilot-chicken'
      AND source.`deleted_at` IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM `channel_game_config` target
        WHERE target.`channel_id` = source.`channel_id`
          AND target.`game_code` = 'chicken-road2'
          AND target.`deleted_at` IS NULL
      );
  ELSE
    INSERT INTO `channel_game_config` (
      `channel_id`, `game_code`, `domain`, `status`,
      `server_config_id`, `game_setting_id`, `game_control_id`,
      `rebate`, `reserve`, `progress`, `created_at`, `updated_at`, `deleted_at`
    )
    SELECT
      source.`channel_id`, 'chicken-road2', source.`domain`, source.`status`,
      source.`server_config_id`, source.`game_setting_id`, source.`game_control_id`,
      source.`rebate`, source.`reserve`, source.`progress`, NOW(), NOW(), NULL
    FROM `channel_game_config` source
    WHERE source.`game_code` = 'pilot-chicken'
      AND source.`deleted_at` IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM `channel_game_config` target
        WHERE target.`channel_id` = source.`channel_id`
          AND target.`game_code` = 'chicken-road2'
          AND target.`deleted_at` IS NULL
      );
  END IF;
END$$
DELIMITER ;

CALL seed_chicken_road2_channel_game_config();
DROP PROCEDURE IF EXISTS seed_chicken_road2_channel_game_config;

INSERT INTO `cms_game_rule` (`game_code`, `rule_content`, `created_at`, `updated_at`)
SELECT 'chicken-road2', source.`rule_content`, NOW(), NOW()
FROM `cms_game_rule` source
WHERE source.`game_code` = 'pilot-chicken'
  AND NOT EXISTS (
    SELECT 1 FROM `cms_game_rule` target WHERE target.`game_code` = 'chicken-road2'
  );

INSERT INTO `game_server_route` (`game_code`, `server_type`, `operation_type`, `priority`, `status`, `created_at`, `updated_at`)
SELECT 'chicken-road2', source.`server_type`, source.`operation_type`, source.`priority`, source.`status`, NOW(), NOW()
FROM `game_server_route` source
WHERE source.`game_code` = 'pilot-chicken'
ON DUPLICATE KEY UPDATE
  `server_type` = VALUES(`server_type`),
  `priority` = VALUES(`priority`),
  `status` = VALUES(`status`),
  `updated_at` = VALUES(`updated_at`);

-- ----------------------------
-- Integrated from 20260827_game_risk_control_bet_config.sql
-- ----------------------------
-- `20260819_game_risk_control.sql` 的建表定义已包含这四列；本脚本仅补齐历史库缺失字段。
DROP PROCEDURE IF EXISTS add_game_risk_control_bet_column;
DELIMITER $$
CREATE PROCEDURE add_game_risk_control_bet_column(
  IN column_name_value VARCHAR(64),
  IN column_definition_value TEXT,
  IN after_column_value VARCHAR(64)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'game_risk_control'
      AND column_name = column_name_value
  ) THEN
    SET @sql_text = CONCAT(
      'ALTER TABLE `game_risk_control` ADD COLUMN `', column_name_value,
      '` ', column_definition_value, ' AFTER `', after_column_value, '`'
    );
    PREPARE statement_to_run FROM @sql_text;
    EXECUTE statement_to_run;
    DEALLOCATE PREPARE statement_to_run;
  END IF;
END$$
DELIMITER ;

CALL add_game_risk_control_bet_column(
  'initial_bet',
  'bigint NULL COMMENT ''默认下注金额（分）''',
  'progress'
);
CALL add_game_risk_control_bet_column(
  'btn_bet',
  'varchar(255) NULL COMMENT ''快捷下注金额列表（元，逗号分隔）''',
  'initial_bet'
);
CALL add_game_risk_control_bet_column(
  'bet_min',
  'bigint NULL COMMENT ''最小下注金额（分）''',
  'btn_bet'
);
CALL add_game_risk_control_bet_column(
  'bet_max',
  'bigint NULL COMMENT ''最大下注金额（分）''',
  'bet_min'
);

DROP PROCEDURE IF EXISTS add_game_risk_control_bet_column;

-- ----------------------------
-- Integrated from 20260827_permission_iconify.sql
-- ----------------------------
-- Convert legacy Element UI menu icons to the Iconify identifiers used by Vben.
-- Safe to rerun: only the listed admin menu records are updated.
UPDATE `ams_permission`
SET
  `icon` = CASE `name`
    WHEN 'system' THEN 'lucide:settings-2'
    WHEN 'admin.admins' THEN 'lucide:user-cog'
    WHEN 'permission.permissions' THEN 'lucide:shield-check'
    WHEN 'role.roles' THEN 'lucide:user-check'
    WHEN 'log.name' THEN 'lucide:scroll-text'
    WHEN 'log.adminOperationLog' THEN 'lucide:clipboard-list'
    WHEN 'gameSetting.name' THEN 'lucide:gamepad-2'
    WHEN 'gameSetting.list' THEN 'lucide:sliders-horizontal'
    WHEN 'robotSetting.list' THEN 'lucide:bot'
    WHEN 'user.name' THEN 'lucide:users'
    WHEN 'user.list' THEN 'lucide:user'
    WHEN 'coinLog.list' THEN 'lucide:coins'
    WHEN 'gameRecord.list' THEN 'lucide:history'
    WHEN 'realTimeMonitoring.name' THEN 'lucide:monitor'
    WHEN 'realTimeMonitoring.list' THEN 'lucide:activity'
    WHEN 'gameControl.list' THEN 'lucide:gamepad'
    WHEN 'merchantReport.name' THEN 'lucide:bar-chart-3'
    WHEN 'merchantSummary.list' THEN 'lucide:store'
    WHEN 'channelSummary.list' THEN 'lucide:network'
    WHEN 'channelRealSummary.list' THEN 'lucide:activity'
    WHEN 'dailySummary.list' THEN 'lucide:calendar-days'
    WHEN 'task.name' THEN 'lucide:clipboard-list'
    WHEN 'task.list' THEN 'lucide:list-checks'
    WHEN 'task.examination' THEN 'lucide:clipboard-check'
    WHEN 'task.capital' THEN 'lucide:file-text'
    WHEN 'merchant.list' THEN 'lucide:building'
    WHEN 'channel.list' THEN 'lucide:share-2'
    WHEN 'channelGameConfig.list' THEN 'lucide:blocks'
    WHEN 'systemConfig.list' THEN 'lucide:settings'
    WHEN 'serverConfig.list' THEN 'lucide:server'
    WHEN 'currencySetting.list' THEN 'lucide:dollar-sign'
    WHEN 'ipList.list' THEN 'lucide:shield'
    ELSE `icon`
  END,
  `updated_at` = NOW()
WHERE `guard_name` = 'admin'
  AND `name` IN (
    'system', 'admin.admins', 'permission.permissions', 'role.roles',
    'log.name', 'log.adminOperationLog', 'gameSetting.name',
    'gameSetting.list', 'robotSetting.list', 'user.name', 'user.list',
    'coinLog.list', 'gameRecord.list', 'realTimeMonitoring.name',
    'realTimeMonitoring.list', 'gameControl.list', 'merchantReport.name',
    'merchantSummary.list', 'channelSummary.list', 'channelRealSummary.list',
    'dailySummary.list', 'task.name', 'task.list', 'task.examination',
    'task.capital', 'merchant.list', 'channel.list',
    'channelGameConfig.list', 'systemConfig.list', 'serverConfig.list',
    'currencySetting.list', 'ipList.list'
  );

-- Cover menu groups created after the original initialization data without
-- replacing icons that were already configured in menu management.
UPDATE `ams_permission`
SET
  `icon` = CASE `title`
    WHEN '游戏管理' THEN 'lucide:gamepad-2'
    WHEN '运营管理' THEN 'lucide:briefcase'
    WHEN '商户与渠道' THEN 'lucide:network'
    WHEN '数据报表' THEN 'lucide:bar-chart-3'
    WHEN '实时监控' THEN 'lucide:monitor'
    WHEN '系统管理' THEN 'lucide:settings-2'
    ELSE `icon`
  END,
  `updated_at` = NOW()
WHERE `guard_name` = 'admin'
  AND `title` IN (
    '游戏管理', '运营管理', '商户与渠道', '数据报表', '实时监控', '系统管理'
  )
  AND (`icon` IS NULL OR `icon` = '' OR `icon` = 'el-icon-document');

-- ----------------------------
-- Integrated from 20260831_game_risk_control_amplitude.sql
-- ----------------------------
-- `20260819_game_risk_control.sql` 的建表定义已包含该列；本脚本补齐历史库并迁移无歧义的旧渠道配置。
DROP PROCEDURE IF EXISTS add_game_risk_control_amplitude;
DELIMITER $$
CREATE PROCEDURE add_game_risk_control_amplitude()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'game_risk_control'
      AND column_name = 'amplitude'
  ) THEN
    ALTER TABLE `game_risk_control`
      ADD COLUMN `amplitude` bigint NULL COMMENT '下注金额递增减幅度（分）' AFTER `initial_bet`;
  END IF;
END$$
DELIMITER ;

CALL add_game_risk_control_amplitude();
DROP PROCEDURE IF EXISTS add_game_risk_control_amplitude;

UPDATE `game_risk_control` target
INNER JOIN (
  SELECT
    LOWER(TRIM(mapping.`game_code`)) AS `game_code`,
    MIN(setting.`amplitude`) AS `amplitude`
  FROM `channel_game_config` mapping
  INNER JOIN `cms_game_setting` setting
    ON setting.`id` = mapping.`game_setting_id`
  WHERE mapping.`game_code` IS NOT NULL
    AND TRIM(mapping.`game_code`) <> ''
  GROUP BY LOWER(TRIM(mapping.`game_code`))
  HAVING COUNT(setting.`amplitude`) = COUNT(*)
    AND COUNT(DISTINCT setting.`amplitude`) = 1
) source
  ON LOWER(TRIM(target.`game_code`)) = source.`game_code`
SET target.`amplitude` = source.`amplitude`
WHERE target.`amplitude` IS NULL;

-- ----------------------------
-- Integrated from 20260904_game_risk_control_daily_progress.sql
-- ----------------------------
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

SET FOREIGN_KEY_CHECKS = 1;

