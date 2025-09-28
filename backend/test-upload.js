// 测试上传功能
const fs = require('fs');
const path = require('path');

// 检查上传目录
const uploadDir = path.join(__dirname, 'uploads/avatars');
console.log('上传目录:', uploadDir);
console.log('目录是否存在:', fs.existsSync(uploadDir));

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ 创建上传目录成功');
  } catch (error) {
    console.error('❌ 创建上传目录失败:', error);
  }
}

// 检查目录权限
try {
  const testFile = path.join(uploadDir, 'test.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('✅ 目录权限正常');
} catch (error) {
  console.error('❌ 目录权限问题:', error);
}

// 检查环境变量
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);