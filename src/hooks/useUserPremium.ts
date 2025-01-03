import { useUser } from '../contexts/UserContext';

interface PremiumStatus {
  premium: boolean;
  nextBillingDate: Date | null;
  cancelAtPeriodEnd: boolean;
}

export function useUserPremium(): PremiumStatus {
  const { state } = useUser();
  const { subscription } = state;

  return {
    premium: subscription?.status === 'active',
    nextBillingDate: subscription?.nextBillingDate 
      ? new Date(subscription.nextBillingDate) 
      : null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false
  };
} 