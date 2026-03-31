COUNTRY = {
    '100': 'US',
    '101': 'UK',
    '102': 'China'
}

def country_info(ip):
    if not ip or ip.strip() == '':
        return 'Unknown'
    
    ip = ip.strip()
    
    if '.' not in ip:
        return 'Unknown'
    
    first_three = ip[:3]
        
    return COUNTRY.get(first_three, 'Unknown')

def countries_list(items):
    if not items or items == '':
        return {
            'error': False,
            'items': '',
            'countries': {}
        }
    
    ip_list = items.split(',')
    countries = {}
    
    for ip in ip_list:
        ip = ip.strip()
        if ip:
            country = country_info(ip)
            countries[ip] = country
    
    return {
        'error': False,
        'items': items,
        'countries': countries
    }