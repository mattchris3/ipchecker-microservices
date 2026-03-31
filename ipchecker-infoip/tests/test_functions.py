import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from functions import countries_list

def test_countries_list():
    items = '100.217.23.206,101.217.23.206,102.217.23.206,172.217.23.206'
    result = countries_list(items)
    
    assert result['error'] == False
    assert result['countries']['100.217.23.206'] == 'US'
    assert result['countries']['101.217.23.206'] == 'UK'
    assert result['countries']['102.217.23.206'] == 'China'
    assert result['countries']['172.217.23.206'] == 'Unknown'