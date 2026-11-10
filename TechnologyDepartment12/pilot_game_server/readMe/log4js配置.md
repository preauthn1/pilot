# Node.js日志系统log4js介绍
##### 关于 log4js ，此处不做过多介绍，你如果有关注过日志系统，那就应该听说过类似 log4cpp、log4net、log4j、log4p 等名词。是的，log4xxx 是 Apache 提供的开源日志框架，它可以将日志信息按指定的格式、分级不同的级别输出到多种介质（控制台、文件、数据库等），并且还支持日志文件的自动备份等功能。不同的编程语言有不同的 log4xxx 版本，其中 log4js 便是 node.js 版本的，本文将从总体上介绍 log4js 的一些概念和使用方法。  
## 最简单的使用
##### 首先让我们来看一个最简单的使用示例，编码之前通过 npm 安装 log4js 包。
```
npm install log4js
```
##### 通过如下方式来使用 log4js 功能：
```
var log4js = require('log4js');
var logger = log4js.getLogger();

logger.level = "info"; // default level is OFF - which means no logs at all.
logger.info("Log from default logger");
```
##### 输出结果：
```
[2018-11-13T19:18:54.225] [INFO] default - Log from default logger
```
##### 注意，默认的 level 是 off，不会输入任何信息，info 方法会报错。除了 info 方法外，还有 error、warn 等方法，只有启用了相应的 level 的情况下才能调用相关的方法。级别的顺序为：
```
ALL->TRACE->DEBUG->INFO->WARN->ERROR->FATAL->MARK->OFF
```
## 加载配置项
##### log4js 支持两种配置方式，一种是 json 文件，另一种是 json 对象。两种方式的原理是一样的，下面以 json 对象为例来说明如何进行配置。
```
var log4js = require('log4js');

log4js.configure({
    appenders:{
        std: { type: "stdout", level: "all", layout:{type: "basic", } },
        file: { type: "file", filename: "log.txt", encoding: "utf-8" }
    },
    categories: {
        default: {appenders: ["std"], level: "debug"},
        custom: {appenders: ["std", "file"], level: "all"}
    }
});

var logger = log4js.getLogger("custom");
logger.warn("I will be logged both in console and log.txt");
```
##### 如上代码所示，先是配置了 default 和 custom 两个日志器，后面调用了 custom 日志器来输出一条 warm 级别的日志。由于 custom 日志器引用了 std 和 file 两个 appender，所以该条日志将同时被输出到 stdout（控制台） 和 log.txt（文件）。
```
[2018-11-13T21:12:12.682] [WARN] custom - I will be logged in log.txt
```
##### 注意：调试状态下日志信息不会被输出到文件中，只有在运行状态下才会，这跟 log4js 的内部实现有关，它判断了当前的工作线程，具体可参阅文末的参考资料。
##### 通过如上代码的演示，你应该基本了解了 log4js 的配置，我将在下一节中介绍各个配置的项的含义。
### 几个核心概念
```
Category(存储器) 
Appender(存哪里) 
Layout(如何存)
```
##### 如上图所示，我们已经在上一节的配置介绍中接触到这些概念。总的来说，log4js 由 category、appender 、layout 三大部分构成，其中 category 是日志器实例，每个实例中可以包含多个 appender，而每个 appender 中包含一个 layout，appender 用于指定日志的输出位置（控制台、文件等），layout 用于定义日志的输出格式。
## layout
##### layout 用于定义每条日志的输出格式，log4js 内建了如下几种类型的 layout：
* basic：输出时间戳、级别，、别，后跟格式化的日志事件数据
* coloured (or colored)：与 basic 相似，只是会根据日志的级别进行着色
* messagePassThrough：格式化日志事件数据，不输出时间戳，级别或类别
* dummy：仅输出日志事件数据中的第一个值，用处不大
* pattern：按照指定的模式进行输出
##### 我们重点来看一下 pattern 类型的 layout 是如何配置的：
```
log4js.configure({
    appenders: {
      std: { type: 'stdout', layout: {
          type: 'pattern',
          pattern: '%d %p %c %x{user} %m%n',
          tokens: { user: function(logEvent) { return AuthLibrary.currentUser(); }}
        }}
    },
    categories: { default: { appenders: ['srd'], level: 'info' } }
  });
  
var logger = log4js.getLogger();
logger.info('doing something.');
```
##### 其中，%d、%p、%n 等表示的是日志系统中的变量，%d 指的是 日期时间 、%p 指的是 日志等级 ，%n 指的是 换行 ；另外，%x{user} 指的是将动态令牌 user 添加到日志中。除此之外，我们还可以使用 log4js.addLayout(type, fn) 来添加自定义的 layout 。
## appender
##### 定义日志的输出介质，常用的 appender 有如下两种：
* stdout 或 stderr ：将日志输出到彩色控制台中，前者是默认的 appender
* file ：将日志输出到文件，可以指定单个日志文件的大小、滚动备份等
##### 另外还有 SMTP、Loggy、TCP 等 Appender。
```
log4js.configure({
  appenders: {
    network: { type: 'tcp', host: 'log.server', port: 12701 }
  },
  categories: {
    default: { appenders: ['network'], level: 'error' }
  }
});
```
## category
##### category 指的是日志器实例，我们通过 log4js.getLogger() 拿到的是 log4js 系统中默认的日志器，还可以通过指定的名称来获取配置文件中相应的日志器。一个日志系统中可以有多个 category ，每个 category 中可以有多个 appender 。
```
log4js.configure({
    appenders:{
        std: { type: "stdout", level: "all", layout:{type: "basic", } },
        file: { type: "file", filename: "log.txt", encoding: "utf-8" }
    },
    categories: {
        default: {appenders: ["std"], level: "debug"},
        custom: {appenders: ["std", "file"], level: "all"}
    }
});

var logger = log4js.getLogger("custom");
logger.warn("I will be logged both in console and log.txt");
```
##### 如上代码所示，配置文件中定义了 default 和 custom 两个日志器，使用 log4js.getLogger("custom") 获取了 custom 日志器，并用它来将入日志同时输出到控制台和文件中。