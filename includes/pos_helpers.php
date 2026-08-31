<?php
/**
 * PharmaTrack — Point of Sale (POS) & Billing Helper Library
 * Handles automatic database schema creation, sales transactions,
 * stock decrementing, receipt generation, sales analytics, and email billing.
 */

require_once __DIR__ . '/auth.php';

/**
 * Ensures POS database tables (invoices, invoice_items) exist
 * and have the customer_email column.
 */
function ensure_pos_schema(PDO $pdo): void {
    static $schemaChecked = false;
    if ($schemaChecked) return;

    $sql = "
    CREATE TABLE IF NOT EXISTS invoices (
        invoice_id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        pharmacy_id INT NOT NULL,
        customer_name VARCHAR(150) NOT NULL DEFAULT 'Walk-in Customer',
        customer_phone VARCHAR(15) NULL,
        customer_email VARCHAR(150) NULL,
        doctor_name VARCHAR(150) NULL,
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        payment_method ENUM('cash', 'upi', 'card') NOT NULL DEFAULT 'cash',
        payment_status ENUM('paid', 'unpaid') NOT NULL DEFAULT 'paid',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pharmacy_created (pharmacy_id, created_at)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS invoice_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        stock_id INT NULL,
        medicine_name VARCHAR(150) NOT NULL,
        generic_name VARCHAR(150) NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_price DECIMAL(10,2) NOT NULL,
        INDEX idx_invoice_id (invoice_id)
    ) ENGINE=InnoDB;
    ";

    try {
        $pdo->exec($sql);
        
        // Dynamically add customer_email if table already existed without it
        try {
            $pdo->exec("ALTER TABLE invoices ADD COLUMN customer_email VARCHAR(150) NULL AFTER customer_phone");
        } catch (Exception $colEx) {
            // Column already exists
        }

        $schemaChecked = true;
    } catch (Exception $e) {
        // Schema error or table already exists
    }
}

/**
 * Generates a unique, professional sequential invoice number.
 * e.g., INV-P1-20260830-0001
 */
function generate_invoice_number(PDO $pdo, int $pharmacyId): string {
    ensure_pos_schema($pdo);
    $datePrefix = date('Ymd');
    $prefix = "INV-P{$pharmacyId}-$datePrefix-";

    $stmt = $pdo->prepare("SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY invoice_id DESC LIMIT 1");
    $stmt->execute([$prefix . "%"]);
    $lastInvoice = $stmt->fetchColumn();

    $seq = 1;
    if ($lastInvoice) {
        $parts = explode('-', $lastInvoice);
        $lastSeq = (int)end($parts);
        $seq = $lastSeq + 1;
    }

    // Loop until an unused unique invoice number is verified
    do {
        $candidate = sprintf("INV-P%d-%s-%04d", $pharmacyId, $datePrefix, $seq);
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM invoices WHERE invoice_number = ?");
        $checkStmt->execute([$candidate]);
        $exists = ((int)$checkStmt->fetchColumn()) > 0;
        if ($exists) {
            $seq++;
        }
    } while ($exists);

    return $candidate;
}

/**
 * Processes a complete POS checkout transaction:
 * - Inserts invoice record (with customer email)
 * - Inserts line items
 * - Deducts quantities from stock_entries
 * 
 * @return int Created invoice_id
 * @throws Exception On validation or stock insufficiency error
 */
