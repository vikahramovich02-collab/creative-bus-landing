// ===== Creative Bus — лендинг =====

// --- Аккордеоны (услуги + FAQ) ---
document.querySelectorAll('[data-accordion]').forEach((list) => {
  list.addEventListener('click', (e) => {
    const head = e.target.closest('.accordion__head, .faq__head');
    if (!head) return;
    const item = head.parentElement;
    const wasOpen = item.classList.contains('is-open');
    // одна открытая группа на аккордеон
    list.querySelectorAll('.is-open').forEach((el) => {
      el.classList.remove('is-open');
      const b = el.querySelector('.accordion__head, .faq__head');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('is-open');
      head.setAttribute('aria-expanded', 'true');
    }
  });
});

// --- Мобильное меню ---
const burger = document.querySelector('.header__burger');
if (burger) {
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.header__nav a').forEach((a) =>
    a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    })
  );
}

// --- Карусель «О нас» ---
const aboutSlider = document.querySelector('[data-about-slider]');
if (aboutSlider) {
  const slides = Array.from(aboutSlider.querySelectorAll('.about__slide'));
  let idx = 0;
  const show = (n) => {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
  };
  const about = aboutSlider.closest('.about');
  about.querySelector('.about__arrow--prev').addEventListener('click', () => show(idx - 1));
  about.querySelector('.about__arrow--next').addEventListener('click', () => show(idx + 1));
}

// --- Фильтрация кейсов (cases.html) ---
const filterBar = document.querySelector('.cases-page__filters');
if (filterBar) {
  const cards = document.querySelectorAll('.case-card');
  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    filterBar.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const f = chip.dataset.filter;
    cards.forEach((card) => card.classList.toggle('is-hidden', f !== 'all' && card.dataset.cat !== f));
  });
}

// --- Лайтбокс для кейсов ---
(() => {
  const cards = Array.from(document.querySelectorAll('.case-card, .cases__card'));
  if (!cards.length) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML =
    '<button class="lightbox__close" aria-label="Закрыть">✕</button>' +
    '<button class="lightbox__nav lightbox__nav--prev" aria-label="Предыдущее фото">←</button>' +
    '<figure class="lightbox__body"><img alt=""><figcaption></figcaption></figure>' +
    '<button class="lightbox__nav lightbox__nav--next" aria-label="Следующее фото">→</button>';
  document.body.appendChild(lb);

  const img = lb.querySelector('img');
  const cap = lb.querySelector('figcaption');
  let current = 0;

  const visibleCards = () => cards.filter((c) => !c.classList.contains('is-hidden'));

  const open = (card) => {
    const list = visibleCards();
    current = list.indexOf(card);
    render();
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  const render = () => {
    const list = visibleCards();
    const card = list[current];
    if (!card) return;
    const src = card.querySelector('img').src;
    img.src = src;
    const route = card.querySelector('.case-card__route');
    const cat = card.querySelector('.case-card__cat');
    cap.textContent = cat ? `${cat.textContent} · ${route ? route.textContent : ''}` : (card.querySelector('img').alt || '');
  };
  const close = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  };
  const step = (d) => {
    const list = visibleCards();
    current = (current + d + list.length) % list.length;
    render();
  };

  cards.forEach((card) => {
    card.style.cursor = 'zoom-in';
    card.addEventListener('click', () => open(card));
  });
  lb.querySelector('.lightbox__close').addEventListener('click', close);
  lb.querySelector('.lightbox__nav--prev').addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  lb.querySelector('.lightbox__nav--next').addEventListener('click', (e) => { e.stopPropagation(); step(1); });
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
})();

// --- Кнопка «наверх» ---
const upBtn = document.querySelector('.footer__up');
if (upBtn) upBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// --- Лид-форма: маска телефона, валидация, заглушка отправки ---
function initLeadForm(form) {
  const phone = form.querySelector('input[name="phone"]');
  if (phone) {
    phone.addEventListener('input', () => {
      let d = phone.value.replace(/\D/g, '');
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      let out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ') ' + d.slice(4, 7);
      if (d.length >= 7) out += ' ' + d.slice(7, 9);
      if (d.length >= 9) out += ' ' + d.slice(9, 11);
      phone.value = out;
    });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name;
    const consent = form.elements.consent;
    let valid = true;

    [name, phone].forEach((el) => el && el.classList.remove('is-error'));

    if (name.value.trim().length < 2) { name.classList.add('is-error'); valid = false; }
    const digits = phone.value.replace(/\D/g, '');
    if (digits.length !== 11) { phone.classList.add('is-error'); valid = false; }
    if (!consent.checked) { consent.focus(); valid = false; }

    if (!valid) return;

    // TODO: подключить отправку (email / Telegram-бот), когда будут доступы
    console.log('Заявка:', {
      name: name.value.trim(),
      phone: phone.value,
      comment: form.elements.comment.value.trim(),
    });

    form.innerHTML = '<p class="form__success"><span>Спасибо!</span><br>Заявка отправлена — свяжемся с вами в течение рабочего дня.</p>';
  });
}
document.querySelectorAll('form.form').forEach(initLeadForm);

// --- Попап «Оставить заявку» ---
(() => {
  const FORM_HTML =
    '<input class="form__input" name="name" type="text" placeholder="ФИО*" required autocomplete="name">' +
    '<input class="form__input" name="phone" type="tel" placeholder="+7 (9XX) XXX XX XX*" required autocomplete="tel" inputmode="tel">' +
    '<textarea class="form__input form__input--area" name="comment" placeholder="Комментарий" rows="2"></textarea>' +
    '<label class="form__check"><input type="checkbox" name="consent" required><span>Согласен(а) на обработку персональных данных</span></label>' +
    '<button class="btn btn--dark form__submit" type="submit">Оставить заявку' +
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML =
    '<div class="modal__card">' +
    '<button class="modal__close" type="button" aria-label="Закрыть">✕</button>' +
    '<h3 class="modal__title">Оставить заявку</h3>' +
    '<p class="modal__sub">Менеджер свяжется в течение часа</p>' +
    '<form class="form form--modal" novalidate>' + FORM_HTML + '</form>' +
    '</div>';
  document.body.appendChild(modal);
  initLeadForm(modal.querySelector('form'));

  const open = () => { modal.classList.add('is-open'); document.body.style.overflow = 'hidden'; };
  const close = () => { modal.classList.remove('is-open'); document.body.style.overflow = ''; };

  modal.querySelector('.modal__close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });

  // все кнопки «Оставить заявку», кроме сабмитов форм, открывают попап
  document.querySelectorAll('a.btn, button.btn').forEach((btn) => {
    if (btn.closest('form') || btn.closest('.modal')) return;
    if (btn.textContent.trim().startsWith('Оставить заявку')) {
      btn.addEventListener('click', (e) => { e.preventDefault(); open(); });
    }
  });

  // диплинк: site.ru/#zayavka сразу открывает попап
  if (location.hash === '#zayavka') open();
})();
