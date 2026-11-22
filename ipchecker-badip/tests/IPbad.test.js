const { checkBadIPs, inspect, isBad } = require('../src/IPbad');

describe('inspect', () => {
    test.each([
        ['8.8.8.8'],
        ['1.1.1.1'],
        ['172.217.23.206'],
        ['2a00:1450:400e:811::200e'],
    ])('%s is a normal public address', (ip) => {
        expect(inspect(ip).status).toBe('ok');
    });

    test.each([
        ['10.1.2.3', 'Private network (RFC 1918)'],
        ['172.20.0.1', 'Private network (RFC 1918)'],
        ['192.168.1.1', 'Private network (RFC 1918)'],
        ['127.0.0.1', 'Loopback (RFC 1122)'],
        ['100.64.0.5', 'Carrier-grade NAT (RFC 6598)'],
        ['203.0.113.7', 'Documentation, TEST-NET-3 (RFC 5737)'],
        ['239.1.1.1', 'Multicast (RFC 5771)'],
        ['::1', 'Loopback (RFC 4291)'],
        ['fd12:3456::1', 'Unique local address (RFC 4193)'],
        ['2001:db8::1', 'Documentation (RFC 3849)'],
    ])('%s is a bogon: %s', (ip, reason) => {
        expect(inspect(ip)).toMatchObject({ status: 'bogon', reason });
        expect(isBad(ip)).toBe(true);
    });

    test('range edges', () => {
        expect(inspect('172.15.255.255').status).toBe('ok');
        expect(inspect('172.16.0.0').status).toBe('bogon');
        expect(inspect('172.31.255.255').status).toBe('bogon');
        expect(inspect('172.32.0.0').status).toBe('ok');
    });

    test.each([['100.200.300.400'], ['abc'], [''], ['1.2.3']])('%s is invalid', (ip) => {
        expect(inspect(ip).status).toBe('invalid');
    });
});

describe('checkBadIPs', () => {
    test('counts good, bad and invalid entries', () => {
        const result = checkBadIPs('8.8.8.8,192.168.1.1,,100.200.300.400,2001:db8::1');
        expect(result).toMatchObject({ error: false, good_ips: 1, bad_ips: 2, invalid_ips: 2 });
        expect(result.results).toContain('8.8.8.8 -> Good IP');
        expect(result.results).toContain('192.168.1.1 -> Bad IP (Private network (RFC 1918))');
        expect(result.results).toContain('100.200.300.400 -> Invalid');
        expect(result.details).toHaveLength(5);
    });

    test('empty input returns zeros', () => {
        expect(checkBadIPs('')).toMatchObject({ good_ips: 0, bad_ips: 0, invalid_ips: 0, results: [] });
    });
});
