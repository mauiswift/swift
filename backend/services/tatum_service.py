"""Compatibility aliases for the former Tatum service and API routes."""
from services.bitgo_service import (
    BitGoConfigurationError as TatumConfigurationError,
    DEFAULT_BITGO_USDT_CONTRACT as DEFAULT_USDT_TRC20_CONTRACT,
    _parse_transfer, assign_usdt_address, get_bitgo_config as get_tatum_config,
    monitor_all_addresses, monitor_user_address, save_bitgo_config as save_tatum_config,
)
