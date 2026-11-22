<?php
// Run with: php src/tests/tests.php  (exits 1 on the first failure)
require_once __DIR__ . '/../functions.inc.php';

$cases = [
    ['172.217.23.206,,2a00:1450:400e:811::200e', 1],
    ['192.168.1.1,10.0.0.1', 0],
    ['', 0],
    ['8.8.8.8', 0],
    ['1.1.1.1, ,8.8.8.8', 1],
    [',,', 3],
];

foreach ($cases as [$input, $expected]) {
    $actual = getTotalEmptyIPs($input);
    if ($actual !== $expected) {
        echo "Failed: getTotalEmptyIPs('$input') expected $expected, got $actual\n";
        exit(1);
    }
    echo "Passed: getTotalEmptyIPs('$input') = $actual\n";
}

echo "\nAll " . count($cases) . " tests passed!\n";
