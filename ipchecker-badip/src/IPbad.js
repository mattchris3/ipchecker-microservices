const BAD_IPS = [
    '100.200.300.400',
    '101.201.301.401',
    '102.202.302.402',
    '103.203.303.403'
];

function isBad(ip) {
    return BAD_IPS.includes(ip.trim());
}

function checkBadIPs(items) {
    const ipList = items.split(',');
    let goodCount = 0;
    let badCount = 0;
    const results = [];
    
    if (!items || items === '') {
        return {
            error: false,
            items: '',
            results: [],
            good_ips: 0,
            bad_ips: 0
        };
    }

    ipList.forEach(ip => {
        const trimmedIP = ip.trim();
        
        if (isBad(ip)) {
            results.push(`${trimmedIP} -> Bad IP`);
            badCount++;
        } else if (trimmedIP !== '') {
            results.push(`${trimmedIP} -> Good IP`);
            goodCount++;
        } else {
            results.push(`${trimmedIP} -> Good IP`);
        }
    });

    return {
        error: false,
        items: items,
        results: results,
        good_ips: goodCount,
        bad_ips: badCount
    };
}

module.exports = { isBad, checkBadIPs };