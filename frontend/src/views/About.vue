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
          <h1 class="hero-title">关于我们</h1>
          <p class="hero-subtitle">分享思考，记录成长</p>
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
            <h2>我的故事</h2>
          </div>
          <div class="placeholder-content">
            <p>每个人都有自己的故事，它可能来自一次偶然的感悟，一段难忘的经历，或是对生活的热爱...</p>
            <p>在这里，分享你的故事和想法，与更多人交流。</p>
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
            <p>分享你掌握的技能和专业知识，展示你的能力和经验。</p>
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
            <p>每一段经历都是成长路上的重要足迹，值得被记录和珍惜。</p>
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
            <h2>我的作品</h2>
          </div>
          <div class="placeholder-content">
            <p>展示你创造的作品和项目，分享你的创作历程。</p>
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
            <p>欢迎与我交流分享，一起探讨有趣的话题。</p>
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
              <h3>编辑提示</h3>
              <p>这是关于页面的模板。你可以根据自己的情况，编辑这个页面，分享你的故事、技能专长、工作经历以及作品项目。让访问者更好地了解你。</p>
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
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  padding: var(--space-8) 0;
}

.about-hero {
  text-align: center;
  padding: var(--space-20) var(--space-8);
  background: linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 80%, var(--color-primary)) 100%);
  color: var(--text-inverse);
  border-radius: var(--radius-3xl);
  margin-bottom: var(--space-16);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  border: 1px solid color-mix(in srgb, var(--color-accent) 80%, transparent);
}

.about-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(255,255,255,0.08) 0%, transparent 50%);
  pointer-events: none;
}

.about-hero::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.03) 90deg, transparent 180deg);
  animation: rotate var(--duration-slow) linear infinite;
  pointer-events: none;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.hero-content {
  position: relative;
  z-index: 2;
}

.avatar {
  margin-bottom: var(--space-8);
}

.avatar-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 3px solid rgba(255, 255, 255, 0.3);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-lg);
  position: relative;
}

.avatar-placeholder::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1));
  z-index: -1;
}

.avatar-placeholder:hover {
  transform: translateY(-4px) scale(1.05);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: var(--shadow-xl);
}

.hero-title {
  font-size: var(--text-5xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-4);
  background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hero-subtitle {
  font-size: var(--text-xl);
  opacity: 0.95;
  font-weight: var(--font-weight-medium);
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: var(--space-8);
  margin-bottom: var(--space-16);
}

.content-card {
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.content-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-primary) 100%);
  opacity: 0;
  transition: all var(--transition-fast);
}

.content-card::after {
  content: '';
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, var(--color-accent) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0.05;
  transition: all var(--transition-fast);
}

.content-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: var(--shadow-xl);
  border-color: var(--border-hover);
}

.content-card:hover::before {
  opacity: 1;
}

.content-card:hover::after {
  opacity: 0.1;
  transform: scale(1.2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-2xl);
  background: linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 80%, var(--color-primary)) 100%);
  color: var(--text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
}

.content-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: var(--shadow-lg);
}

.card-header h2 {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.placeholder-content {
  background: var(--bg-secondary);
  padding: var(--space-8);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-color);
  text-align: center;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.placeholder-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    color-mix(in srgb, var(--color-accent) 5%, transparent) 0%, 
    color-mix(in srgb, var(--color-primary) 3%, transparent) 100%);
  opacity: 0;
  transition: all var(--transition-fast);
  pointer-events: none;
}

.placeholder-content::after {
  content: '✨';
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  font-size: var(--text-2xl);
  opacity: 0.3;
  transition: all var(--transition-fast);
}

.placeholder-content:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.placeholder-content:hover::before {
  opacity: 1;
}

.placeholder-content:hover::after {
  opacity: 0.6;
  transform: scale(1.2) rotate(15deg);
}

.placeholder-content p {
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
}

.placeholder-content p:last-child {
  margin-bottom: 0;
}

