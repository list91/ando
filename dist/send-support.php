<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get JSON data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

$name = isset($data['name']) ? trim($data['name']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$message = isset($data['message']) ? trim($data['message']) : '';

if (empty($name) || empty($email) || empty($message)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit();
}

// Email settings
$to = 's_anufriev@list.ru'; // TODO: Change to info@andojv.com for production
$subject = 'Новый вопрос от покупателя - ANDO JV';

$body = "
Новый вопрос от покупателя на сайте ANDO JV

👤 Имя: $name
📧 Email: $email

💬 Сообщение:
$message

---
Ответьте напрямую на $email
";

$headers = [
    'From: noreply@andojv.com',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion()
];

$result = mail($to, $subject, $body, implode("\r\n", $headers));

if ($result) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to send email']);
}
