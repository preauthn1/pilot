#!/bin/bash
set -euo pipefail

# ============================================
# polit-api 热重载监控脚本 (watchdog)
# 监控 JAR 文件变化 → 自动执行滚动重启（零停机）
# ============================================
# 前提：需配合 Nginx 反向代理双实例 + start.sh 滚动更新
# 使用方式：
#   前台运行:   ./watchdog.sh
#   后台运行:   nohup ./watchdog.sh >> logs/watchdog.log 2>&1 &
#   systemd:   见 polit-api-watchdog.service
# ============================================

# ---- 配置 ----
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR"
JAR_NAME="pilot_api_java-1.0.0.jar"
JAR_PATH="$APP_DIR/$JAR_NAME"
START_SCRIPT="$APP_DIR/start.sh"
LOG_DIR="$APP_DIR/logs"
WATCHDOG_LOG="$LOG_DIR/watchdog.log"

# 防抖等待时间（秒）：文件上传完成后的稳定等待
DEBOUNCE_SEC=3

# ---- 初始化 ----
mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$WATCHDOG_LOG"
}

log "============================================"
log "watchdog 启动，监控文件: $JAR_PATH"
log "============================================"

# ---- 检查依赖 ----
if ! command -v inotifywait &>/dev/null; then
    log "[ERROR] 未安装 inotify-tools，请执行: sudo apt install -y inotify-tools"
    exit 1
fi

if [ ! -f "$START_SCRIPT" ]; then
    log "[ERROR] start.sh 不存在: $START_SCRIPT"
    exit 1
fi

# ---- 信号处理（优雅退出）----
cleanup() {
    log "收到退出信号，watchdog 停止"
    exit 0
}
trap cleanup SIGTERM SIGINT SIGQUIT

# ---- 监控循环 ----
log "开始监听文件变更事件..."

inotifywait -m -e close_write -e moved_to --format '%e %f' "$APP_DIR" 2>&1 | while read -r event file; do
    # 只关心目标 JAR 文件
    if [ "$file" != "$JAR_NAME" ]; then
        continue
    fi

    log "检测到事件: $event → $file"

    # 防抖等待：确保文件完全写入（scp/rsync 可能分批写入）
    sleep "$DEBOUNCE_SEC"

    # 校验 JAR 包是否有效（非空、可读）
    if [ ! -f "$JAR_PATH" ]; then
        log "[WARN] JAR 文件不存在，跳过"
        continue
    fi

    jar_size=$(stat -c%s "$JAR_PATH" 2>/dev/null || echo 0)
    if [ "$jar_size" -eq 0 ]; then
        log "[WARN] JAR 文件大小为 0，跳过"
        continue
    fi

    log "JAR 文件大小: ${jar_size} bytes，准备滚动重启（零停机）..."

    # 执行滚动重启（逐个重启实例，接口不中断）
    if bash "$START_SCRIPT" rolling 2>&1 | tee -a "$WATCHDOG_LOG"; then
        log "[OK] 滚动热重载完成 ✓（接口零中断）"
    else
        log "[ERROR] 滚动重启失败，请检查日志"
    fi

    log "继续监听..."
done
