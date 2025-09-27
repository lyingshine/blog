// 通过API注册用户的脚本
const axios = require('axios');

async function registerUser() {
  try {
    const userData = {
      username: 'lyingshine',
      email: 'lyingshine@example.com',
      password: 'admin123'
    };
    
    console.log('正在注册用户:', userData.username);
    
    const response = await axios.post('http://127.0.0.1:3000/api/auth/register', userData);
    
    console.log('✅ 注册成功:', response.data);
    
    // 测试登录
    console.log('\n正在测试登录...');
    const loginResponse = await axios.post('http://127.0.0.1:3000/api/auth/login', {
      username: userData.username,
      password: userData.password
    });
    
    console.log('✅ 登录成功:', loginResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API错误:', error.response.data);
    } else {
      console.error('❌ 网络错误:', error.message);
    }
  }
}

registerUser();