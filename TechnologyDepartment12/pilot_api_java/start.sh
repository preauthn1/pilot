#!/bin/bash
set -euo pipefail

# ============================================
# polit-api 启动脚本（双实例版 — 支持零停机滚动部署）
# Spring Boot 3.3.5  |  Java 21
# ============================================

# ---- 配置 ----
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR"
JAR_NAME="pilot_api_java-1.0.0.jar"
JAR_PATH="$APP_DIR/$JAR_NAME"

# 双实例端口
PORT_A=8880
PORT_B=8881

# PID 文件
PID_FILE_A="$APP_DIR/app-a.pid"
PID_FILE_B="$APP_DIR/app-b.pid"

# JDK 路径（优先使用指定版本，找不到则用系统默认 java；所有日志由 logback-spring.xml 统一管理）
PREFERRED_JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
if [ -x "$PREFERRED_JAVA_HOME/bin/java" ]; then
    JAVA_BIN="$PREFERRED_JAVA_HOME/bin/java"
else
    JAVA_BIN="java"
fi

# JVM 参数（Java 21 + G1）
JAVA_OPTS="-server -Xms256m -Xmx512m -XX:+UseG1GC -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8"

# 激活的 profile（dev / prod）
SPRING_PROFILE="prod"

# ---- 工具函数 ----
check_java() {
    if ! command -v "$JAVA_BIN" &>/dev/null && [ ! -x "$JAVA_BIN" ]; then
        echo "[ERROR] 未找到 java，请安装 Java 21+"
        exit 1
    fi
    local version
    version=$("$JAVA_BIN" -version 2>&1 | grep -oP 'version "\K[0-9]+')
    if [ -z "$version" ] || [ "$version" -lt 21 ]; then
        echo "[ERROR] 需要 Java 21+，当前: $("$JAVA_BIN" -version 2>&1 | head -1)"
        exit 1
    fi
}

# 根据端口获取 PID 文件路径
pid_file_for() { echo "$APP_DIR/app-${1##*-}.pid"; }
# 健康检查 URL
health_url_for() { echo "http://127.0.0.1:$1/api/gameSetting"; }

get_pid() {
    local pf="$1"
    if [ -f "$pf" ]; then cat "$pf"; fi
}

