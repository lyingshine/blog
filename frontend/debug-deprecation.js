// 临时脚本用于追踪弃用警告
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning') {
    console.log('=== DEPRECATION WARNING ===');
    console.log('Name:', warning.name);
    console.log('Message:', warning.message);
    console.log('Stack:', warning.stack);
    console.log('========================');
  }
});

// 启动 Vite
import('./node_modules/vite/dist/node/cli.js');