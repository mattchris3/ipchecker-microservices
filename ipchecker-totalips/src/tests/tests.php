<?php
require_once __DIR__ . '/../functions.inc.php';

echo "Testing getTotalIPs\n";

$test1 = getTotalIPs("172.217.23.206,,2a00:1450:400e:811::200e");
if ($test1 === 3) {
    echo "Passed\n";
} else {
    echo "Failed (Expected: 3, Actual: $test1)\n";
    exit(1);
}

$test2 = getTotalIPs("192.168.1.1,10.0.0.1,172.16.0.1");
if ($test2 === 3) {
    echo "Passed\n";
} else {
    echo "Failed (Expected: 3, Actual: $test2)\n";
    exit(1);
}

echo "\nAll tests passed!\n";
?>