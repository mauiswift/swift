/**
 * Improved Self-Hosted Checkout Page
 * Fully responsive, accessible, and user-friendly payment checkout
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  X,
  Loader2,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { CheckoutPoweredBy } from '@/components/CheckoutPoweredBy';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { client } from '@/lib/api';
import {
  ResponsiveContainer,
  ResponsiveHeading1,
  ResponsiveHeading2,
  ResponsiveHeading3,
  ResponsiveBody,
  useResponsive,
  ResponsiveFlex,
} from '@/lib/responsive';
import {
  ResponsiveButton,
  ResponsiveInput,
  ResponsiveSelect,
} from '@/components/ResponsiveForm';
import { ResponsiveCard, ResponsiveAlert } from '@/components/ResponsiveCards';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { fmtCurrency } from '@/lib/format';

interface PaymentLink {
  id: number;
  external_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  customer_name: string;
  merchant_name?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  qr_code_url?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  category: 'wallet' | 'bank' | 'qr';
  icon: string;
  enabled: boolean;
}

export default function ImprovedCheckout() {
  const { externalId } = useParams<{ externalId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // State
  const [payment, setPayment] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'amount' | 'method' | 'confirm'>('amount');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [enteredAmount, setEnteredAmount] = useState('');

  // Fetch payment link details
  useEffect(() => {
    const fetchPayment = async () => {
      if (!externalId) {
        setError('Payment ID not found');
        setLoading(false);
        return;
      }

      try {
        const response = await client.get(`/api/v1/payments/checkout/${externalId}/status`);
        if (response.ok && response.data) {
          setPayment(response.data);
          setCurrentStep('method');
        } else {
          setError('Payment link not found or has expired');
        }
      } catch (err) {
        setError('Failed to load payment details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [externalId]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="checkout-page min-h-screen flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-page min-h-screen flex items-center justify-center p-4">
        <ResponsiveContainer>
          <ResponsiveAlert
            type="error"
            title="Payment Error"
            message={error}
          />
        </ResponsiveContainer>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="checkout-page min-h-screen flex items-center justify-center p-4">
        <ResponsiveContainer>
          <ResponsiveAlert
            type="error"
            title="Payment Not Found"
            message="The payment link you requested could not be found."
          />
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={`checkout-page checkout-${payment.currency.toLowerCase()} min-h-screen py-4 sm:py-8 md:py-12`}>
      <ResponsiveContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2">
            {/* HEADER */}
            <div className="mb-6 sm:mb-8">
              <ResponsiveHeading1>Secure Payment</ResponsiveHeading1>
              <p className="text-gray-600 text-sm sm:text-base mt-2">
                {payment.merchant_name || 'Payment'}
              </p>
            </div>

            {/* STEP INDICATOR */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                {['Amount', 'Method', 'Confirm'].map((step, idx) => (
                  <React.Fragment key={step}>
                    <div
                      className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-semibold text-sm sm:text-base ${
                        idx === ['amount', 'method', 'confirm'].indexOf(currentStep)
                          ? 'bg-blue-600 text-white'
                          : idx < ['amount', 'method', 'confirm'].indexOf(currentStep)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {idx === ['amount', 'method', 'confirm'].indexOf(currentStep) ? (
                        <span>{idx + 1}</span>
                      ) : idx < ['amount', 'method', 'confirm'].indexOf(currentStep) ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    {idx < 2 && <div className="flex-1 h-1 mx-2 bg-gray-200" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                <span>Amount</span>
                <span>Payment Method</span>
                <span>Confirm</span>
              </div>
            </div>

            {/* AMOUNT STEP */}
            {currentStep === 'amount' && (
              <ResponsiveCard className="mb-6">
                <ResponsiveHeading3>Payment Amount</ResponsiveHeading3>
                <div className="checkout-legacy-amount mt-6 rounded-2xl p-6 text-white">
                  <p className="text-sm opacity-90">Total Amount</p>
                  <p className="text-4xl sm:text-5xl font-bold mt-2">
                    {fmtCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-sm opacity-75 mt-2">{payment.currency}</p>
                </div>
                {payment.description && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-base text-gray-900">{payment.description}</p>
                  </div>
                )}
                <ResponsiveButton
                  onClick={() => setCurrentStep('method')}
                  fullWidth
                  className="mt-6"
                  size="large"
                >
                  Continue →
                </ResponsiveButton>
              </ResponsiveCard>
            )}

            {/* PAYMENT METHOD STEP */}
            {currentStep === 'method' && (
              <div className="space-y-6">
                {/* DIGITAL WALLETS */}
                <ResponsiveCard>
                  <ResponsiveHeading3>Digital Wallets</ResponsiveHeading3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {['GCash', 'Maya', 'PayMaya'].map((wallet) => (
                      <button
                        key={wallet}
                        onClick={() => {
                          setSelectedMethod(wallet);
                          setCurrentStep('confirm');
                        }}
                        className={`p-4 rounded-lg border-2 transition text-center ${
                          selectedMethod === wallet
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <PaymentBrandLogo brand={wallet} size="md" className="mx-auto mb-2" />
                        <p className="font-medium text-sm sm:text-base">{wallet}</p>
                      </button>
                    ))}
                  </div>
                </ResponsiveCard>

                {/* BANK TRANSFER */}
                <ResponsiveCard>
                  <ResponsiveHeading3>Bank Transfer</ResponsiveHeading3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {['BDO', 'BPI', 'PNB', 'Metrobank', 'Chinabank', 'SecurityBank'].map((bank) => (
                      <button
                        key={bank}
                        onClick={() => {
                          setSelectedMethod(`bank:${bank}`);
                          setCurrentStep('confirm');
                        }}
                        className={`p-4 rounded-lg border-2 transition text-center ${
                          selectedMethod === `bank:${bank}`
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <PaymentBrandLogo brand={bank} size="md" className="mx-auto mb-2" />
                        <p className="font-medium text-sm sm:text-base">{bank}</p>
                      </button>
                    ))}
                  </div>
                </ResponsiveCard>

                {/* QR CODE PAYMENT */}
                <ResponsiveCard>
                  <ResponsiveHeading3>⚡ QR Code Payment</ResponsiveHeading3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {['QRPH', 'Alipay', 'WeChat'].map((qr) => (
                      <button
                        key={qr}
                        onClick={() => {
                          setSelectedMethod(`qr:${qr}`);
                          setCurrentStep('confirm');
                        }}
                        className={`p-4 rounded-lg border-2 transition text-center ${
                          selectedMethod === `qr:${qr}`
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-sm sm:text-base">{qr}</p>
                      </button>
                    ))}
                  </div>
                </ResponsiveCard>
              </div>
            )}

            {/* CONFIRMATION STEP */}
            {currentStep === 'confirm' && selectedMethod && (
              <ResponsiveCard className="mb-6">
                <ResponsiveHeading3>Complete Payment</ResponsiveHeading3>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-semibold">{selectedMethod.replace('bank:', '').replace('qr:', '')}</span>
                  </div>

                  {selectedMethod.startsWith('bank:') && payment.bank_account_number && (
                    <div className="space-y-3">
                      <ResponsiveAlert
                        type="info"
                        message="Transfer the amount below to complete payment"
                      />

                      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                        <div>
                          <label className="text-xs text-gray-600">Bank Name</label>
                          <div className="flex items-center justify-between mt-1">
                            <p className="font-semibold">{payment.bank_name}</p>
                            <button
                              onClick={() =>
                                handleCopyToClipboard(payment.bank_name || '')
                              }
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-600">Account Number</label>
                          <div className="flex items-center justify-between mt-1">
                            <p className="font-mono font-semibold">
                              {payment.bank_account_number}
                            </p>
                            <button
                              onClick={() =>
                                handleCopyToClipboard(
                                  payment.bank_account_number || ''
                                )
                              }
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-600">
                            Account Name
                          </label>
                          <div className="flex items-center justify-between mt-1">
                            <p className="font-semibold">
                              {payment.bank_account_name}
                            </p>
                            <button
                              onClick={() =>
                                handleCopyToClipboard(
                                  payment.bank_account_name || ''
                                )
                              }
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="pt-3 border-t">
                          <label className="text-xs text-gray-600">
                            Amount to Transfer
                          </label>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {fmtCurrency(payment.amount, payment.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod.startsWith('qr:') && payment.qr_code_url && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        Scan this QR code with your {selectedMethod.replace('qr:', '')} app
                      </p>
                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                          <QRCodeSVG
                            value={payment.qr_code_url}
                            size={256}
                            level="H"
                            includeMargin
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'GCash' || selectedMethod === 'Maya' ? (
                    <ResponsiveButton
                      onClick={() => {
                        toast.success(
                          'Opening payment app... Redirecting you shortly.'
                        );
                      }}
                      fullWidth
                      size="large"
                      className="mt-6"
                    >
                      Open {selectedMethod} App
                    </ResponsiveButton>
                  ) : (
                    <ResponsiveButton
                      onClick={() => {
                        toast.success('Payment submitted for verification');
                      }}
                      fullWidth
                      size="large"
                      className="mt-6"
                    >
                      I've Completed the Payment
                    </ResponsiveButton>
                  )}
                </div>

                <button
                  onClick={() => setCurrentStep('method')}
                  className="w-full mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  ← Choose Different Method
                </button>
              </ResponsiveCard>
            )}
          </div>

          {/* SIDEBAR - Order Summary */}
          <div className="lg:col-span-1">
            <ResponsiveCard className="sticky top-6">
              <ResponsiveHeading3>Order Summary</ResponsiveHeading3>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between pb-4 border-b">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">
                    {fmtCurrency(payment.amount, payment.currency)}
                  </span>
                </div>

                <div className="flex justify-between pb-4 border-b">
                  <span className="text-gray-600">Fees</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {fmtCurrency(payment.amount, payment.currency)}
                  </span>
                </div>
              </div>

              {/* SECURITY BADGE */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    256-bit SSL Encrypted
                  </span>
                </div>
              </div>

              {/* POWERED BY */}
              <CheckoutPoweredBy currency={payment?.currency?.trim().toUpperCase() || 'PHP'} className="mt-6" />
            </ResponsiveCard>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
