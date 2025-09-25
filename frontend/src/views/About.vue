<template>
  <div class="about-page">
    <div class="container">
      <!-- Hero Section -->
      <section class="about-hero">
        <div class="hero-content">
          <div class="avatar">
            <div class="avatar-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>
          <h1 class="hero-title">关于我</h1>
          <p class="hero-subtitle">在这里分享你的故事</p>
        </div>
      </section>

      <!-- Content Sections -->
      <div class="content-grid">
        <!-- Introduction -->
        <section class="content-card">
          <div class="card-header">
            <div class="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <h2>个人简介</h2>
          </div>
          <div class="placeholder-content">
            <p>这里可以写你的个人介绍...</p>
            <p>分享你的故事、经历和想法。</p>
          </div>
        </section>

        <!-- Skills -->
        <section class="content-card">
          <div class="card-header">
            <div class="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2,17 12,22 22,17"/>
                <polyline points="2,12 12,17 22,12"/>
              </svg>
            </div>
            <h2>技能专长</h2>
          </div>
          <div class="placeholder-content">
            <p>展示你的专业技能和特长</p>
          </div>
        </section>

        <!-- Experience -->
        <section class="content-card">
          <div class="card-header">
            <div class="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h2>工作经历</h2>
          </div>
          <div class="placeholder-content">
            <p>分享你的工作经验和成就</p>
          </div>
        </section>

        <!-- Projects -->
        <section class="content-card">
          <div class="card-header">
            <div class="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <h2>项目作品</h2>
          </div>
          <div class="placeholder-content">
            <p>展示你的项目和作品集</p>
          </div>
        </section>

        <!-- Contact -->
        <section class="content-card">
          <div class="card-header">
            <div class="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2>联系方式</h2>
          </div>
          <div class="placeholder-content">
            <p>添加你的联系方式，方便读者与你交流</p>
          </div>
        </section>

        <!-- Edit Hint -->
        <section class="edit-hint">
          <div class="hint-content">
            <div class="hint-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3>自定义提示</h3>
              <p>这是一个关于页面的模板。你可以根据需要编辑这个页面，添加你的个人信息、技能、经历等内容。</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About'
}
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-gray-50) 0%, var(--color-white) 100%);
}

.about-hero {
  text-align: center;
  padding: var(--space-3xl) 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--color-white);
  border-radius: var(--radius-2xl);
  margin-bottom: var(--space-3xl);
  position: relative;
  overflow: hidden;
}

.about-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.avatar {
  margin-bottom: var(--space-xl);
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 3px solid rgba(255, 255, 255, 0.2);
  transition: var(--transition-normal);
}

.avatar-placeholder:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2);
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: var(--space-md);
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  font-weight: 400;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--space-xl);
  margin-bottom: var(--space-3xl);
}

.content-card {
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
  transition: var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.content-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%);
  opacity: 0;
  transition: var(--transition-normal);
}

.content-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.content-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
}

.placeholder-content {
  background: var(--color-gray-50);
  padding: var(--space-xl);
  border-radius: var(--radius-xl);
  border: 2px dashed var(--color-gray-300);
  text-align: center;
  transition: var(--transition-normal);
}

.placeholder-content:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.placeholder-content p {
  color: var(--color-gray-600);
  margin-bottom: var(--space-sm);
  font-size: 1rem;
  line-height: 1.6;
}

.placeholder-content p:last-child {
  margin-bottom: 0;
}

.edit-hint {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, var(--color-info) 0%, var(--color-primary) 100%);
  color: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: var(--space-xl);
  position: relative;
  overflow: hidden;
}

.edit-hint::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.hint-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  position: relative;
  z-index: 1;
}

.hint-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hint-content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: var(--space-sm);
  color: var(--color-white);
}

.hint-content p {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.125rem;
  }
  
  .avatar-placeholder {
    width: 100px;
    height: 100px;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
  
  .card-header {
    flex-direction: column;
    text-align: center;
    gap: var(--space-sm);
  }
  
  .hint-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>