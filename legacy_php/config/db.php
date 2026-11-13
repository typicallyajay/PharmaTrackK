<?php
/**
 * Database connection settings.
 * Update these four values to match your local MySQL setup
 * (XAMPP/WAMP default is usually host=localhost, user=root, password="").
 */
define('DB_HOST', 'localhost');
define('DB_NAME', 'pharmatrack');
define('DB_USER', 'root');
define('DB_PASS', '');

function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die('Database connection failed. Make sure MySQL is running and the '
                . '"pharmatrack" database has been imported (see database/schema.sql). '
                . 'Details: ' . $e->getMessage());
        }
    }
    return $pdo;
}
