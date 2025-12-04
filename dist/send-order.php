<?php
/**
 * ANDO JV - Order Email Notification
 * Sends order details to order@andojv.com
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

// Validate required fields
$required = ['orderNumber', 'customerName', 'customerEmail', 'customerPhone', 'address', 'items', 'totalAmount'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Missing field: $field"]);
        exit;
    }
}

// Sanitize data
$orderNumber = htmlspecialchars($data['orderNumber']);
$customerName = htmlspecialchars($data['customerName']);
$customerEmail = htmlspecialchars($data['customerEmail']);
$customerPhone = htmlspecialchars($data['customerPhone']);
$address = htmlspecialchars($data['address']);
$deliveryMethod = htmlspecialchars($data['deliveryMethod'] ?? 'Не указан');
$paymentMethod = htmlspecialchars($data['paymentMethod'] ?? 'Не указан');
$notes = htmlspecialchars($data['notes'] ?? '');
$totalAmount = number_format((float)$data['totalAmount'], 0, '', ' ');
$items = $data['items'];

// Build items HTML
$itemsHtml = '';
foreach ($items as $item) {
    $itemName = htmlspecialchars($item['name']);
    $itemSize = htmlspecialchars($item['size'] ?? '-');
    $itemColor = htmlspecialchars($item['color'] ?? '-');
    $itemQty = (int)$item['quantity'];
    $itemPrice = number_format((float)$item['price'], 0, '', ' ');

    $itemsHtml .= "
    <tr>
        <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$itemName}</td>
        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>{$itemSize}</td>
        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>{$itemQty}</td>
        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>{$itemPrice} RUB</td>
    </tr>";
}

// Email content
$to = 'order@andojv.com';
$subject = "=?UTF-8?B?" . base64_encode("Новый заказ #{$orderNumber}") . "?=";

$message = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;'>
    <div style='background: #000; color: #fff; padding: 20px; text-align: center;'>
        <h1 style='margin: 0; letter-spacing: 3px;'>ANDO JV</h1>
    </div>

    <div style='padding: 30px 20px;'>
        <h2 style='color: #000; margin-bottom: 20px;'>Новый заказ #{$orderNumber}</h2>

        <div style='background: #f9f9f9; padding: 20px; margin-bottom: 20px;'>
            <h3 style='margin-top: 0;'>Данные клиента:</h3>
            <p><strong>Имя:</strong> {$customerName}</p>
            <p><strong>Email:</strong> {$customerEmail}</p>
            <p><strong>Телефон:</strong> {$customerPhone}</p>
            <p><strong>Адрес:</strong> {$address}</p>
        </div>

        <div style='background: #f9f9f9; padding: 20px; margin-bottom: 20px;'>
            <h3 style='margin-top: 0;'>Доставка и оплата:</h3>
            <p><strong>Способ доставки:</strong> {$deliveryMethod}</p>
            <p><strong>Способ оплаты:</strong> {$paymentMethod}</p>
            " . ($notes ? "<p><strong>Комментарий:</strong> {$notes}</p>" : "") . "
        </div>

        <h3>Состав заказа:</h3>
        <table style='width: 100%; border-collapse: collapse;'>
            <thead>
                <tr style='background: #000; color: #fff;'>
                    <th style='padding: 10px; text-align: left;'>Товар</th>
                    <th style='padding: 10px; text-align: center;'>Размер</th>
                    <th style='padding: 10px; text-align: center;'>Кол-во</th>
                    <th style='padding: 10px; text-align: right;'>Цена</th>
                </tr>
            </thead>
            <tbody>
                {$itemsHtml}
            </tbody>
        </table>

        <div style='margin-top: 20px; padding: 15px; background: #000; color: #fff; text-align: right;'>
            <strong style='font-size: 18px;'>ИТОГО: {$totalAmount} RUB</strong>
        </div>

        <p style='margin-top: 30px; font-size: 12px; color: #666;'>
            Это автоматическое уведомление с сайта andojv.com
        </p>
    </div>
</body>
</html>
";

// Email headers
$headers = [
    'MIME-Version: 1.0',
    'Content-type: text/html; charset=UTF-8',
    'From: ANDO JV <noreply@andojv.com>',
    'Reply-To: ' . $customerEmail,
    'X-Mailer: PHP/' . phpversion()
];

// Send email
$sent = mail($to, $subject, $message, implode("\r\n", $headers));

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Order notification sent']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send email']);
}
