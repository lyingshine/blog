// 清空所有预置数据
export const clearAllData = () => {
  localStorage.removeItem('blog_articles')
  localStorage.removeItem('blog_users')
  console.log('已清空所有预置数据')
}

// 初始化空数据
export const initEmptyData = () => {
  const existingArticles = localStorage.getItem('blog_articles')
  if (!existingArticles) {
    localStorage.setItem('blog_articles', JSON.stringify([]))
  }
}