is_running() {
    local pf="$1"
    local pid
    pid=$(get_pid "$pf")
    [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# ---- 核心：单实例启动 ----
# 注：所有日志由 logback-spring.xml 统一管理输出到 logs/{port}/，
#      stdout/stderr 仅含框架启动早期信息，重定向到 /dev/null 丢弃
start_instance() {
    local label="$1" port="$2" pid_file="$3"

    if is_running "$pid_file"; then
        echo "[WARN] 实例 $label 已在运行中，PID: $(get_pid "$pid_file")"
        return 0
    fi

    if [ ! -f "$JAR_PATH" ]; then
        echo "[ERROR] JAR 包不存在: $JAR_PATH"
        return 1
    fi

    mkdir -p "$APP_DIR/logs"

    local scheduler_enabled="true"
    if [ "$label" = "B" ]; then
        scheduler_enabled="false"
    fi

    echo "[INFO] 启动实例 $label (port=$port, profile=$SPRING_PROFILE, scheduler=$scheduler_enabled) ..."
    nohup "$JAVA_BIN" $JAVA_OPTS \
        -jar "$JAR_PATH" \
        --server.port="$port" \
        --spring.profiles.active="$SPRING_PROFILE" \
        --spring.config.additional-location="file:$APP_DIR/config/" \
        --app.scheduler.enabled="$scheduler_enabled" \
        > /dev/null 2>&1 &

    echo $! > "$pid_file"
    sleep 2

    if is_running "$pid_file"; then
        echo "[OK] 实例 $label 启动成功，PID: $(get_pid "$pid_file") (port=$port)"
    else
        echo "[ERROR] 实例 $label 启动失败，请查看日志: $APP_DIR/logs/$port/app.log"
        rm -f "$pid_file"
        return 1
    fi
}

# ---- 核心：单实例停止 ----
stop_instance() {
    local label="$1" port="$2" pid_file="$3"

    local pid
    pid=$(get_pid "$pid_file")
    if [ -z "$pid" ]; then
        echo "[INFO] 实例 $label 未运行"
        return 0
    fi

    echo "[INFO] 停止实例 $label (port=$port, PID=$pid) ..."
    kill "$pid"

    local count=0
    while kill -0 "$pid" 2>/dev/null && [ $count -lt 30 ]; do
        sleep 1
        count=$((count + 1))
    done

    if kill -0 "$pid" 2>/dev/null; then
        echo "[WARN] 实例 $label 未响应，强制终止 ..."
        kill -9 "$pid"
    fi

    rm -f "$pid_file"
    echo "[OK] 实例 $label 已停止"
}

# ---- 核心：单实例重启 ----
restart_instance() {
    local label="$1" port="$2" pid_file="$3"

    # 先停（如果有运行的话）
    if is_running "$pid_file"; then
        stop_instance "$label" "$port" "$pid_file"
    fi

    # 再启
    start_instance "$label" "$port" "$pid_file"
}

# ---- 健康检查 ----
health_check() {
    local label="$1" port="$2"
    local url
    url=$(health_url_for "$port")
    local waited=0
    while [ $waited -lt 30 ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    return 1
}

# ---- 便捷命令：实例 A ----
start_a()  { start_instance  "A" "$PORT_A" "$PID_FILE_A"; }
stop_a()   { stop_instance   "A" "$PORT_A" "$PID_FILE_A"; }
restart_a() { restart_instance "A" "$PORT_A" "$PID_FILE_A"; }

# ---- 便捷命令：实例 B ----
start_b()  { start_instance  "B" "$PORT_B" "$PID_FILE_B"; }
stop_b()   { stop_instance   "B" "$PORT_B" "$PID_FILE_B"; }
restart_b() { restart_instance "B" "$PORT_B" "$PID_FILE_B"; }

# ---- 双实例管理 ----
start_all() {
    echo "[INFO] === 启动全部实例 ==="
    start_a
    start_b
    echo "[OK] === 全部实例已启动 ==="
}

stop_all() {
    echo "[INFO] === 停止全部实例 ==="
    stop_a
    stop_b
    echo "[OK] === 全部实例已停止 ==="
}

restart_all() {
    echo "[INFO] === 重启全部实例（注意：有短暂中断） ==="
    stop_a
    stop_b
    start_a
    start_b
    echo "[OK] === 全部实例已重启 ==="
}

# ---- 状态查看 ----
status() {
    echo "============================================"
    echo " polit-api 实例状态"
    echo "============================================"
    for pair in "A:$PORT_A:$PID_FILE_A" "B:$PORT_B:$PID_FILE_B"; do
        local label="${pair%%:*}"
        local rest="${pair#*:}"
        local port="${rest%%:*}"
        local pid_file="${rest#*:}"
        local pid
        pid=$(get_pid "$pid_file")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            local health="?"
            if curl -sf "$(health_url_for "$port")" > /dev/null 2>&1; then
                health="✓ 健康"
            else
                health="✗ 未就绪"
            fi
            echo " 实例 $label  | 端口 $port | PID $pid | $health"
        else
            echo " 实例 $label  | 端口 $port | 未运行"
        fi
    done
    echo "============================================"
}

# ---- 更新 JAR + 滚动重启（零停机） ----
update() {
    local new_jar="${2:-}"

    if [ -z "$new_jar" ]; then
        echo "[ERROR] 用法: $0 update <新JAR路径>"
        echo "  示例: $0 update /tmp/pilot_api_java-1.0.0.jar"
        exit 1
    fi

    if [ ! -f "$new_jar" ]; then
        echo "[ERROR] 文件不存在: $new_jar"
        exit 1
    fi

    local new_size
    new_size=$(stat -c%s "$new_jar" 2>/dev/null || echo 0)
    if [ "$new_size" -eq 0 ]; then
        echo "[ERROR] 文件大小为 0: $new_jar"
        exit 1
    fi

    echo "[INFO] 替换 JAR 包 ($new_size bytes) ..."
    cp "$new_jar" "$JAR_PATH"
    echo "[OK] JAR 已更新"

    # 如果至少一个实例在运行 → 滚动更新（零停机）
    local a_running=false
    local b_running=false
    is_running "$PID_FILE_A" && a_running=true
    is_running "$PID_FILE_B" && b_running=true

    if $a_running && $b_running; then
        echo "[INFO] 双实例运行中 → 滚动更新（零停机）"
        rolling_restart
    elif $a_running || $b_running; then
        local running_label="B"
        local stopped_label="A"
        $a_running && { running_label="A"; stopped_label="B"; }
        echo "[INFO] 仅实例 $running_label 运行中 → 先启动 $stopped_label，再切流量"
        # 先启动停了的那个，这样就有两个可用的
        if [ "$stopped_label" = "A" ]; then start_a; else start_b; fi
        # 滚动重启
        rolling_restart
    else
        echo "[INFO] 无实例运行 → 直接启动全部"
        start_all
    fi
}

# ---- 滚动重启（零停机）----
rolling_restart() {
    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║  滚动更新 — 零停机部署                   ║"
    echo "╚══════════════════════════════════════════╝"
    echo ""

    # 阶段 1：重启实例 B（Nginx 流量自动转到 A）
    echo "━━━ 阶段 1/2：重启实例 B (port=$PORT_B) ━━━"
    echo "  流量路径: Nginx → 实例 A (唯一可用)"
    stop_instance  "B" "$PORT_B" "$PID_FILE_B"
    start_instance "B" "$PORT_B" "$PID_FILE_B"
    echo "  等待实例 B 健康检查 ..."
    if health_check "B" "$PORT_B"; then
        echo "  [OK] 实例 B 就绪 → 流量路径: Nginx → A + B"
    else
        echo "  [ERROR] 实例 B 健康检查超时！实例 A 仍在服务中"
    fi

    # 阶段 2：重启实例 A
    echo ""
    echo "━━━ 阶段 2/2：重启实例 A (port=$PORT_A) ━━━"
    echo "  流量路径: Nginx → 实例 B (唯一可用)"
    stop_instance  "A" "$PORT_A" "$PID_FILE_A"
    start_instance "A" "$PORT_A" "$PID_FILE_A"
    echo "  等待实例 A 健康检查 ..."
    if health_check "A" "$PORT_A"; then
        echo "  [OK] 实例 A 就绪 → 流量路径: Nginx → A + B"
    else
        echo "  [ERROR] 实例 A 健康检查超时！实例 B 仍在服务中"
    fi

    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║  ✓  滚动更新完成，接口零中断              ║"
    echo "╚══════════════════════════════════════════╝"
    status
}

# ---- 入口 ----
check_java

case "${1:-}" in
    # 单实例管理
    start-a)    start_a ;;
    stop-a)     stop_a ;;
    restart-a)  restart_a ;;
    start-b)    start_b ;;
    stop-b)     stop_b ;;
    restart-b)  restart_b ;;

    # 双实例管理
    start)      start_all ;;
    stop)       stop_all ;;
    restart)    restart_all ;;

    # 零停机滚动重启（不替换JAR，watchdog调用）
    rolling)    rolling_restart ;;

    # 零停机更新
    update)     update "$@" ;;

    # 查看状态
    status)     status ;;

    *)
        echo "用法: $0 {start|stop|restart|rolling|status|update|start-a|stop-a|restart-a|start-b|stop-b|restart-b}"
        echo ""
        echo "  双实例管理:"
        echo "    start      启动 A+B 两个实例"
        echo "    stop       停止 A+B 两个实例"
        echo "    restart    重启 A+B（有短暂中断）"
        echo "    status     查看双实例运行状态"
        echo ""
        echo "  单实例管理:"
        echo "    start-a    仅启动实例 A (port $PORT_A)"
        echo "    stop-a     仅停止实例 A"
        echo "    restart-a  仅重启实例 A"
        echo "    start-b    仅启动实例 B (port $PORT_B)"
        echo "    stop-b     仅停止实例 B"
        echo "    restart-b  仅重启实例 B"
        echo ""
        echo "  热重载（零停机）:"
        echo "    rolling               滚动重启（JAR已就位，仅重启实例）"
        echo "    update <新JAR路径>    替换 JAR → 自动滚动重启"
        echo "                          示例: $0 update /tmp/pilot_api_java-1.0.0.jar"
        echo ""
        echo "项目: polit-api (Spring Boot 3.3.5 / Java 21)"
        echo "端口: $PORT_A (A) / $PORT_B (B)  |  Nginx → upstream 负载均衡"
        exit 1
        ;;
esac