function create_sale_invoice(
    PDO $pdo,
    int $pharmacyId,
    array $customerData,
    array $items,
    array $billingData
): int {
    ensure_pos_schema($pdo);

    if (empty($items)) {
        throw new Exception("Cannot process sale with an empty bill.");
    }

    $pdo->beginTransaction();

    try {
        $subtotal = 0.0;
        $validatedItems = [];

        // 1. Verify stock availability and compute verified line totals
        foreach ($items as $item) {
            $stockId = (int)($item['stock_id'] ?? 0);
            $qty = (int)($item['quantity'] ?? 1);

            if ($qty <= 0) {
                throw new Exception("Invalid quantity specified for item.");
            }

            $stmt = $pdo->prepare("SELECT * FROM stock_entries WHERE stock_id = ? AND pharmacy_id = ? FOR UPDATE");
            $stmt->execute([$stockId, $pharmacyId]);
            $stock = $stmt->fetch();

            if (!$stock) {
                throw new Exception("Medicine item #{$stockId} was not found in inventory.");
            }

            if ((int)$stock['quantity'] < $qty) {
                throw new Exception("Insufficient stock for '{$stock['medicine_name']}'. Available: {$stock['quantity']}, Requested: {$qty}.");
            }

            $unitPrice = (float)$stock['price'];
            $lineTotal = round($unitPrice * $qty, 2);
            $subtotal += $lineTotal;

            $validatedItems[] = [
                'stock_id'      => $stockId,
                'medicine_name' => $stock['medicine_name'],
                'generic_name'  => $stock['generic_name'],
                'unit_price'    => $unitPrice,
                'quantity'      => $qty,
                'total_price'   => $lineTotal,
            ];
        }

        // 2. Compute discounts, taxes & grand total
        $subtotal = round($subtotal, 2);
        $discountPercent = max(0.0, min(100.0, (float)($billingData['discount_percent'] ?? 0.0)));
        $discountAmount = round(($subtotal * $discountPercent) / 100, 2);

        $afterDiscount = max(0.0, $subtotal - $discountAmount);
        $taxPercent = max(0.0, (float)($billingData['tax_percent'] ?? 0.0));
        $taxAmount = round(($afterDiscount * $taxPercent) / 100, 2);

        $totalAmount = round($afterDiscount + $taxAmount, 2);

        $invoiceNumber = generate_invoice_number($pdo, $pharmacyId);
        $customerName = trim($customerData['customer_name'] ?? '') ?: 'Walk-in Customer';
        $customerPhone = trim($customerData['customer_phone'] ?? '') ?: null;
        $customerEmail = trim($customerData['customer_email'] ?? '') ?: null;
        $doctorName = trim($customerData['doctor_name'] ?? '') ?: null;
        $paymentMethod = in_array($billingData['payment_method'] ?? '', ['cash', 'upi', 'card']) ? $billingData['payment_method'] : 'cash';
        $notes = trim($billingData['notes'] ?? '') ?: null;

        // 3. Insert into invoices table
        $stmt = $pdo->prepare("
            INSERT INTO invoices (
                invoice_number, pharmacy_id, customer_name, customer_phone, customer_email, doctor_name,
                subtotal, discount_percent, discount_amount, tax_percent, tax_amount,
                total_amount, payment_method, payment_status, notes
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, 'paid', ?
            )
        ");

        $stmt->execute([
            $invoiceNumber, $pharmacyId, $customerName, $customerPhone, $customerEmail, $doctorName,
            $subtotal, $discountPercent, $discountAmount, $taxPercent, $taxAmount,
            $totalAmount, $paymentMethod, $notes
        ]);

        $invoiceId = (int)$pdo->lastInsertId();

        // 4. Insert line items and deduct from stock_entries
        $itemStmt = $pdo->prepare("
            INSERT INTO invoice_items (
                invoice_id, stock_id, medicine_name, generic_name, unit_price, quantity, total_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $stockDeductStmt = $pdo->prepare("
            UPDATE stock_entries SET quantity = quantity - ? WHERE stock_id = ? AND pharmacy_id = ?
        ");

        foreach ($validatedItems as $vItem) {
            $itemStmt->execute([
                $invoiceId,
                $vItem['stock_id'],
                $vItem['medicine_name'],
                $vItem['generic_name'],
                $vItem['unit_price'],
                $vItem['quantity'],
                $vItem['total_price'],
            ]);

            $stockDeductStmt->execute([
                $vItem['quantity'],
                $vItem['stock_id'],
                $pharmacyId,
            ]);
        }

        $pdo->commit();
        return $invoiceId;

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Fetches invoice details along with line items and pharmacy info.
 */
function get_pharmacy_invoice(PDO $pdo, int $invoiceId, int $pharmacyId): ?array {
    ensure_pos_schema($pdo);

    $stmt = $pdo->prepare("
        SELECT i.*, p.pharmacy_name, p.address, p.locality, p.city, p.phone AS pharmacy_phone
        FROM invoices i
        JOIN pharmacies p ON p.pharmacy_id = i.pharmacy_id
        WHERE i.invoice_id = ? AND i.pharmacy_id = ?
    ");
    $stmt->execute([$invoiceId, $pharmacyId]);
    $invoice = $stmt->fetch();

    if (!$invoice) return null;

    $itemStmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY item_id ASC");
    $itemStmt->execute([$invoiceId]);
    $invoice['items'] = $itemStmt->fetchAll();

    return $invoice;
}

/**
 * Returns sales analytics for pharmacy dashboard.
 */
function get_pharmacy_sales_stats(PDO $pdo, int $pharmacyId): array {
    ensure_pos_schema($pdo);

    // Today's Sales
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total_amount), 0) AS today_sales, COUNT(*) AS today_count
        FROM invoices
        WHERE pharmacy_id = ? AND DATE(created_at) = CURDATE()
    ");
    $stmt->execute([$pharmacyId]);
    $today = $stmt->fetch() ?: ['today_sales' => 0, 'today_count' => 0];

    // This Month's Sales
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total_amount), 0) AS month_sales, COUNT(*) AS month_count
        FROM invoices
        WHERE pharmacy_id = ? AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
    ");
    $stmt->execute([$pharmacyId]);
    $month = $stmt->fetch() ?: ['month_sales' => 0, 'month_count' => 0];

    // Total Lifetime Sales
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total_amount), 0) AS total_sales, COUNT(*) AS total_invoices
        FROM invoices
        WHERE pharmacy_id = ?
    ");
    $stmt->execute([$pharmacyId]);
    $lifetime = $stmt->fetch() ?: ['total_sales' => 0, 'total_invoices' => 0];

    return [
        'today_sales'    => (float)$today['today_sales'],
        'today_count'    => (int)$today['today_count'],
        'month_sales'    => (float)$month['month_sales'],
        'month_count'    => (int)$month['month_count'],
        'total_sales'    => (float)$lifetime['total_sales'],
        'total_invoices' => (int)$lifetime['total_invoices'],
    ];
}

/**
 * Generates an elegant, mobile-responsive HTML email receipt template.
 */
function render_invoice_html_email(array $invoice): string {
    $dateStr = date('d M Y, h:i A', strtotime($invoice['created_at']));
    $subtotal = number_format((float)$invoice['subtotal'], 2);
    $discountAmt = number_format((float)$invoice['discount_amount'], 2);
    $taxAmt = number_format((float)$invoice['tax_amount'], 2);
    $totalAmt = number_format((float)$invoice['total_amount'], 2);

    $itemsRows = '';
    foreach ($invoice['items'] as $idx => $item) {
        $num = $idx + 1;
        $name = htmlspecialchars($item['medicine_name'], ENT_QUOTES, 'UTF-8');
        $generic = $item['generic_name'] ? '<div style="font-size:11px;color:#888;">' . htmlspecialchars($item['generic_name'], ENT_QUOTES, 'UTF-8') . '</div>' : '';
        $rate = number_format((float)$item['unit_price'], 2);
        $qty = (int)$item['quantity'];
        $lineTot = number_format((float)$item['total_price'], 2);

        $itemsRows .= "
        <tr style='border-bottom:1px solid #eeeeee;'>
            <td style='padding:10px 8px;font-size:13px;color:#666;'>{$num}</td>
            <td style='padding:10px 8px;font-size:13px;color:#333;font-weight:bold;'>{$name}{$generic}</td>
            <td style='padding:10px 8px;font-size:13px;text-align:right;color:#555;'>₹{$rate}</td>
            <td style='padding:10px 8px;font-size:13px;text-align:center;font-weight:bold;color:#333;'>{$qty}</td>
            <td style='padding:10px 8px;font-size:13px;text-align:right;font-weight:bold;color:#0E5C52;'>₹{$lineTot}</td>
        </tr>
        ";
    }

    $discountRow = '';
    if ((float)$invoice['discount_amount'] > 0) {
        $discountRow = "
        <tr>
            <td style='padding:4px 0;font-size:13px;color:#C0392B;'>Discount ({$invoice['discount_percent']}%):</td>
            <td style='padding:4px 0;font-size:13px;text-align:right;color:#C0392B;font-weight:bold;'>- ₹{$discountAmt}</td>
        </tr>
        ";
    }

    $taxRow = '';
    if ((float)$invoice['tax_amount'] > 0) {
        $taxRow = "
        <tr>
            <td style='padding:4px 0;font-size:13px;color:#666;'>GST / Tax ({$invoice['tax_percent']}%):</td>
            <td style='padding:4px 0;font-size:13px;text-align:right;color:#666;font-weight:bold;'>+ ₹{$taxAmt}</td>
        </tr>
        ";
    }

    $doctorRow = '';
    if (!empty($invoice['doctor_name'])) {
        $docClean = preg_replace('/^dr\.?\s+/i', '', trim($invoice['doctor_name']));
        $doctorRow = "<div style='font-size:12px;color:#666;margin-top:2px;'>Doctor: <strong>Dr. " . htmlspecialchars($docClean, ENT_QUOTES, 'UTF-8') . "</strong></div>";
    }

    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <title>Receipt {$invoice['invoice_number']}</title>
    </head>
    <body style='margin:0;padding:20px;background-color:#FAF8F3;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;color:#1E2A28;'>
        <div style='max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);border:1px solid #e2ece9;'>
            
            <!-- Brand Header -->
            <div style='background:linear-gradient(135deg, #0E5C52 0%, #147C6D 100%);padding:24px;text-align:center;color:#ffffff;'>
                <h1 style='margin:0 0 4px 0;font-size:22px;color:#ffffff;'>{$invoice['pharmacy_name']}</h1>
                <div style='font-size:13px;color:rgba(255,255,255,0.85);'>
                    {$invoice['address']}, {$invoice['locality']}, {$invoice['city']}
                </div>
                <div style='font-size:13px;color:rgba(255,255,255,0.85);margin-top:2px;'>
                    Phone: {$invoice['pharmacy_phone']}
                </div>
                <div style='display:inline-block;background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:bold;letter-spacing:0.5px;margin-top:10px;'>
                    OFFICIAL MEDICAL RECEIPT
                </div>
            </div>

            <!-- Receipt Meta -->
            <div style='padding:20px;border-bottom:1px solid #edf4f2;background:#fcfdfd;'>
                <table style='width:100%;border-collapse:collapse;'>
                    <tr>
                        <td style='vertical-align:top;font-size:13px;'>
                            <div>Invoice: <strong style='color:#0E5C52;'>{$invoice['invoice_number']}</strong></div>
                            <div style='color:#666;margin-top:2px;'>Date: {$dateStr}</div>
                            <div style='color:#666;margin-top:2px;'>Payment: <strong style='text-transform:uppercase;'>{$invoice['payment_method']}</strong></div>
                        </td>
                        <td style='vertical-align:top;font-size:13px;text-align:right;'>
                            <div>Customer: <strong>" . htmlspecialchars($invoice['customer_name'], ENT_QUOTES, 'UTF-8') . "</strong></div>
                            " . ($invoice['customer_phone'] ? "<div style='color:#666;margin-top:2px;'>Phone: " . htmlspecialchars($invoice['customer_phone'], ENT_QUOTES, 'UTF-8') . "</div>" : "") . "
                            {$doctorRow}
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Items Table -->
            <div style='padding:15px 20px;'>
                <table style='width:100%;border-collapse:collapse;'>
                    <thead>
                        <tr style='background:#E7F2EF;color:#0E5C52;'>
                            <th style='padding:8px;font-size:11px;text-align:left;text-transform:uppercase;'>#</th>
                            <th style='padding:8px;font-size:11px;text-align:left;text-transform:uppercase;'>Medicine / Item</th>
                            <th style='padding:8px;font-size:11px;text-align:right;text-transform:uppercase;'>Rate</th>
                            <th style='padding:8px;font-size:11px;text-align:center;text-transform:uppercase;'>Qty</th>
                            <th style='padding:8px;font-size:11px;text-align:right;text-transform:uppercase;'>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$itemsRows}
                    </tbody>
                </table>
            </div>

            <!-- Totals Area -->
            <div style='padding:15px 20px;background:#FAF8F3;'>
                <table style='width:100%;max-width:280px;margin-left:auto;border-collapse:collapse;'>
                    <tr>
                        <td style='padding:4px 0;font-size:13px;color:#666;'>Subtotal:</td>
                        <td style='padding:4px 0;font-size:13px;text-align:right;font-weight:bold;color:#333;'>₹{$subtotal}</td>
                    </tr>
                    {$discountRow}
                    {$taxRow}
                    <tr style='border-top:2px solid #0E5C52;'>
                        <td style='padding:8px 0;font-size:16px;font-weight:bold;color:#0E5C52;'>Grand Total:</td>
                        <td style='padding:8px 0;font-size:16px;font-weight:bold;text-align:right;color:#0E5C52;'>₹{$totalAmt}</td>
                    </tr>
                </table>
            </div>

            <!-- Footer -->
            <div style='padding:20px;text-align:center;font-size:12px;color:#8A9B97;border-top:1px solid #edf4f2;'>
                <div style='font-weight:bold;color:#0E5C52;margin-bottom:4px;'>Thank you for choosing {$invoice['pharmacy_name']}!</div>
                <div>Wishing you good health and a speedy recovery.</div>
                <div style='margin-top:10px;font-size:11px;color:#aaa;'>Powered by PharmaTrack &bull; Electronic Healthcare Billing</div>
            </div>

        </div>
    </body>
    </html>
    ";
}

