const envelope = document.getElementById('envelope');
const envelopeSvg = document.getElementById('envelope-svg');
const letterButton = document.getElementById('letter');

const cfg = window.LOVE_LETTER_CONFIG || {};
const recipientName = cfg.recipientName || 'Pen';
const title = cfg.title || 'Dear';
const message = Array.isArray(cfg.message) ? cfg.message : ['...'];
const signature = cfg.signature || '';
const peekLineCount = Number.isFinite(cfg.peekLineCount) ? cfg.peekLineCount : 11;

let isOpen = false;
let isExpanded = false;

function renderCollapsedPaper() {
  const spans = Array.from({ length: Math.max(4, peekLineCount) }, () => '<span></span>').join('');
  letterButton.innerHTML = `
    <div class="paper">
      <div class="paper-body">
        <div class="peek-lines" aria-hidden="true">
          ${spans}
        </div>
      </div>
    </div>
  `;
}

function renderExpandedPaper() {
  const paragraphs = message
    .map((p) => `<p>${String(p).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('');
  const sig = signature
    ? `<p class="signature">${String(signature).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
    : '';

  letterButton.innerHTML = `
    <div class="paper">
      <div class="paper-body">
        <h2>${title} ${recipientName},</h2>
        ${paragraphs}
        ${sig}
      </div>
    </div>
  `;
}

envelopeSvg.addEventListener('click', () => {
  // Toggle: closed -> open, open -> close (letter slides back in)
  if (!isOpen) {
    envelope.classList.add('is-open');
    isOpen = true;
    return;
  }

  // If expanded, collapse first so it animates back toward the envelope
  if (isExpanded) {
    envelope.classList.remove('is-expanded');
    isExpanded = false;
    window.setTimeout(renderCollapsedPaper, 80);
    window.setTimeout(() => {
      envelope.classList.remove('is-open');
      isOpen = false;
    }, 420);
    return;
  }

  envelope.classList.remove('is-open');
  isOpen = false;
});

letterButton.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!isOpen) return;

  if (!isExpanded) {
    envelope.classList.add('is-expanded');
    isExpanded = true;
    window.setTimeout(renderExpandedPaper, 80);
    return;
  }

  envelope.classList.remove('is-expanded');
  isExpanded = false;
  window.setTimeout(renderCollapsedPaper, 80);
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!isExpanded) return;
  envelope.classList.remove('is-expanded');
  isExpanded = false;
  window.setTimeout(renderCollapsedPaper, 80);
});

renderCollapsedPaper();
