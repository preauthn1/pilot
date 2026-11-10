const path = require('path')

const outputDirName = 'dist' + (process.env.ENV || '')
module.exports = {
  publicPath: './',
  outputDir: outputDirName,
  assetsDir: 'static',
  productionSourceMap: false,
  chainWebpack: config => {
    config.module
        .rule('images')
        .use('url-loader')
        .loader('url-loader')
        .tap(options => Object.assign(options, { limit: 1 }))
  },
  css: {
    loaderOptions: {
      less: {
        modifyVars: {
          // 通过 less 文件覆盖（文件路径为绝对路径）
          hack: `true; @import "${path.join(__dirname, './src/assets/css/variables.less')}";`,
        },
      },
    },
  }
}
