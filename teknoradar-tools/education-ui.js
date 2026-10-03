/* education-ui.js — TeknoRadar Tools
   Tekrar kullanılabilir, modüler eğitim katmanı render fonksiyonları. */

window.EducationUI = (() => {
  let activeMode = 'simple'; // 'simple' | 'technical'

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderToolEducation(toolId, container) {
    if (!container) return;
    const edu = window.TOOL_EDUCATION && window.TOOL_EDUCATION[toolId];
    if (!edu) {
      container.innerHTML = '';
      return;
    }

    const hub = document.createElement('div');
    hub.className = 'edu-hub';

    // Üst Başlık ve Basit/Teknik Toggle
    const header = document.createElement('div');
    header.className = 'edu-hub__header';
    header.innerHTML = `
      <div class="edu-hub__title">📖 Teknoloji &amp; Çalışma Mantığı</div>
      <div class="edu-toggle" id="eduModeToggle">
        <button type="button" class="edu-toggle__btn ${activeMode === 'simple' ? 'is-active' : ''}" data-mode="simple">💡 Basit Anlatım</button>
        <button type="button" class="edu-toggle__btn ${activeMode === 'technical' ? 'is-active' : ''}" data-mode="technical">⚙️ Teknik Anlatım</button>
      </div>
    `;

    // 1. "Bu araç nedir?"
    const cardWhat = document.createElement('details');
    cardWhat.className = 'edu-card';
    cardWhat.open = true; // Varsayılan olarak açık
    cardWhat.innerHTML = `
      <summary class="edu-summary">
        <div class="edu-summary__title">
          <span class="edu-summary__icon">📖</span>
          <span>Bu Araç Nedir?</span>
        </div>
        <svg class="edu-summary__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </summary>
      <div class="edu-body">
        <p id="eduWhatText">${escapeHtml(activeMode === 'simple' ? edu.whatSimple : edu.whatTechnical)}</p>
      </div>
    `;

    // 2. "Ne işe yarar?"
    const cardPurpose = document.createElement('details');
    cardPurpose.className = 'edu-card';
    const purposeItems = (edu.purpose || []).map(p => `<li class="edu-list__item">${escapeHtml(p)}</li>`).join('');
    cardPurpose.innerHTML = `
      <summary class="edu-summary">
        <div class="edu-summary__title">
          <span class="edu-summary__icon">🎯</span>
          <span>Ne İşe Yarar? Hangi Durumlarda Kullanılır?</span>
        </div>
        <svg class="edu-summary__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </summary>
      <div class="edu-body">
        <ul class="edu-list">${purposeItems}</ul>
      </div>
    `;

    // 3. "Nasıl çalışır?" (Adım adım görsel akış)
    const cardHow = document.createElement('details');
    cardHow.className = 'edu-card';
    let flowHtml = '';
    if (edu.how && edu.how.length) {
      edu.how.forEach((step, idx) => {
        flowHtml += `
          <div class="flow-step">
            <div class="flow-step__number">${idx + 1}</div>
            <div class="flow-step__content">
              <div class="flow-step__title">${escapeHtml(step.title)}</div>
              <div class="flow-step__desc">${escapeHtml(step.desc)}</div>
            </div>
          </div>
        `;
        if (idx < edu.how.length - 1) {
          flowHtml += `<div class="flow-arrow">↓</div>`;
        }
      });
    }
    cardHow.innerHTML = `
      <summary class="edu-summary">
        <div class="edu-summary__title">
          <span class="edu-summary__icon">⚙️</span>
          <span>Nasıl Çalışır? (Adım Adım Süreç)</span>
        </div>
        <svg class="edu-summary__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </summary>
      <div class="edu-body">
        <div class="flow-container">${flowHtml}</div>
      </div>
    `;

    // 4. "Örnek"
    const cardExample = document.createElement('details');
    cardExample.className = 'edu-card';
    const ex = edu.example || { input: '', process: '', output: '' };
    cardExample.innerHTML = `
      <summary class="edu-summary">
        <div class="edu-summary__title">
          <span class="edu-summary__icon">🧪</span>
          <span>Örnek İnceleme</span>
        </div>
        <svg class="edu-summary__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </summary>
      <div class="edu-body">
        <div class="edu-example">
          <div class="edu-example__block">
            <div class="edu-example__label">Girdi (Input)</div>
            <pre class="edu-example__val">${escapeHtml(ex.input)}</pre>
          </div>
          <div class="edu-example__block">
            <div class="edu-example__label">İşlem &amp; Algoritma (Process)</div>
            <div class="edu-example__val" style="font-family:var(--font);">${escapeHtml(ex.process)}</div>
          </div>
          <div class="edu-example__block">
            <div class="edu-example__label">Sonuç (Output)</div>
            <pre class="edu-example__val">${escapeHtml(ex.output)}</pre>
          </div>
        </div>
      </div>
    `;

    // 5. "İpuçları & Güvenlik"
    const cardTips = document.createElement('details');
    cardTips.className = 'edu-card';
    const tipsHtml = (edu.tips || []).map(tip => `
      <div class="edu-tip-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        <span>${escapeHtml(tip)}</span>
      </div>
    `).join('');
    cardTips.innerHTML = `
      <summary class="edu-summary">
        <div class="edu-summary__title">
          <span class="edu-summary__icon">💡</span>
          <span>Önemli İpuçları &amp; Dikkat Edilecekler</span>
        </div>
        <svg class="edu-summary__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </summary>
      <div class="edu-body">
        <div class="edu-tips">${tipsHtml}</div>
      </div>
    `;

    // Toggle olayları
    header.querySelectorAll('.edu-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMode = btn.dataset.mode;
        header.querySelectorAll('.edu-toggle__btn').forEach(b => b.classList.toggle('is-active', b.dataset.mode === activeMode));
        const whatText = cardWhat.querySelector('#eduWhatText');
        if (whatText) {
          whatText.textContent = activeMode === 'simple' ? edu.whatSimple : edu.whatTechnical;
        }
      });
    });

    hub.appendChild(header);
    hub.appendChild(cardWhat);
    hub.appendChild(cardPurpose);
    hub.appendChild(cardHow);
    hub.appendChild(cardExample);
    hub.appendChild(cardTips);

    container.innerHTML = '';
    container.appendChild(hub);
  }

  return { renderToolEducation };
})();