/**
 * Sends the invoice email to customer and updates customer_email if given.
 * Gracefully logs/saves email on local development environments.
 * 
 * @return bool True if mail dispatched successfully
 */
function send_invoice_email(PDO $pdo, int $invoiceId, int $pharmacyId, ?string $recipientEmail = null): bool {
    ensure_pos_schema($pdo);

    $invoice = get_pharmacy_invoice($pdo, $invoiceId, $pharmacyId);
    if (!$invoice) return false;

    $toEmail = trim($recipientEmail ?: ($invoice['customer_email'] ?? ''));
    if ($toEmail === '' || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    // Update customer_email on invoice if newly provided
    if ($toEmail !== ($invoice['customer_email'] ?? '')) {
        $stmt = $pdo->prepare("UPDATE invoices SET customer_email = ? WHERE invoice_id = ? AND pharmacy_id = ?");
        $stmt->execute([$toEmail, $invoiceId, $pharmacyId]);
        $invoice['customer_email'] = $toEmail;
    }

    $subject = "Medical Bill Receipt - {$invoice['invoice_number']} from {$invoice['pharmacy_name']}";
    $htmlContent = render_invoice_html_email($invoice);

    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . mb_encode_mimeheader($invoice['pharmacy_name']) . ' <noreply@pharmatrack.local>',
        'Reply-To: noreply@pharmatrack.local',
        'X-Mailer: PHP/' . phpversion(),
    ];

    // Local copy save for easy testing without an external SMTP gateway
    try {
        $mailLogDir = __DIR__ . '/../sent_emails';
        if (!is_dir($mailLogDir)) {
            @mkdir($mailLogDir, 0777, true);
        }
        $logFile = $mailLogDir . '/invoice_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $invoice['invoice_number']) . '.html';
        file_put_contents($logFile, $htmlContent);
    } catch (Exception $e) {
        // Ignore file log errors
    }

    // Dispatch via mail()
    return @mail($toEmail, $subject, $htmlContent, implode("\r\n", $headers));
}
