// 追踪 util._extend 使用的脚本
const Module = require('module');
const originalRequire = Module.prototype.require;

// 拦截 require 调用
Module.prototype.require = function(id) {
  const result = originalRequire.apply(this, arguments);
  
  // 检查是否是 util 模块
  if (id === 'util' && result._extend) {
    // 重写 _extend 方法来追踪调用栈
    const originalExtend = result._extend;
    result._extend = function() {
      console.log('=== util._extend 被调用 ===');
      console.log('调用栈:');
      console.log(new Error().stack);
      console.log('========================');
      return originalExtend.apply(this, arguments);
    };
  }
  
  return result;
};

// 启动 Vite
require('./node_modules/vite/bin/vite.js');