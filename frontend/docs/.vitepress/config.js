export default {
  title: 'Vue Blog 项目文档',
  description: '现代化 Vue.js 博客平台的完整文档',
  
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '架构设计', link: '/architecture/' },
      { text: 'API 文档', link: '/api/' },
      { text: '组件库', link: '/components/' },
      { text: '部署指南', link: '/deployment/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '项目结构', link: '/guide/project-structure' },
            { text: '开发环境', link: '/guide/development' },
            { text: '构建部署', link: '/guide/build-deploy' }
          ]
        }
      ],
      
      '/architecture/': [
        {
          text: '架构设计',
          items: [
            { text: '总体架构', link: '/architecture/' },
            { text: '前端架构', link: '/architecture/frontend' },
            { text: '后端架构', link: '/architecture/backend' },
            { text: '数据库设计', link: '/architecture/database' },
            { text: '性能优化', link: '/architecture/performance' },
            { text: '安全设计', link: '/architecture/security' }
          ]
        }
      ],
      
      '/api/': [
        {
          text: 'API 文档',
          items: [
            { text: '概述', link: '/api/' },
            { text: '认证 API', link: '/api/auth' },
            { text: '文章 API', link: '/api/articles' },
            { text: '用户 API', link: '/api/users' },
            { text: '评论 API', link: '/api/comments' },
            { text: '错误处理', link: '/api/errors' }
          ]
        }
      ],
      
      '/components/': [
        {
          text: '组件库',
          items: [
            { text: '概述', link: '/components/' },
            { text: 'ArticleCard', link: '/components/article-card' },
            { text: 'CommentSection', link: '/components/comment-section' },
            { text: 'UserProfile', link: '/components/user-profile' },
            { text: '表单组件', link: '/components/forms' },
            { text: '布局组件', link: '/components/layout' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/vue-blog' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present Vue Blog Team'
    }
  }
}