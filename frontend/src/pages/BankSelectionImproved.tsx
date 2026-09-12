/**
 * Improved Bank Selection Page
 * Modern, responsive, and user-friendly bank selection interface
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronRight,
  Building2,
  Heart,
  Clock,
  TrendingUp,
  Phone,
  Globe,
  MapPin,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ResponsiveHeading1,
  ResponsiveHeading2,
  ResponsiveGrid,
  useResponsive,
} from '@/lib/responsive';
import { ResponsiveInput } from '@/components/ResponsiveForm';
import { ResponsiveCard, ResponsiveBadge } from '@/components/ResponsiveCards';

interface Bank {
  code: string;
  name: string;
  shortName: string;
  category: 'major' | 'regional' | 'digital';
  logo: string;
  processingTime: string;
  popular: boolean;
  featured: boolean;
  minAmount: number;
  maxAmount: number;
  fees: number;
  transferLimit: string;
}

const BANKS: Bank[] = [
  {
    code: 'bdo',
    name: 'BDO Unibank',
    shortName: 'BDO',
    category: 'major',
    logo: '🏦',
    processingTime: '5-30 min',
    popular: true,
    featured: true,
    minAmount: 1,
    maxAmount: 500000,
    fees: 0,
    transferLimit: 'P500K/day',
  },
  {
    code: 'bpi',
    name: 'BPI',
    shortName: 'BPI',
    category: 'major',
    logo: '🏦',
    processingTime: '5-30 min',
    popular: true,
    featured: true,
    minAmount: 1,
    maxAmount: 500000,
    fees: 0,
    transferLimit: 'P500K/day',
  },
  {
    code: 'metrobank',
    name: 'Metrobank',
    shortName: 'MBT',
    category: 'major',
    logo: '🏦',
    processingTime: '10-30 min',
    popular: true,
    featured: false,
    minAmount: 1,
    maxAmount: 500000,
    fees: 0,
    transferLimit: 'P500K/day',
  },
  {
    code: 'pnb',
    name: 'Philippine National Bank',
    shortName: 'PNB',
    category: 'major',
    logo: '🏦',
    processingTime: '10-30 min',
    popular: true,
    featured: false,
    minAmount: 1,
    maxAmount: 500000,
    fees: 0,
    transferLimit: 'P500K/day',
  },
  {
    code: 'unionbank',
    name: 'Union Bank',
    shortName: 'UB',
    category: 'major',
    logo: '🏦',
    processingTime: '5-30 min',
    popular: false,
    featured: false,
    minAmount: 1,
    maxAmount: 500000,
    fees: 0,
    transferLimit: 'P500K/day',
  },
  {
    code: 'securitybank',
    name: 'Security Bank',
    shortName: 'SB',
    category: 'major',
    logo: '🏦',
    processingTime: '10-30 min',
    popular: false,
    featured: false,
    minAmount: 1,
    maxAmount: 500000,
    fees: 0,
    transferLimit: 'P500K/day',
  },
  {
    code: 'gcash',
    name: 'GCash',
    shortName: 'GCash',
    category: 'digital',
    logo: '💳',
    processingTime: 'Instant',
    popular: true,
    featured: true,
    minAmount: 1,
    maxAmount: 100000,
    fees: 0,
    transferLimit: 'P100K/day',
  },
  {
    code: 'maya',
    name: 'Maya',
    shortName: 'Maya',
    category: 'digital',
    logo: '💳',
    processingTime: 'Instant',
    popular: true,
    featured: false,
    minAmount: 1,
    maxAmount: 100000,
    fees: 0,
    transferLimit: 'P100K/day',
  },
  {
    code: 'chinabank',
    name: 'Chinabank',
    shortName: 'CB',
    category: 'regional',
    logo: '🏦',
    processingTime: '15-45 min',
    popular: false,
    featured: false,
    minAmount: 1,
    maxAmount: 300000,
    fees: 0,
    transferLimit: 'P300K/day',
  },
  {
    code: 'landbank',
    name: 'Land Bank of the Philippines',
    shortName: 'LBP',
    category: 'regional',
    logo: '🏦',
    processingTime: '15-45 min',
    popular: false,
    featured: false,
    minAmount: 1,
    maxAmount: 300000,
    fees: 0,
    transferLimit: 'P300K/day',
  },
];

interface BankCardProps {
  bank: Bank;
  selected: boolean;
  onSelect: () => void;
}

const BankCard: React.FC<BankCardProps> = ({ bank, selected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`text-left transition-all rounded-lg border-2 p-4 sm:p-5 md:p-6 ${
        selected
          ? 'border-blue-600 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Bank Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl sm:text-3xl">{bank.logo}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                {bank.shortName}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {bank.name}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap mt-2 mb-3">
            {bank.popular && (
              <ResponsiveBadge variant="success" size="small">
                ⭐ Popular
              </ResponsiveBadge>
            )}
            {bank.featured && (
              <ResponsiveBadge variant="info" size="small">
                🔥 Featured
              </ResponsiveBadge>
            )}
            <ResponsiveBadge variant="default" size="small">
              {bank.category.charAt(0).toUpperCase() + bank.category.slice(1)}
            </ResponsiveBadge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs sm:text-sm">
            <div>
              <span className="text-gray-600">Processing</span>
              <p className="font-medium text-gray-900">{bank.processingTime}</p>
            </div>
            <div>
              <span className="text-gray-600">Daily Limit</span>
              <p className="font-medium text-gray-900">{bank.transferLimit}</p>
            </div>
            <div>
              <span className="text-gray-600">Min Amount</span>
              <p className="font-medium text-gray-900">₱{bank.minAmount}</p>
            </div>
            <div>
              <span className="text-gray-600">Fee</span>
              <p className="font-medium text-green-600">
                {bank.fees === 0 ? 'Free' : `₱${bank.fees}`}
              </p>
            </div>
          </div>
        </div>

        {/* Selection Indicator */}
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition mt-1 ${
            selected
              ? 'border-blue-600 bg-blue-600'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {selected && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
};

interface BankSectionProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  banks: Bank[];
  selectedBank: Bank | null;
  onSelect: (bank: Bank) => void;
}

