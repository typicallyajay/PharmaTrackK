<?php
/**
 * Core search logic for PharmaTrack, including the "medicine not
 * available here -> find nearest pharmacy that has it" feature.
 *
 * Distance is calculated with the Haversine formula directly in SQL
 * when a pharmacy has latitude/longitude set. Pharmacies without
 * coordinates still show up (matched by same city), just without a
 * distance figure, so the feature degrades gracefully.
 */

/**
 * Search all approved pharmacies for a medicine name (partial match).
 * Optionally ranked by distance from ($lat, $lng) if provided.
 *
 * @return array List of rows: pharmacy + stock details (+ distance_km if coords given)
 */
function search_medicine(PDO $pdo, string $query, ?float $lat = null, ?float $lng = null, int $limit = 50): array {
    $query = trim($query);
    if ($query === '') return [];

    $distanceSelect = '';
    $orderBy = 'ORDER BY se.quantity DESC, se.price ASC';
    $params = [':q' => '%' . $query . '%'];

    if ($lat !== null && $lng !== null) {
        // Haversine formula (km), using MySQL trig functions
        $distanceSelect = ',
            (6371 * acos(
                cos(radians(:lat)) * cos(radians(p.latitude)) *
                cos(radians(p.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(p.latitude))
            )) AS distance_km';
        $orderBy = 'ORDER BY (p.latitude IS NULL), distance_km ASC, se.price ASC';
        $params[':lat'] = $lat;
        $params[':lng'] = $lng;
    }

    $sql = "SELECT
                p.pharmacy_id, p.pharmacy_name, p.address, p.locality, p.city, p.phone,
                p.latitude, p.longitude,
                se.stock_id, se.medicine_name, se.generic_name, se.price, se.quantity, se.expiry_date
                $distanceSelect
            FROM stock_entries se
            JOIN pharmacies p ON p.pharmacy_id = se.pharmacy_id
            WHERE p.status = 'approved'
              AND se.quantity > 0
              AND se.medicine_name LIKE :q
            $orderBy
            LIMIT $limit";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * "Not available here" feature: given a medicine name and (optionally) a
 * pharmacy the user was just looking at, find OTHER approved pharmacies
 * that currently have it in stock -- nearest first when coordinates exist.
 *
 * This is the exact feature requested: a customer/pharmacy finds a medicine
 * missing from one store's shelf and instantly sees where else nearby has it.
 */
function find_nearby_alternatives(PDO $pdo, string $medicineName, ?int $excludePharmacyId = null, ?float $lat = null, ?float $lng = null, int $limit = 10): array {
    $results = search_medicine($pdo, $medicineName, $lat, $lng, $limit + 1);

    if ($excludePharmacyId !== null) {
        $results = array_values(array_filter($results, function ($row) use ($excludePharmacyId) {
            return (int)$row['pharmacy_id'] !== $excludePharmacyId;
        }));
    }

    return array_slice($results, 0, $limit);
}

/** Records a search term so the admin dashboard can show "most searched medicines". */
function log_search(PDO $pdo, string $medicineName): void {
    $stmt = $pdo->prepare('INSERT INTO search_logs (medicine_name) VALUES (?)');
    $stmt->execute([$medicineName]);
}

function format_distance(?float $km): string {
    if ($km === null) return '';
    if ($km < 1) return round($km * 1000) . ' m away';
    return round($km, 1) . ' km away';
}
