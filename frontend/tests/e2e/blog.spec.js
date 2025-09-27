import { test, expect } from '@playwright/test'

test.describe('博客功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('应该显示文章列表', async ({ page }) => {
    await expect(page.locator('[data-testid="article-list"]')).toBeVisible()
    
    // 检查是否有文章卡片
    const articleCards = page.locator('[data-testid="article-card"]')
    await expect(articleCards.first()).toBeVisible()
  })

  test('应该能够查看文章详情', async ({ page }) => {
    // 点击第一篇文章
    await page.click('[data-testid="article-card"]:first-child')
    
    // 验证跳转到文章详情页
    await expect(page).toHaveURL(/\/article\/\d+/)
    await expect(page.locator('[data-testid="article-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="article-content"]')).toBeVisible()
  })

  test('应该能够搜索文章', async ({ page }) => {
    // 在搜索框中输入关键词
    await page.fill('[data-testid="search-input"]', 'Vue')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // 验证搜索结果
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    // 检查搜索结果是否包含关键词
    const results = page.locator('[data-testid="article-card"]')
    const count = await results.count()
    
    if (count > 0) {
      await expect(results.first().locator('[data-testid="article-title"]')).toContainText('Vue')
    }
  })

  test('应该能够按分类筛选文章', async ({ page }) => {
    // 点击分类筛选
    await page.click('[data-testid="category-filter"]')
    await page.click('text=技术')
    
    // 验证筛选结果
    await expect(page).toHaveURL(/\/category\/技术/)
    await expect(page.locator('[data-testid="category-title"]')).toContainText('技术')
  })

  test('应该支持文章分页', async ({ page }) => {
    // 滚动到页面底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // 等待加载更多按钮或分页组件
    const loadMoreButton = page.locator('[data-testid="load-more"]')
    const paginationNext = page.locator('[data-testid="pagination-next"]')
    
    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click()
      // 验证加载了更多文章
      await expect(page.locator('[data-testid="article-card"]')).toHaveCount(await page.locator('[data-testid="article-card"]').count() + 1)
    } else if (await paginationNext.isVisible()) {
      await paginationNext.click()
      // 验证跳转到下一页
      await expect(page).toHaveURL(/page=2/)
    }
  })
})

test.describe('文章创建和编辑', () => {
  test.beforeEach(async ({ page }) => {
    // 登录管理员账户
    await page.goto('/login')
    await page.fill('[data-testid="username"]', 'admin')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('应该能够创建新文章', async ({ page }) => {
    await page.goto('/create')
    
    // 填写文章信息
    await page.fill('[data-testid="article-title"]', '测试文章标题')
    await page.fill('[data-testid="article-content"]', '这是一篇测试文章的内容...')
    await page.selectOption('[data-testid="article-category"]', '技术')
    await page.fill('[data-testid="article-tags"]', 'Vue,JavaScript,测试')
    
    // 提交文章
    await page.click('[data-testid="publish-button"]')
    
    // 验证文章创建成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('文章发布成功')
  })

  test('应该能够编辑现有文章', async ({ page }) => {
    // 先创建一篇文章
    await page.goto('/create')
    await page.fill('[data-testid="article-title"]', '待编辑的文章')
    await page.fill('[data-testid="article-content"]', '原始内容')
    await page.click('[data-testid="publish-button"]')
    
    // 进入我的文章页面
    await page.goto('/my-posts')
    
    // 点击编辑按钮
    await page.click('[data-testid="edit-button"]:first-child')
    
    // 修改文章内容
    await page.fill('[data-testid="article-title"]', '已编辑的文章标题')
    await page.fill('[data-testid="article-content"]', '已编辑的内容')
    
    // 保存修改
    await page.click('[data-testid="save-button"]')
    
    // 验证修改成功
    await expect(page.locator('[data-testid="success-message"]')).toContainText('文章更新成功')
  })

  test('应该能够删除文章', async ({ page }) => {
    await page.goto('/my-posts')
    
    // 点击删除按钮
    await page.click('[data-testid="delete-button"]:first-child')
    
    // 确认删除
    await page.click('[data-testid="confirm-delete"]')
    
    // 验证删除成功
    await expect(page.locator('[data-testid="success-message"]')).toContainText('文章已删除')
  })
})