const BankSection: React.FC<BankSectionProps> = ({
  title,
  icon,
  description,
  banks,
  selectedBank,
  onSelect,
}) => {
  if (banks.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl sm:text-2xl">{icon}</span>
          <ResponsiveHeading2>{title}</ResponsiveHeading2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">{description}</p>
      </div>

      <ResponsiveGrid cols={{ xs: 1, sm: 2, md: 2, lg: 3 }} gap="medium">
        {banks.map((bank) => (
          <BankCard
            key={bank.code}
            bank={bank}
            selected={selectedBank?.code === bank.code}
            onSelect={() => onSelect(bank)}
          />
        ))}
      </ResponsiveGrid>
    </section>
  );
};

export default function BankSelectionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const { isMobile } = useResponsive();

  // Filter and categorize banks
  const filteredBanks = useMemo(() => {
    const filtered = BANKS.filter(
      (bank) =>
        bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.shortName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      featured: filtered.filter((b) => b.featured),
      popular: filtered.filter((b) => b.popular && !b.featured),
      digital: filtered.filter((b) => b.category === 'digital' && !b.featured),
      other: filtered.filter(
        (b) => !b.featured && !b.popular && b.category !== 'digital'
      ),
    };
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6 sm:py-8 md:py-12">
      <ResponsiveContainer>
        {/* HEADER */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <ResponsiveHeading1>Select Your Bank</ResponsiveHeading1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Choose your bank or digital wallet to complete the transfer
          </p>
        </div>

        {/* SEARCH */}
        <div className="mb-8 sm:mb-10">
          <ResponsiveInput
            type="search"
            placeholder="Search banks, e-wallets, or providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="large"
            fullWidth
            icon={<Search className="w-5 h-5" />}
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* BANKS LIST */}
          <div className="lg:col-span-2 space-y-10 sm:space-y-12">
            {/* Featured Section */}
            {filteredBanks.featured.length > 0 && (
              <BankSection
                title="Recommended"
                icon="🌟"
                description="Fast and reliable options recommended for you"
                banks={filteredBanks.featured}
                selectedBank={selectedBank}
                onSelect={setSelectedBank}
              />
            )}

            {/* Popular Section */}
            {filteredBanks.popular.length > 0 && (
              <BankSection
                title="Major Banks"
                icon="🏦"
                description="Top banks in the Philippines"
                banks={filteredBanks.popular}
                selectedBank={selectedBank}
                onSelect={setSelectedBank}
              />
            )}

            {/* Digital Wallets Section */}
            {filteredBanks.digital.length > 0 && (
              <BankSection
                title="Digital Wallets"
                icon="📱"
                description="Instant transfers via mobile wallets"
                banks={filteredBanks.digital}
                selectedBank={selectedBank}
                onSelect={setSelectedBank}
              />
            )}

            {/* Other Banks Section */}
            {filteredBanks.other.length > 0 && (
              <BankSection
                title="Other Banks"
                icon="🏢"
                description="Regional and specialized banks"
                banks={filteredBanks.other}
                selectedBank={selectedBank}
                onSelect={setSelectedBank}
              />
            )}

            {/* No Results */}
            {
              filteredBanks.featured.length === 0 &&
              filteredBanks.popular.length === 0 &&
              filteredBanks.digital.length === 0 &&
              filteredBanks.other.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-base sm:text-lg">
                    No banks found matching "{searchTerm}"
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-700 font-medium mt-2"
                  >
                    Clear search
                  </button>
                </div>
              )
            }
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-1">
            <ResponsiveCard className="sticky top-6 space-y-4">
              <ResponsiveHeading2>Selected Bank</ResponsiveHeading2>

              {selectedBank ? (
                <>
                  <div className="text-center py-6">
                    <span className="text-5xl block mb-3">{selectedBank.logo}</span>
                    <h3 className="text-xl font-bold">{selectedBank.shortName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedBank.name}
                    </p>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Processing Time
                      </span>
                      <span className="font-semibold">
                        {selectedBank.processingTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Daily Limit
                      </span>
                      <span className="font-semibold">
                        {selectedBank.transferLimit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Transfer Fee</span>
                      <span className="font-semibold text-green-600">
                        {selectedBank.fees === 0 ? 'Free' : `₱${selectedBank.fees}`}
                      </span>
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition mt-4">
                    Continue with {selectedBank.shortName}
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">
                    Select a bank to see details and continue
                  </p>
                </div>
              )}

              {/* INFO PANEL */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">
                  💡 Tips for Success
                </h4>
                <ul className="text-xs text-blue-900 space-y-1">
                  <li>• Have your account details ready</li>
                  <li>• Ensure sufficient balance</li>
                  <li>• Keep the reference number safe</li>
                </ul>
              </div>
            </ResponsiveCard>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
