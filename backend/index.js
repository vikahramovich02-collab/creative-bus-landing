/**
 * Приём заявок с сайта Creative Bus → письмо на почту.
 * Разворачивается как функция в Яндекс.Облаке (Node.js 18).
 * Данные не покидают РФ — требование ч. 5 ст. 18 152-ФЗ.
 *
 * Переменные окружения функции:
 *   SMTP_HOST  — smtp.mail.ru
 *   SMTP_PORT  — 465
 *   SMTP_USER  — ra-taganrog@mail.ru
 *   SMTP_PASS  — пароль внешнего приложения (НЕ пароль от почты)
 *   MAIL_TO    — куда слать заявки (можно несколько через запятую)
 *   ALLOW_ORIGIN — https://vikahramovich02-collab.github.io
 */
const nodemailer = require('nodemailer');

const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

exports.handler = async (event) => {
  const origin = process.env.ALLOW_ORIGIN || '*';
  const cors = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  let data = {};
  try {
    data = JSON.parse(event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'bad json' }) };
  }

  // honeypot: боты заполняют скрытое поле, люди — нет
  if (data.website) return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };

  const name = String(data.name || '').trim().slice(0, 100);
  const phone = String(data.phone || '').trim().slice(0, 30);
  const email = String(data.email || '').trim().slice(0, 100);
  const comment = String(data.comment || '').trim().slice(0, 2000);

  if (name.length < 2 || phone.replace(/\D/g, '').length !== 11) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'bad fields' }) };
  }
  if (!data.consent) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'no consent' }) };
  }

  const when = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  const html = `
    <h2 style="margin:0 0 16px;font:600 20px/1.3 Arial,sans-serif;color:#182238">Заявка с сайта Creative Bus</h2>
    <table style="border-collapse:collapse;font:14px/1.5 Arial,sans-serif;color:#0F172A">
      <tr><td style="padding:6px 16px 6px 0;color:#64748B">Имя</td><td><b>${esc(name)}</b></td></tr>
      <tr><td style="padding:6px 16px 6px 0;color:#64748B">Телефон</td><td><a href="tel:${esc(phone)}">${esc(phone)}</a></td></tr>
      ${email ? `<tr><td style="padding:6px 16px 6px 0;color:#64748B">Почта</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>` : ''}
      ${comment ? `<tr><td style="padding:6px 16px 6px 0;color:#64748B;vertical-align:top">Сообщение</td><td>${esc(comment).replace(/\n/g, '<br>')}</td></tr>` : ''}
      <tr><td style="padding:6px 16px 6px 0;color:#64748B">Страница</td><td>${esc(data.page || '/')}</td></tr>
      <tr><td style="padding:6px 16px 6px 0;color:#64748B">Время</td><td>${when} (МСК)</td></tr>
      <tr><td style="padding:6px 16px 6px 0;color:#64748B">Согласие на ОПД</td><td>дано ${esc(data.consentAt || when)}</td></tr>
    </table>`;

  const tr = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mail.ru',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await tr.sendMail({
      from: `"Сайт Creative Bus" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO || process.env.SMTP_USER,
      replyTo: email || undefined,
      subject: `Заявка с сайта — ${name}, ${phone}`,
      html,
      text: `Заявка с сайта Creative Bus\nИмя: ${name}\nТелефон: ${phone}\nПочта: ${email || '—'}\nСообщение: ${comment || '—'}\nСтраница: ${data.page || '/'}\nВремя: ${when} МСК\nСогласие на ОПД: дано`,
    });
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('sendMail failed:', e.message);
    return { statusCode: 502, headers: cors, body: JSON.stringify({ ok: false }) };
  }
};
