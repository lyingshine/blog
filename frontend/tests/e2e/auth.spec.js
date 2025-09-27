import { test, expect } from '@playwright/test'

test.describe('用户认证流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('应该能够访问登录页面', async ({ page }) => {
    await page.click('text=登录')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('登录')
  })

  test('应该能够成功登录', async ({ page }) => {
    await page.goto('/login')
    
    // 填写登录表单
    await page.fill('[data-testid="username"]', 'testuser')
    await page.fill('[data-testid="password"]', 'password123')
    
    // 提交表单
    await page.click('[data-testid="login-button"]')
    
    // 验证登录成功
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('应该显示登录错误信息', async ({ page }) => {
    await page.goto('/login')
    
    // 填写错误的登录信息
    await page.fill('[data-testid="username"]', 'wronguser')
    await page.fill('[data-testid="password"]', 'wrongpass')
    
    // 提交表单
    await page.click('[data-testid="login-button"]')
    
    // 验证错误信息
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('用户名或密码错误')
  })

  test('应该能够登出', async ({ page }) => {
    // 先登录
    await page.goto('/login')
    await page.fill('[data-testid="username"]', 'testuser')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // 等待登录完成
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // 点击用户菜单
    await page.click('[data-testid="user-menu"]')
    
    // 点击登出
    await page.click('text=登出')
    
    // 验证登出成功
    await expect(page.locator('text=登录')).toBeVisible()
  })
})

test.describe('受保护的路由', () => {
  test('未登录用户应该被重定向到登录页', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/login')
  })

  test('已登录用户应该能够访问管理页面', async ({ page }) => {
    // 先登录
    await page.goto('/login')
    await page.fill('[data-testid="username"]', 'admin')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    
    // 访问管理页面
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin')
    await expect(page.locator('h1')).toContainText('管理面板')
  })
})