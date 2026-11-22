<?php
// Run with: php src/tests/tests.php  (exits 1 on the first failure)
require_once __DIR__ . '/../functions.inc.php';

$cases = [
    ['172.217.23.206,,2a00:1450:400e:811::200e', 3],
    ['192.168.1.1,10.0.0.1,172.16.0.1', 3],
    ['', 0],
    ['   ', 0],
    ['8.8.8.8', 1],
    ['1.1.1.1, ,8.8.8.8', 3],
];

foreach ($cases as [$input, $expected]) {
    $actual = getTotalIPs($input);
    if ($actual !== $expected) {
        echo "Failed: getTotalIPs('$input') expected $expected, got $actual\n";
        exit(1);
    }
    echo "Passed: getTotalIPs('$input') = $actual\n";
}

echo "\nAll " . count($cases) . " tests passed!\n";
