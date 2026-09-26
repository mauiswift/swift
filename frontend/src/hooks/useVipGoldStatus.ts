import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';

export function useVipGoldStatus(userId?: string) {
  const query = useQuery({
    queryKey: ['team-vip-status', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await client.get('/api/v1/team/vip-status');
      if (!response.ok) {
        throw new Error(response.data?.detail || 'Unable to load VIP status');
      }
      if (typeof response.data?.vip_gold !== 'boolean') {
        throw new Error('VIP status response is invalid');
      }
      return response.data.vip_gold;
    },
    staleTime: 60_000,
  });

  return {
    isVipGold: query.data === true,
    isLoading: query.isPending,
    isError: query.isError,
  };
}
