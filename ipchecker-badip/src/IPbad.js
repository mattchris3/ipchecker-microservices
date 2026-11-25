// Bogon filter: flags addresses that should never appear as a source on the
// public internet (private, loopback, documentation and other reserved ranges).
// Traffic "from" a bogon is spoofed or misrouted, so firewalls drop it.
// Ranges: IANA special-purpose registries (RFC 6890 and the RFCs listed below).
const net = require('net');

const BOGONS = [
    // IPv4
    ['0.0.0.0', 8, 'ipv4', '"This network" (RFC 1122)'],
    ['10.0.0.0', 8, 'ipv4', 'Private network (RFC 1918)'],
    ['100.64.0.0', 10, 'ipv4', 'Carrier-grade NAT (RFC 6598)'],
    ['127.0.0.0', 8, 'ipv4', 'Loopback (RFC 1122)'],
    ['169.254.0.0', 16, 'ipv4', 'Link-local (RFC 3927)'],
    ['172.16.0.0', 12, 'ipv4', 'Private network (RFC 1918)'],
    ['192.0.0.0', 24, 'ipv4', 'IETF protocol assignments (RFC 6890)'],
    ['192.0.2.0', 24, 'ipv4', 'Documentation, TEST-NET-1 (RFC 5737)'],
    ['192.168.0.0', 16, 'ipv4', 'Private network (RFC 1918)'],
    ['198.18.0.0', 15, 'ipv4', 'Benchmarking (RFC 2544)'],
    ['198.51.100.0', 24, 'ipv4', 'Documentation, TEST-NET-2 (RFC 5737)'],
    ['203.0.113.0', 24, 'ipv4', 'Documentation, TEST-NET-3 (RFC 5737)'],
    ['224.0.0.0', 4, 'ipv4', 'Multicast (RFC 5771)'],
    ['240.0.0.0', 4, 'ipv4', 'Reserved (RFC 1112)'],
    // IPv6
    ['::', 128, 'ipv6', 'Unspecified address (RFC 4291)'],
    ['::1', 128, 'ipv6', 'Loopback (RFC 4291)'],
    ['fc00::', 7, 'ipv6', 'Unique local address (RFC 4193)'],
    ['fe80::', 10, 'ipv6', 'Link-local (RFC 4291)'],
    ['2001:db8::', 32, 'ipv6', 'Documentation (RFC 3849)'],
    ['ff00::', 8, 'ipv6', 'Multicast (RFC 4291)'],
];

// One BlockList per range, so a match can say which range it hit.
const RANGES = BOGONS.map(([address, prefix, family, reason]) => {
    const list = new net.BlockList();
    list.addSubnet(address, prefix, family);
    return { list, family, reason, cidr: `${address}/${prefix}` };
});

/** { status: 'ok' | 'bogon' | 'invalid', reason?, range? } for one address. */
function inspect(ip) {
    const trimmed = (ip || '').trim();
    const version = net.isIP(trimmed);
    if (version === 0) return { status: 'invalid', reason: 'Not an IP address' };
    const family = version === 4 ? 'ipv4' : 'ipv6';
    const hit = RANGES.find((r) => r.family === family && r.list.check(trimmed, family));
    return hit ? { status: 'bogon', reason: hit.reason, range: hit.cidr } : { status: 'ok' };
}

function isBad(ip) {
    return inspect(ip).status === 'bogon';
}

function checkBadIPs(items) {
    if (!items) {
        return { error: false, items: '', results: [], details: [], good_ips: 0, bad_ips: 0, invalid_ips: 0 };
    }

    const details = items.split(',').map((raw) => ({ ip: raw.trim(), ...inspect(raw) }));
    const label = { ok: 'Good IP', bogon: 'Bad IP', invalid: 'Invalid' };

    return {
        error: false,
        items,
        // Kept for older clients (the monitor and the original UI read these strings).
        results: details.map((d) => `${d.ip} -> ${label[d.status]}${d.reason && d.status === 'bogon' ? ` (${d.reason})` : ''}`),
        details,
        good_ips: details.filter((d) => d.status === 'ok').length,
        bad_ips: details.filter((d) => d.status === 'bogon').length,
        invalid_ips: details.filter((d) => d.status === 'invalid').length,
    };
}

module.exports = { isBad, inspect, checkBadIPs, BOGONS };
