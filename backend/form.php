<?php
/**
 * Приём заявок с сайта Creative Bus → письмо на почту.
 * Кладётся в корень сайта на обычный хостинг с PHP.
 * В js/script.js прописать: const FORM_ENDPOINT = '/backend/form.php';
 *
 * Данные никуда, кроме вашей почты, не уходят — требование ч. 5 ст. 18 152-ФЗ.
 */

// ── настройки ───────────────────────────────────────────────
$MAIL_TO     = 'ra-taganrog@mail.ru';     // куда слать заявки
$MAIL_FROM   = 'site@agvtrans.ru';        // ящик на вашем домене (создаётся в панели хостинга)
$SITE_NAME   = 'Creative Bus';
$ALLOW_ORIGIN = '*';                      // после переезда укажите 'https://agvtrans.ru'
// ────────────────────────────────────────────────────────────

header('Access-Control-Allow-Origin: ' . $ALLOW_ORIGIN);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { http_response_code(405); echo '{"ok":false}'; exit; }

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); echo '{"ok":false,"error":"bad json"}'; exit; }

// боты заполняют скрытое поле, люди — нет
if (!empty($data['website'])) { echo '{"ok":true}'; exit; }

$name    = mb_substr(trim($data['name']    ?? ''), 0, 100);
$phone   = mb_substr(trim($data['phone']   ?? ''), 0, 30);
$email   = mb_substr(trim($data['email']   ?? ''), 0, 100);
$comment = mb_substr(trim($data['comment'] ?? ''), 0, 2000);
$page    = mb_substr(trim($data['page']    ?? '/'), 0, 200);

if (mb_strlen($name) < 2 || strlen(preg_replace('/\D/', '', $phone)) !== 11) {
    http_response_code(400); echo '{"ok":false,"error":"bad fields"}'; exit;
}
if (empty($data['consent'])) {
    http_response_code(400); echo '{"ok":false,"error":"no consent"}'; exit;
}

$e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$when = (new DateTime('now', new DateTimeZone('Europe/Moscow')))->format('d.m.Y H:i');

$rows = [
    ['Имя',    '<b>' . $e($name) . '</b>'],
    ['Телефон', '<a href="tel:' . $e($phone) . '">' . $e($phone) . '</a>'],
];
if ($email)   $rows[] = ['Почта', '<a href="mailto:' . $e($email) . '">' . $e($email) . '</a>'];
if ($comment) $rows[] = ['Сообщение', nl2br($e($comment))];
$rows[] = ['Страница', $e($page)];
$rows[] = ['Время', $when . ' (МСК)'];
$rows[] = ['Согласие на ОПД', 'дано ' . $e($data['consentAt'] ?? $when)];

$html = '<h2 style="margin:0 0 16px;font:600 20px/1.3 Arial,sans-serif;color:#182238">Заявка с сайта ' . $SITE_NAME . '</h2>'
      . '<table style="border-collapse:collapse;font:14px/1.5 Arial,sans-serif;color:#0F172A">';
foreach ($rows as [$k, $v]) {
    $html .= '<tr><td style="padding:6px 16px 6px 0;color:#64748B;vertical-align:top">' . $k . '</td><td>' . $v . '</td></tr>';
}
$html .= '</table>';

$headers  = 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";
$headers .= 'From: ' . mb_encode_mimeheader('Сайт ' . $SITE_NAME) . ' <' . $MAIL_FROM . '>' . "\r\n";
if ($email) $headers .= 'Reply-To: ' . $email . "\r\n";

$subject = mb_encode_mimeheader('Заявка с сайта — ' . $name . ', ' . $phone, 'UTF-8');

if (mail($MAIL_TO, $subject, $html, $headers)) {
    echo '{"ok":true}';
} else {
    error_log('Creative Bus: письмо не отправлено, заявка от ' . $name . ' ' . $phone);
    http_response_code(502);
    echo '{"ok":false}';
}
