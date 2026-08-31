<?php
require_once __DIR__ . '/../includes/auth.php';
require_role('pharmacy_admin');

$pdo = get_db();
$pharmacy = current_pharmacy();
$stockId = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare('DELETE FROM stock_entries WHERE stock_id = ? AND pharmacy_id = ?');
$stmt->execute([$stockId, $pharmacy['pharmacy_id']]);

flash('success', 'Medicine removed from stock.');
header('Location: ' . base_url('pharmacy/dashboard.php'));
exit;
