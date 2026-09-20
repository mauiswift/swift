from services.tatum_service import DEFAULT_USDT_TRC20_CONTRACT, _parse_transfer


def test_parse_tatum_usdt_incoming_transfer():
    transfer = _parse_transfer(
        {
            "txID": "tx-in-1",
            "tokenTransfer": {
                "tokenAddress": DEFAULT_USDT_TRC20_CONTRACT,
                "from": "TSender00000000000000000000000001",
                "to": "TReceiver000000000000000000000001",
                "amount": "125000000",
            },
        },
        "TReceiver000000000000000000000001",
    )

    assert transfer == {
        "tx_hash": "tx-in-1",
        "direction": "incoming",
        "amount_usdt": 125.0,
        "from_address": "TSender00000000000000000000000001",
        "to_address": "TReceiver000000000000000000000001",
        "raw_payload": '{"tokenTransfer": {"amount": "125000000", "from": "TSender00000000000000000000000001", "to": "TReceiver000000000000000000000001", "tokenAddress": "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"}, "txID": "tx-in-1"}',
    }


def test_parse_tatum_ignores_non_usdt_and_unrelated_transfers():
    assert _parse_transfer(
        {
            "txID": "trx-1",
            "tokenTransfer": {
                "tokenAddress": "OTHER",
                "from": "TSender00000000000000000000000001",
                "to": "TReceiver000000000000000000000001",
                "amount": "125000000",
            },
        },
        "TReceiver000000000000000000000001",
    ) is None
    assert _parse_transfer(
        {
            "txID": "tx-out-1",
            "tokenTransfer": {
                "tokenAddress": DEFAULT_USDT_TRC20_CONTRACT,
                "from": "TSender00000000000000000000000001",
                "to": "TOther00000000000000000000000001",
                "amount": "5000000",
            },
        },
        "TReceiver000000000000000000000001",
    ) is None