.edit-hint {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: var(--text-inverse);
  border-radius: var(--radius-3xl);
  padding: var(--space-10);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  border: 1px solid color-mix(in srgb, var(--color-primary) 80%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.edit-hint::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
  animation: float var(--duration-slow) ease-in-out infinite;
}

.edit-hint::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg) scale(1); 
    opacity: 0.8;
  }
  50% { 
    transform: translateY(-24px) rotate(180deg) scale(1.1); 
    opacity: 1;
  }
}

.hint-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-5);
  position: relative;
  z-index: 2;
}

.hint-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all var(--transition-fast);
}

.edit-hint:hover .hint-icon {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-md);
}

.hint-content h3 {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-3);
  color: var(--text-inverse);
}

.hint-content p {
  color: rgba(255, 255, 255, 0.95);
  line-height: var(--line-height-relaxed);
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
}

/* 现代响应式设计 */
@media (max-width: 1279px) {
  .content-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: var(--space-6);
  }
}

@media (max-width: 1023px) {
  .about-hero {
    padding: var(--space-16) var(--space-6);
    margin-bottom: var(--space-12);
  }
  
  .hero-title {
    font-size: var(--text-4xl);
  }
  
  .content-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--space-6);
  }
}

@media (max-width: 767px) {
  .about-page {
    padding: var(--space-6) 0;
  }
  
  .about-hero {
    padding: var(--space-12) var(--space-4);
    margin-bottom: var(--space-10);
  }
  
  .hero-title {
    font-size: var(--text-3xl);
  }
  
  .hero-subtitle {
    font-size: var(--text-lg);
  }
  
  .avatar-placeholder {
    width: 120px;
    height: 120px;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
    margin-bottom: var(--space-12);
  }
  
  .content-card {
    padding: var(--space-6);
  }
  
  .card-header {
    flex-direction: column;
    text-align: center;
    gap: var(--space-3);
  }
  
  .card-icon {
    width: 52px;
    height: 52px;
  }
  
  .hint-content {
    flex-direction: column;
    text-align: center;
    gap: var(--space-4);
  }
  
  .edit-hint {
    padding: var(--space-8);
  }
}

@media (max-width: 639px) {
  .about-hero {
    padding: var(--space-10) var(--space-3);
  }
  
  .hero-title {
    font-size: var(--text-2xl);
  }
  
  .hero-subtitle {
    font-size: var(--text-base);
  }
  
  .avatar-placeholder {
    width: 100px;
    height: 100px;
  }
  
  .content-card {
    padding: var(--space-5);
  }
  
  .placeholder-content {
    padding: var(--space-6);
  }
  
  .edit-hint {
    padding: var(--space-6);
  }
}

@media (max-width: 479px) {
  .hero-title {
    font-size: var(--text-xl);
  }
  
  .card-header h2 {
    font-size: var(--text-lg);
  }
  
  .card-icon {
    width: 48px;
    height: 48px;
  }
  
  .hint-content h3 {
    font-size: var(--text-lg);
  }
  
  .hint-content p {
    font-size: var(--text-sm);
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .about-hero::after,
  .edit-hint::before {
    animation: none;
  }
  
  .avatar-placeholder,
  .content-card,
  .card-icon,
  .placeholder-content {
    transition: none;
  }
  
  .avatar-placeholder:hover,
  .content-card:hover,
  .content-card:hover .card-icon,
  .placeholder-content:hover {
    transform: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .about-hero,
  .content-card,
  .edit-hint {
    border-width: 2px;
  }
  
  .content-card:hover,
  .placeholder-content:hover {
    border-color: currentColor;
  }
  
  .about-hero::after,
  .edit-hint::before {
    display: none;
  }
}

/* 打印样式 */
@media print {
  .about-hero::before,
  .about-hero::after,
  .content-card::after,
  .edit-hint::before,
  .placeholder-content::before {
    display: none;
  }
  
  .about-hero {
    background: white !important;
    color: black !important;
  }
  
  .content-card,
  .edit-hint {
    background: white !important;
    color: black !important;
    box-shadow: none !important;
    border: 1px solid #000 !important;
  }
}
</style>