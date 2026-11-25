import { describe, expect, it } from 'vitest';
import { mergeRows, summarise, toItems, toQuery } from './ips';

describe('toItems', () => {
  it('accepts commas and new lines, keeping blanks', () => {
    expect(toItems('8.8.8.8, 1.1.1.1\n\n10.0.0.1')).toEqual(['8.8.8.8', '1.1.1.1', '', '10.0.0.1']);
  });
  it('treats empty input as no entries', () => {
    expect(toItems('   ')).toEqual([]);
  });
  it('joins back to the services format', () => {
    expect(toQuery(['8.8.8.8', '', '1.1.1.1'])).toBe('8.8.8.8,,1.1.1.1');
  });
});

describe('mergeRows', () => {
  const items = ['8.8.8.8', '', '192.168.1.1', 'nope', '8.8.8.8'];
  const data = {
    validip: { results: ['8.8.8.8 -> valid (IPv4)', ' -> invalid', '192.168.1.1 -> valid (IPv4)', 'nope -> invalid'], total_valid_ips: 2 },
    classifyip: { results: ['8.8.8.8 -> IPv4', '192.168.1.1 -> IPv4', 'nope -> Invalid'], ipv4: 2, ipv6: 0 },
    infoip: {
      details: [
        { ip: '8.8.8.8', scope: 'Public', owner: 'Google Public DNS', country: 'United States' },
        { ip: '192.168.1.1', scope: 'Private', owner: null, country: null },
      ],
    },
    badip: {
      details: [
        { ip: '8.8.8.8', status: 'ok' as const },
        { ip: '192.168.1.1', status: 'bogon' as const, reason: 'Private network (RFC 1918)' },
        { ip: 'nope', status: 'invalid' as const },
      ],
      bad_ips: 1,
    },
    totalIPs: { total_ips: 5 },
    totalEmptyIPs: { total_empty_ips: 1 },
  };

  it('makes one row per distinct, non-blank entry', () => {
    expect(mergeRows(items, data).map((r) => r.ip)).toEqual(['8.8.8.8', '192.168.1.1', 'nope']);
  });

  it('combines every service into the row', () => {
    const [google, home, nope] = mergeRows(items, data);
    expect(google).toMatchObject({ valid: true, version: 'IPv4', scope: 'Public', owner: 'Google Public DNS', reputation: { status: 'ok' } });
    expect(home).toMatchObject({ scope: 'Private', reputation: { status: 'bogon', reason: 'Private network (RFC 1918)' } });
    expect(nope).toMatchObject({ valid: false, reputation: { status: 'invalid' } });
    expect(nope.version).toBeUndefined();
  });

  it('copes with a service that did not answer', () => {
    const rows = mergeRows(items, { totalIPs: { total_ips: 5 } });
    expect(rows[0]).toEqual({ ip: '8.8.8.8' });
  });

  it('summarises the totals', () => {
    expect(summarise(data)).toEqual({ total: 5, empty: 1, valid: 2, ipv4: 2, ipv6: 0, bogons: 1 });
  });
});
