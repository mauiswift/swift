"""
Philippine Banks Service - Complete list of official Philippine banks with logos.
Maintains accurate banking codes and official logos for disbursement and withdrawal flows.
"""

from typing import Dict, List, Optional
from enum import Enum


class PHBankCode(str, Enum):
    """Official Philippine bank codes supported by SwiftPay."""
    # Major Banks
    BDO = "BDO"
    BPI = "BPI"
    METROBANK = "METROBANK"
    UNIONBANK = "UNIONBANK"
    RCBC = "RCBC"
    LANDBANK = "LANDBANK"
    DBP = "DBP"
    
    # Thrift Banks
    EASTWEST = "EASTWEST"
    SECBANK = "SECBANK"
    AUB = "AUB"
    CHINABANK = "CHINABANK"
    PNB = "PNB"
    PSBANK = "PSBANK"
    
    # Rural & Cooperative Banks
    CEBUANA = "CEBUANA"
    MBTC = "MBTC"
    
    # Digital/Online Banks
    GCASH = "GCASH"
    MAYA = "MAYA"
    PAYMAYA = "PAYMAYA"
    CIMB = "CIMB"


class PHBank:
    """Philippine Bank definition with official details."""
    
    def __init__(
        self,
        code: str,
        name: str,
        category: str,  # 'universal', 'thrift', 'rural', 'digital'
        logo_url: str,
        official_url: Optional[str] = None,
    ):
        self.code = code
        self.name = name
        self.category = category
        self.logo_url = logo_url
        self.official_url = official_url

    def to_dict(self) -> Dict[str, str]:
        """Convert to dictionary for API responses."""
        return {
            "code": self.code,
            "name": self.name,
            "category": self.category,
            "logoUrl": self.logo_url,
        }


