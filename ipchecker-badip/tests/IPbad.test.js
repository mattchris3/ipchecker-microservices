const { checkBadIPs } = require('../src/IPbad');

describe('Function test', () => {
    test('Check bad IP function to return correct results', () => {
        const items = '172.217.23.206,100.200.300.400,101.201.301.401,1.21.23.206,102.202.302.402,103.203.303.403';
        const result = checkBadIPs(items);
        
        expect(result.good_ips).toBe(2);
        expect(result.bad_ips).toBe(4);
        expect(result.error).toBe(false);
        expect(result.results).toBeDefined();
        expect(result.results.length).toBe(6);
        expect(result.results).toContain('172.217.23.206 -> Good IP');
        expect(result.results).toContain('100.200.300.400 -> Bad IP');
        expect(result.results).toContain('101.201.301.401 -> Bad IP');
        expect(result.results).toContain('1.21.23.206 -> Good IP');
        expect(result.results).toContain('102.202.302.402 -> Bad IP');
        expect(result.results).toContain('103.203.303.403 -> Bad IP');
    });

    test('Empty string returns zero', () => {
        const result = checkBadIPs('');
        
        expect(result.good_ips).toBe(0);
        expect(result.bad_ips).toBe(0);
    });
});