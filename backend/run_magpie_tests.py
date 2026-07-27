import sys
import pytest

if __name__ == '__main__':
    sys.exit(pytest.main(['-q', 'tests/test_magpie_integration.py', '-k', 'magpie', '-s']))
