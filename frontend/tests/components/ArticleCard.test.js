import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ArticleCard from '@/components/ArticleCard.vue'

describe('ArticleCard 组件', () => {
  const mockArticle = {
    id: 1,
    title: '测试文章标题',
    content: '这是一篇测试文章的内容...',
    author: '测试作者',
    created_at: '2023-01-01T00:00:00Z',
    category: '技术',
    tags: ['Vue', 'JavaScript'],
    likes: 10,
    comments_count: 5
  }

  it('应该正确渲染文章信息', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle
      }
    })

    expect(wrapper.find('.article-title').text()).toBe(mockArticle.title)
    expect(wrapper.find('.article-author').text()).toContain(mockArticle.author)
    expect(wrapper.find('.article-category').text()).toBe(mockArticle.category)
  })

  it('应该正确显示文章摘要', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle
      }
    })

    const excerpt = wrapper.find('.article-excerpt')
    expect(excerpt.exists()).toBe(true)
    expect(excerpt.text().length).toBeLessThanOrEqual(150)
  })

  it('应该显示正确的日期格式', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle
      }
    })

    const dateElement = wrapper.find('.article-date')
    expect(dateElement.exists()).toBe(true)
    // 检查日期格式是否正确
    expect(dateElement.text()).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  it('应该显示标签列表', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle
      }
    })

    const tags = wrapper.findAll('.tag')
    expect(tags).toHaveLength(mockArticle.tags.length)
    expect(tags[0].text()).toBe('Vue')
    expect(tags[1].text()).toBe('JavaScript')
  })

  it('应该显示点赞和评论数量', () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle
      }
    })

    expect(wrapper.find('.likes-count').text()).toContain('10')
    expect(wrapper.find('.comments-count').text()).toContain('5')
  })

  it('点击卡片应该触发导航', async () => {
    const mockPush = vi.fn()
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle
      },
      global: {
        mocks: {
          $router: {
            push: mockPush
          }
        }
      }
    })

    await wrapper.find('.article-card').trigger('click')
    expect(mockPush).toHaveBeenCalledWith(`/article/${mockArticle.id}`)
  })

  it('应该处理缺少可选字段的文章', () => {
    const minimalArticle = {
      id: 2,
      title: '最小文章',
      content: '内容',
      author: '作者',
      created_at: '2023-01-01T00:00:00Z'
    }

    const wrapper = mount(ArticleCard, {
      props: {
        article: minimalArticle
      }
    })

    expect(wrapper.find('.article-title').text()).toBe(minimalArticle.title)
    expect(wrapper.find('.likes-count').text()).toContain('0')
    expect(wrapper.find('.comments-count').text()).toContain('0')
  })

  it('应该正确处理长标题的截断', () => {
    const longTitleArticle = {
      ...mockArticle,
      title: '这是一个非常非常非常长的文章标题，应该被正确截断以避免布局问题'
    }

    const wrapper = mount(ArticleCard, {
      props: {
        article: longTitleArticle
      }
    })

    const titleElement = wrapper.find('.article-title')
    expect(titleElement.exists()).toBe(true)
    // 检查是否应用了截断样式
    expect(titleElement.classes()).toContain('text-ellipsis')
  })

  it('应该在悬停时显示完整标题', async () => {
    const wrapper = mount(ArticleCard, {
      props: {
        article: mockArticle
      }
    })

    const card = wrapper.find('.article-card')
    await card.trigger('mouseenter')
    
    expect(card.classes()).toContain('hovered')
  })
})