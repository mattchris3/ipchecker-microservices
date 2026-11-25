"""IP address information: what kind of address it is, and who runs a few
well-known public ones. Uses Python's standard ipaddress module, so no
external lookup service or API key is needed.

Locating arbitrary public IPs needs a commercial GeoIP database, so this
service reports "Public" for those rather than guessing a country.
"""
import ipaddress

# A handful of famous public resolvers, so the demo shows real owners.
KNOWN = {
    '8.8.8.8': ('Google Public DNS', 'United States'),
    '8.8.4.4': ('Google Public DNS', 'United States'),
    '2001:4860:4860::8888': ('Google Public DNS', 'United States'),
    '1.1.1.1': ('Cloudflare DNS', 'Anycast (global)'),
    '1.0.0.1': ('Cloudflare DNS', 'Anycast (global)'),
    '2606:4700:4700::1111': ('Cloudflare DNS', 'Anycast (global)'),
    '9.9.9.9': ('Quad9 DNS', 'Switzerland'),
    '208.67.222.222': ('OpenDNS (Cisco)', 'United States'),
}

# Checked in order; the first match wins.
SCOPES = [
    ('Loopback', lambda a: a.is_loopback),
    ('Unspecified', lambda a: a.is_unspecified),
    ('Link-local', lambda a: a.is_link_local),
    ('Multicast', lambda a: a.is_multicast),
    ('Carrier-grade NAT', lambda a: a.version == 4 and a in ipaddress.ip_network('100.64.0.0/10')),
    ('Documentation', lambda a: any(a in ipaddress.ip_network(n) for n in
                                    ('192.0.2.0/24', '198.51.100.0/24', '203.0.113.0/24', '2001:db8::/32'))),
    ('Private', lambda a: a.is_private),
    ('Reserved', lambda a: a.is_reserved),
    ('Public', lambda a: a.is_global),
]


def describe(ip):
    """{'ip', 'valid', 'version', 'scope', 'owner', 'country'} for one address."""
    ip = (ip or '').strip()
    try:
        address = ipaddress.ip_address(ip)
    except ValueError:
        return {'ip': ip, 'valid': False, 'version': None, 'scope': 'Invalid', 'owner': None, 'country': None}

    scope = next((name for name, test in SCOPES if test(address)), 'Reserved')
    owner, country = KNOWN.get(str(address), (None, None))
    return {
        'ip': ip,
        'valid': True,
        'version': address.version,
        'scope': scope,
        'owner': owner,
        'country': country,
    }


def country_info(ip):
    """Kept for the original API: a single readable label per address."""
    info = describe(ip)
    if not info['valid']:
        return 'Invalid address'
    if info['country']:
        return f"{info['country']} ({info['owner']})"
    if info['scope'] == 'Public':
        return 'Public (no offline location data)'
    return f"{info['scope']} address (not on the public internet)"


def countries_list(items):
    if not items:
        return {'error': False, 'items': '', 'countries': {}, 'details': []}

    ips = [ip.strip() for ip in items.split(',') if ip.strip()]
    return {
        'error': False,
        'items': items,
        'countries': {ip: country_info(ip) for ip in ips},
        'details': [describe(ip) for ip in ips],
    }
