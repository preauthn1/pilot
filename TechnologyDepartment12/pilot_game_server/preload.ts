// 抑制 Node.js punycode 弃用警告
const _emitWarning = process.emitWarning.bind(process);
process.emitWarning = function (warning: any, ...args: any[]): void {
  if (args[0] === "DeprecationWarning" && typeof warning === "string" && warning.includes("punycode")) return;
  return _emitWarning(warning, ...args);
} as typeof process.emitWarning;

// 抑制 Node.js 22 框架依赖弃用警告
// (process as any).noDeprecation = true;

import * as util from 'util';
// polyfill: Node.js 18+ 移除了 util.isFunction，pinus 依赖它
(util as any).isFunction = (util as any).isFunction ?? ((arg: any): arg is (...args: any[]) => any => typeof arg === 'function');

import { Promise } from 'bluebird';
// 支持注解
import 'reflect-metadata';
import { pinus } from 'pinus';

/**
 *  替换全局Promise
 *  自动解析sourcemap
 *  捕获全局错误
 */
export function preload() {
    // 使用bluebird输出完整的promise调用链
    ((global as any).Promise as any) = (Promise as any);
    // 开启长堆栈
    Promise.config({
        // Enable warnings
        warnings: true,
        // Enable long stack traces
        longStackTraces: true,
        // Enable cancellation
        cancellation: true,
        // Enable monitoring
        monitoring: true
    });

    // 自动解析ts的sourcemap
    require('source-map-support').install({
        handleUncaughtExceptions: false
    });

    // 捕获普通异常
    process.on('uncaughtException', function (err) {
        console.error(pinus.app?.getServerId?.() ?? 'unknown', 'uncaughtException Caught exception: ', err);
    });

    // 捕获async异常
    process.on('unhandledRejection', (reason: any, p) => {
        console.error(pinus.app?.getServerId?.() ?? 'unknown', 'Caught Unhandled Rejection at:', p, 'reason:', reason);
    });
}
