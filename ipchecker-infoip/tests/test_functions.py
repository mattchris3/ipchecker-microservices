import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from functions import countries_list, country_info, describe  # noqa: E402


@pytest.mark.parametrize('ip, scope', [
    ('8.8.8.8', 'Public'),
    ('172.217.23.206', 'Public'),
    ('192.168.1.1', 'Private'),
    ('10.0.0.1', 'Private'),
    ('127.0.0.1', 'Loopback'),
    ('169.254.10.1', 'Link-local'),
    ('100.64.1.1', 'Carrier-grade NAT'),
    ('203.0.113.9', 'Documentation'),
    ('224.0.0.1', 'Multicast'),
    ('::1', 'Loopback'),
    ('fe80::1', 'Link-local'),
    ('2001:db8::1', 'Documentation'),
    ('2a00:1450:400e:811::200e', 'Public'),
])
def test_scope(ip, scope):
    assert describe(ip)['scope'] == scope


def test_known_owner():
    info = describe('8.8.8.8')
    assert info['owner'] == 'Google Public DNS'
    assert info['country'] == 'United States'
    assert info['version'] == 4


@pytest.mark.parametrize('ip', ['100.200.300.400', 'abc', '', '1.2.3'])
def test_invalid(ip):
    info = describe(ip)
    assert info['valid'] is False
    assert info['scope'] == 'Invalid'


def test_readable_labels():
    assert country_info('1.1.1.1') == 'Anycast (global) (Cloudflare DNS)'
    assert country_info('172.217.23.206') == 'Public (no offline location data)'
    assert country_info('192.168.1.1') == 'Private address (not on the public internet)'
    assert country_info('nope') == 'Invalid address'


def test_countries_list():
    result = countries_list('8.8.8.8, 192.168.1.1,,abc')
    assert result['error'] is False
    assert set(result['countries']) == {'8.8.8.8', '192.168.1.1', 'abc'}
    assert len(result['details']) == 3


def test_empty():
    assert countries_list('') == {'error': False, 'items': '', 'countries': {}, 'details': []}