class PHBanksService:
    """Service providing complete list of Philippine banks with official logos."""

    # Official Philippine Banks List with Logos
    # Using official bank logos hosted on CDN or bank websites
    BANKS: Dict[str, PHBank] = {
        PHBankCode.BDO.value: PHBank(
            code=PHBankCode.BDO.value,
            name="BDO Unibank",
            category="universal",
            logo_url="https://www.bdo.com.ph/assets/images/logo.png",
            official_url="https://www.bdo.com.ph",
        ),
        PHBankCode.BPI.value: PHBank(
            code=PHBankCode.BPI.value,
            name="BPI (Bank of the Philippine Islands)",
            category="universal",
            logo_url="https://www.bpi.com.ph/assets/images/bpi-logo.png",
            official_url="https://www.bpi.com.ph",
        ),
        PHBankCode.METROBANK.value: PHBank(
            code=PHBankCode.METROBANK.value,
            name="Metrobank",
            category="universal",
            logo_url="https://www.metrobank.com.ph/assets/images/metrobank-logo.png",
            official_url="https://www.metrobank.com.ph",
        ),
        PHBankCode.UNIONBANK.value: PHBank(
            code=PHBankCode.UNIONBANK.value,
            name="UnionBank of the Philippines",
            category="universal",
            logo_url="https://www.unionbankph.com/assets/images/logo.png",
            official_url="https://www.unionbankph.com",
        ),
        PHBankCode.RCBC.value: PHBank(
            code=PHBankCode.RCBC.value,
            name="RCBC (Rizal Commercial Banking Corporation)",
            category="universal",
            logo_url="https://www.rcbc.com/assets/images/rcbc-logo.png",
            official_url="https://www.rcbc.com",
        ),
        PHBankCode.LANDBANK.value: PHBank(
            code=PHBankCode.LANDBANK.value,
            name="Landbank of the Philippines",
            category="universal",
            logo_url="https://www.landbank.com/assets/images/logo.png",
            official_url="https://www.landbank.com",
        ),
        PHBankCode.DBP.value: PHBank(
            code=PHBankCode.DBP.value,
            name="Development Bank of the Philippines",
            category="universal",
            logo_url="https://www.dbp.ph/assets/images/dbp-logo.png",
            official_url="https://www.dbp.ph",
        ),
        PHBankCode.EASTWEST.value: PHBank(
            code=PHBankCode.EASTWEST.value,
            name="EastWest Bank",
            category="thrift",
            logo_url="https://www.eastwestbank.com/assets/images/logo.png",
            official_url="https://www.eastwestbank.com",
        ),
        PHBankCode.SECBANK.value: PHBank(
            code=PHBankCode.SECBANK.value,
            name="Security Bank",
            category="thrift",
            logo_url="https://www.securitybank.com.ph/assets/images/logo.png",
            official_url="https://www.securitybank.com.ph",
        ),
        PHBankCode.AUB.value: PHBank(
            code=PHBankCode.AUB.value,
            name="Asia United Bank",
            category="thrift",
            logo_url="https://www.aub.com.ph/assets/images/logo.png",
            official_url="https://www.aub.com.ph",
        ),
        PHBankCode.CHINABANK.value: PHBank(
            code=PHBankCode.CHINABANK.value,
            name="Chinabank",
            category="thrift",
            logo_url="https://www.chinabank.com.ph/assets/images/logo.png",
            official_url="https://www.chinabank.com.ph",
        ),
        PHBankCode.PNB.value: PHBank(
            code=PHBankCode.PNB.value,
            name="Philippine National Bank",
            category="universal",
            logo_url="https://www.pnb.com.ph/assets/images/logo.png",
            official_url="https://www.pnb.com.ph",
        ),
        PHBankCode.PSBANK.value: PHBank(
            code=PHBankCode.PSBANK.value,
            name="Philippine Savings Bank",
            category="thrift",
            logo_url="https://www.psbank.com.ph/assets/images/logo.png",
            official_url="https://www.psbank.com.ph",
        ),
        PHBankCode.CEBUANA.value: PHBank(
            code=PHBankCode.CEBUANA.value,
            name="Cebuana Lhuillier Bank",
            category="rural",
            logo_url="https://www.cebuanabank.com/assets/images/logo.png",
            official_url="https://www.cebuanabank.com",
        ),
        PHBankCode.MBTC.value: PHBank(
            code=PHBankCode.MBTC.value,
            name="Maybank (BDO Maybank) / MBTC",
            category="thrift",
            logo_url="https://www.maybank.com.ph/assets/images/logo.png",
            official_url="https://www.maybank.com.ph",
        ),
        # Digital/E-wallets
        PHBankCode.GCASH.value: PHBank(
            code=PHBankCode.GCASH.value,
            name="GCash",
            category="digital",
            logo_url="https://www.gcash.com/assets/images/logo.png",
            official_url="https://www.gcash.com",
        ),
        PHBankCode.MAYA.value: PHBank(
            code=PHBankCode.MAYA.value,
            name="Maya",
            category="digital",
            logo_url="https://www.maya.com.ph/assets/images/logo.png",
            official_url="https://www.maya.com.ph",
        ),
        PHBankCode.PAYMAYA.value: PHBank(
            code=PHBankCode.PAYMAYA.value,
            name="PayMaya",
            category="digital",
            logo_url="https://www.paymaya.com/assets/images/logo.png",
            official_url="https://www.paymaya.com",
        ),
        PHBankCode.CIMB.value: PHBank(
            code=PHBankCode.CIMB.value,
            name="CIMB Bank Philippines",
            category="thrift",
            logo_url="https://www.cimbbank.com.ph/assets/images/logo.png",
            official_url="https://www.cimbbank.com.ph",
        ),
    }

    @classmethod
    def get_bank(cls, code: str) -> Optional[PHBank]:
        """Get a single bank by code."""
        return cls.BANKS.get(code.upper())

    @classmethod
    def get_all_banks(cls) -> List[PHBank]:
        """Get all Philippine banks ordered by category and name."""
        return sorted(
            cls.BANKS.values(),
            key=lambda b: (
                ["universal", "thrift", "rural", "digital"].index(b.category),
                b.name,
            ),
        )

    @classmethod
    def get_banks_by_category(cls, category: str) -> List[PHBank]:
        """Get banks filtered by category."""
        return sorted(
            [b for b in cls.BANKS.values() if b.category == category],
            key=lambda b: b.name,
        )

    @classmethod
    def get_universal_banks(cls) -> List[PHBank]:
        """Get major universal banks (most commonly used)."""
        return cls.get_banks_by_category("universal")

    @classmethod
    def get_all_banks_dict(cls) -> List[Dict[str, str]]:
        """Get all banks as dictionaries for API responses."""
        return [bank.to_dict() for bank in cls.get_all_banks()]

    @classmethod
    def is_valid_code(cls, code: str) -> bool:
        """Check if a bank code is valid."""
        return code.upper() in cls.BANKS

    @classmethod
    def get_institution_codes(cls) -> List[str]:
        """Get all valid institution codes for validation."""
        return list(cls.BANKS.keys())
