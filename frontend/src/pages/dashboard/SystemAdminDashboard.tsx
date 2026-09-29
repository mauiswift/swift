import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  Bot,
  CreditCard,
  Megaphone,
  MessageCircle,
  Send,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { client } from '@/lib/api';
import { isSystemWalletAdmin } from '@/lib/permissions';

type QueueKey = 'kyb' | 'kyc' | 'bank_deposits' | 'topups' | 'withdrawals';

interface AdminDashboardOverview {
  pending_queues: Record<QueueKey, number>;
}

interface AdminDashboardItem {
  label: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  tone: string;
  queueKey?: QueueKey;
}

interface AdminDashboardSection {
  id: string;
  title: string;
  description: string;
  items: AdminDashboardItem[];
}

export default function SystemAdminDashboard() {
  const { language } = useLanguage();
  const { permissions, user } = useAuth();
  const tx = (en: string, ko: string, zh: string) => language === 'ko' ? ko : language === 'zh' ? zh : en;
  const queueQuery = useQuery({
    queryKey: ['system-admin-dashboard-overview'],
    queryFn: async () => {
      const response = await client.get('/api/v1/admin/dashboard/overview');
      if (!response.ok) throw new Error(response.data?.detail || 'Unable to load pending queues');
      return response.data as AdminDashboardOverview;
    },
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
  const sections: AdminDashboardSection[] = [
    {
      id: 'review',
      title: tx('Review and verification', '심사 및 인증', '审核与验证'),
      description: tx('Merchant onboarding and identity checks', '가맹점 등록 및 신원 확인', '商户入驻与身份核验'),
      items: [
        { label: tx('KYB registrations', 'KYB 등록', 'KYB 注册'), detail: tx('Review business verification submissions', '사업자 인증 신청 검토', '审核企业认证申请'), href: '/kyb-registrations', icon: ShieldCheck, tone: 'bg-blue-50 text-blue-700', queueKey: 'kyb' },
        { label: tx('KYC verifications', 'KYC 인증', 'KYC 验证'), detail: tx('Review customer identity submissions', '고객 신원 확인 신청 검토', '审核客户身份验证申请'), href: '/kyc-verifications', icon: UserCheck, tone: 'bg-emerald-50 text-emerald-700', queueKey: 'kyc' },
      ],
    },
    {
      id: 'financial',
      title: tx('Financial operations', '금융 운영', '金融运营'),
      description: tx('Review funds moving into and out of the platform', '플랫폼 자금 입출금 검토', '审核平台资金流入和流出'),
      items: [
        ...(isSystemWalletAdmin(user?.id) ? [
          { label: tx('Payment approvals', '결제 승인', '支付审批'), detail: tx('Review payments awaiting approval', '승인 대기 중인 결제 검토', '审核待批准的付款'), href: '/payment-approvals', icon: CreditCard, tone: 'bg-cyan-50 text-cyan-700' },
        ] : []),
        ...(isSystemWalletAdmin(user?.id) && permissions?.can_approve_topups ? [
          { label: tx('Top-up requests', '충전 요청', '充值申请'), detail: tx('Review wallet funding requests', '지갑 충전 요청 검토', '审核钱包充值申请'), href: '/topup-requests', icon: Wallet, tone: 'bg-amber-50 text-amber-700' },
        ] : []),
        ...(isSystemWalletAdmin(user?.id) ? [
          { label: tx('Bank deposits', '은행 입금', '银行存款'), detail: tx('Verify incoming bank deposits', '은행 입금 확인', '核实银行入账'), href: '/bank-deposits', icon: Banknote, tone: 'bg-teal-50 text-teal-700', queueKey: 'bank_deposits' as const },
          { label: tx('Withdrawals', '출금', '提现'), detail: tx('Review outgoing withdrawal requests', '출금 요청 검토', '审核提现申请'), href: '/withdrawals', icon: Send, tone: 'bg-orange-50 text-orange-700', queueKey: 'withdrawals' as const },
          { label: tx('USDT send requests', 'USDT 송금 요청', 'USDT 转账申请'), detail: tx('Review pending crypto transfers', '대기 중인 암호화폐 송금 검토', '审核待处理的加密货币转账'), href: '/withdrawals/usdt-send-requests', icon: Wallet, tone: 'bg-lime-50 text-lime-700' },
        ] : []),
      ],
    },
    {
      id: 'platform',
      title: tx('Platform administration', '플랫폼 관리', '平台管理'),
      description: tx('Manage accounts, access, and platform communications', '계정, 접근 권한 및 플랫폼 공지 관리', '管理账户、访问权限和平台通知'),
      items: [
        { label: tx('Accounts and access', '계정 및 접근 권한', '账户与访问权限'), detail: tx('Manage platform accounts and team access', '플랫폼 계정 및 팀 접근 권한 관리', '管理平台账户和团队访问权限'), href: '/admin-management', icon: Users, tone: 'bg-slate-100 text-slate-700' },
        { label: tx('Roles and permissions', '역할 및 권한', '角色与权限'), detail: tx('Review system roles and access rules', '시스템 역할 및 접근 규칙 검토', '查看系统角色和访问规则'), href: '/roles', icon: ShieldCheck, tone: 'bg-indigo-50 text-indigo-700' },
        { label: tx('Broadcasts', '공지 발송', '平台公告'), detail: tx('Send platform-wide announcements', '플랫폼 전체 공지 발송', '发送全平台公告'), href: '/broadcasts', icon: Megaphone, tone: 'bg-rose-50 text-rose-700' },
        { label: tx('Bot messages', '봇 메시지', '机器人消息'), detail: tx('Manage Telegram bot messages', 'Telegram 봇 메시지 관리', '管理 Telegram 机器人消息'), href: '/bot-messages', icon: Bot, tone: 'bg-violet-50 text-violet-700' },
        { label: tx('Support queue', '고객 지원 대기열', '客服工单队列'), detail: tx('Review and respond to support tickets', '고객 지원 요청 검토 및 답변', '审核并回复支持工单'), href: '/support', icon: MessageCircle, tone: 'bg-sky-50 text-sky-700' },
      ],
    },
  ];

  return (
    <Layout>
      <main className="mx-auto max-w-[1200px] space-y-10">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{tx('System administrator', '시스템 관리자', '系统管理员')}</p>
            <h1 className="text-2xl font-semibold text-slate-950">{tx('Platform operations', '플랫폼 운영', '平台运营')}</h1>
            <p className="mt-2 text-sm text-slate-600">{tx('Review queues, financial activity, and platform access.', '검토 대기열, 금융 활동 및 플랫폼 접근 권한을 관리하세요.', '管理审核队列、资金活动和平台访问权限。')}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />{tx('Privileged workspace', '관리자 전용 공간', '管理员工作区')}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void queueQuery.refetch()}
              disabled={queueQuery.isFetching}
              className="h-10"
            >
              {tx('Refresh queues', '대기열 새로고침', '刷新队列')}
            </Button>
          </div>
        </header>

        {queueQuery.isError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>{tx('Pending queue counts are unavailable.', '대기열 건수를 불러올 수 없습니다.', '暂时无法获取待处理队列数量。')}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void queueQuery.refetch()} disabled={queueQuery.isFetching}>
              {tx('Retry', '다시 시도', '重试')}
            </Button>
          </div>
        )}

        {sections.map(section => (
          <section key={section.id} aria-labelledby={`admin-section-${section.id}`}>
            <div className="mb-4">
              <h2 id={`admin-section-${section.id}`} className="text-base font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{section.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {section.items.map(item => {
                const Icon = item.icon;
                const pendingCount = item.queueKey
                  ? queueQuery.data?.pending_queues?.[item.queueKey]
                  : undefined;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="group flex min-h-[112px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">{item.detail}</span>
                      {item.queueKey && (
                        <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700" aria-live="polite">
                          {queueQuery.isPending
                            ? tx('Loading…', '불러오는 중…', '加载中…')
                            : typeof pendingCount === 'number' && Number.isFinite(pendingCount)
                              ? `${pendingCount} ${tx('pending', '대기 중', '待处理')}`
                              : tx('Unavailable', '확인 불가', '不可用')}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </Layout>
  );
}