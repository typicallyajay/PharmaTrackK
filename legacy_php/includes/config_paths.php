<?php
/**
 * PharmaTrack — Dynamic Base URL & Path Configuration
 * Automatically detects whether the application is hosted in /pharmatrack,
 * /PharmaTrack/pharmatrack, a custom subfolder, or root domain.
 */
if (!defined('BASE_PATH')) {
    $base = '';
    
    // Method 1: Compare file system path with DOCUMENT_ROOT
    $projectRoot = str_replace('\\', '/', realpath(dirname(__DIR__)));
    $docRoot = str_replace('\\', '/', realpath($_SERVER['DOCUMENT_ROOT'] ?? ''));

    if (!empty($docRoot) && !empty($projectRoot) && stripos($projectRoot, $docRoot) === 0) {
        $sub = substr($projectRoot, strlen($docRoot));
        $base = '/' . trim($sub, '/\\');
    } else {
        // Method 2: Inspect SCRIPT_NAME / PHP_SELF
        $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? $_SERVER['PHP_SELF'] ?? '');
        if (preg_match('#^(.*?/(?:pharmatrack|PharmaTrack(?:/pharmatrack)?))(?=/|$)#i', $script, $matches)) {
            $base = '/' . trim($matches[1], '/');
        } elseif (preg_match('#^(.*?)(?:/(?:admin|pharmacy|reminders))?/[^/]+$#i', $script, $matches)) {
            $base = '/' . trim($matches[1], '/');
        }
    }

    if ($base === '/' || $base === '\\') {
        $base = '';
    }

    define('BASE_PATH', rtrim($base, '/'));
}
