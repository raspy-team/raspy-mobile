const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8081, 
  },
    pages: {
    index: {
      // main entry point
      entry: 'src/main.js', // 또는 main.ts
      // HTML template 위치 명시
      template: 'public/index.html',
      // 빌드될 파일명
      filename: 'index.html'
    }
  }
})
