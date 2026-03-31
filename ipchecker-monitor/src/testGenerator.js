function generateIPv4() {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function generateIPv6() {
    const segments = [];
    for (let i = 0; i < 8; i++) {
        segments.push(Math.floor(Math.random() * 65536).toString(16));
    }
    return segments.join(':');
}

function generateInvalidIP() {
    const types = [
        `${Math.floor(Math.random() * 1000)}.999.999.999`,
        'not.an.ip.address',
        '192.168.1',
        `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 500)}`,
    ];
    return types[Math.floor(Math.random() * types.length)];
}

function generateTestData() {
    const ips = [];
    const ipv4Count = Math.floor(Math.random() * 3) + 1;
    const ipv6Count = Math.floor(Math.random() * 2) + 1;
    const invalidCount = Math.floor(Math.random() * 2);
    const emptyCount = Math.floor(Math.random() * 2);

    for (let i = 0; i < ipv4Count; i++) ips.push(generateIPv4());
    for (let i = 0; i < ipv6Count; i++) ips.push(generateIPv6());
    for (let i = 0; i < invalidCount; i++) ips.push(generateInvalidIP());
    for (let i = 0; i < emptyCount; i++) ips.push('');

    return {
        items: ips.join(','),
        expected: {
            totalIPs: ips.length,
            validIPv4: ipv4Count,
            validIPv6: ipv6Count,
            invalidIPs: invalidCount,
            emptyIPs: emptyCount
        }
    };
}

module.exports = { generateTestData };