(function () {
  const mount = document.getElementById('site-nav');
  if (!mount) return;

  const page = document.body.getAttribute('data-nav') || 'home';
  const resumeHref = 'https://github.com/bplee/bplee.github.io/raw/master/files/cv.pdf';
  
  // Detect if we're in a subdirectory (articles/)
  const isSubdir = window.location.pathname.includes('/articles/');
  const homeHref = isSubdir ? '../' : './';
  const wanderHref = isSubdir ? '../wander/' : 'wander/';
  const cvHref = isSubdir ? '../cv.html' : 'cv.html';
  const projectsHref = isSubdir ? '../#projects' : '#projects';
  const writingHref = isSubdir ? '../#writing' : '#writing';
  const contactHref = isSubdir ? '../#contact' : '#contact';

  function renderNav() {
    if (page === 'cv') {
      mount.innerHTML = `
        <nav class="cv-nav">
          <a href="index.html" class="nav-back">← back</a>
          <span class="nav-logo">李毘安 · cv</span>
          <div class="cv-nav-actions">
            <a href="${resumeHref}" target="_blank" rel="noopener" class="nav-resume">resume ↗</a>
            <div class="theme-switcher">
              <button class="theme-btn" id="themeBtn" aria-label="Change theme">
                <div class="theme-btn-dots" id="themeBtnDots">
                  <span style="background:#0a0c0f;border:0.5px solid #333;"></span>
                  <span style="background:#fafaf8;border:0.5px solid #ccc;"></span>
                  <span style="background:#0c0c0c;border:0.5px solid #222;"></span>
                  <span style="background:#ffffff;border:0.5px solid #ddd;"></span>
                </div>
                theme
              </button>
              <div class="theme-panel" id="themePanel">
                <div class="theme-panel-label">Choose a theme</div>
                <div class="theme-axis">
                  <span>← dark</span>
                  <span>light →</span>
                </div>
                <div class="theme-grid">
                  <button class="theme-option active" data-theme="dark-expressive" onclick="setTheme('dark-expressive', this)">
                    <div class="theme-swatch swatch-de"></div>
                    <div class="theme-name"><strong>Expressive</strong>dark</div>
                  </button>
                  <button class="theme-option" data-theme="light-expressive" onclick="setTheme('light-expressive', this)">
                    <div class="theme-swatch swatch-le"></div>
                    <div class="theme-name"><strong>Expressive</strong>light</div>
                  </button>
                  <button class="theme-option" data-theme="dark-minimal" onclick="setTheme('dark-minimal', this)">
                    <div class="theme-swatch swatch-dm"></div>
                    <div class="theme-name"><strong>Minimal</strong>dark</div>
                  </button>
                  <button class="theme-option" data-theme="light-minimal" onclick="setTheme('light-minimal', this)">
                    <div class="theme-swatch swatch-lm"></div>
                    <div class="theme-name"><strong>Minimal</strong>light</div>
                  </button>
                </div>
                <div class="theme-axis" style="justify-content:space-between; padding: 6px 2px 0;">
                  <span>expressive ↑</span>
                  <span>↓ minimal</span>
                </div>
              </div>
            </div>
          </div>
        </nav>
      `;
      return;
    }

    // Default home nav (works for both root and subdirectories)
    mount.innerHTML = `
      <nav>
        <div class="nav-brand">
          <a href="${homeHref}" class="nav-logo">李毘安</a>
          <span class="nav-divider">|</span>
          <a href="${wanderHref}" class="nav-wander">wander</a>
        </div>
        <ul class="nav-links">
          <li><a href="${projectsHref}">projects</a></li>
          <li><a href="${writingHref}">writing</a></li>
          <li><a href="${contactHref}">contact</a></li>
          <li><a href="${cvHref}">cv</a></li>
          <li><a href="${resumeHref}" target="_blank" rel="noopener" class="nav-resume">resume ↗</a></li>
          <li>
            <div class="theme-switcher">
              <button class="theme-btn" id="themeBtn" aria-label="Change theme">
                <div class="theme-btn-dots" id="themeBtnDots">
                  <span style="background:#0a0c0f;border:0.5px solid #333;"></span>
                  <span style="background:#fafaf8;border:0.5px solid #ccc;"></span>
                  <span style="background:#0c0c0c;border:0.5px solid #222;"></span>
                  <span style="background:#ffffff;border:0.5px solid #ddd;"></span>
                </div>
                theme
              </button>
              <div class="theme-panel" id="themePanel">
                <div class="theme-panel-label">Choose a theme</div>
                <div class="theme-axis">
                  <span>← dark</span>
                  <span>light →</span>
                </div>
                <div class="theme-grid">
                  <button class="theme-option active" data-theme="dark-expressive" onclick="setTheme('dark-expressive', this)">
                    <div class="theme-swatch swatch-de"></div>
                    <div class="theme-name"><strong>Expressive</strong>dark</div>
                  </button>
                  <button class="theme-option" data-theme="light-expressive" onclick="setTheme('light-expressive', this)">
                    <div class="theme-swatch swatch-le"></div>
                    <div class="theme-name"><strong>Expressive</strong>light</div>
                  </button>
                  <button class="theme-option" data-theme="dark-minimal" onclick="setTheme('dark-minimal', this)">
                    <div class="theme-swatch swatch-dm"></div>
                    <div class="theme-name"><strong>Minimal</strong>dark</div>
                  </button>
                  <button class="theme-option" data-theme="light-minimal" onclick="setTheme('light-minimal', this)">
                    <div class="theme-swatch swatch-lm"></div>
                    <div class="theme-name"><strong>Minimal</strong>light</div>
                  </button>
                </div>
                <div class="theme-axis" style="justify-content:space-between; padding: 6px 2px 0;">
                  <span>expressive ↑</span>
                  <span>↓ minimal</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    `;
  }

  renderNav();
})();
