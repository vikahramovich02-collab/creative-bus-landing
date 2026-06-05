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

// --- Кнопка «наверх» ---
const upBtn = document.querySelector('.footer__up');
if (upBtn) upBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// --- Маска телефона: +7 (9XX) XXX XX XX ---
const phoneInput = document.getElementById('f-phone');
if (phoneInput) {
  phoneInput.addEventListener('input', () => {
    let d = phoneInput.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ') ' + d.slice(4, 7);
    if (d.length >= 7) out += ' ' + d.slice(7, 9);
    if (d.length >= 9) out += ' ' + d.slice(9, 11);
    phoneInput.value = out;
  });
}

// --- Форма: валидация + заглушка отправки ---
const form = document.getElementById('lead-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name;
    const phone = form.elements.phone;
    const consent = form.elements.consent;
    let valid = true;

    [name, phone].forEach((el) => el.classList.remove('is-error'));

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
