/**
 * Hook for fetching user's compressed NFTs via Helius DAS API
 */

import { useQuery } from '@tanstack/react-query';
import { getAssetsByOwner, CompressedNFT, isHeliusConfigured } from '@/lib/helius';

/**
 * Fetch compressed NFTs owned by the connected wallet
 */
const fetchUserCNFTs = async (
  walletAddress?: string
): Promise<CompressedNFT[]> => {
  if (!walletAddress) return [];

  // Avoid calling Helius if API key is not configured to prevent noisy errors
  if (!isHeliusConfigured()) {
    console.warn('Skipping Helius call: NEXT_PUBLIC_HELIUS_API_KEY not configured');
    return [];
  }

  try {
    return await getAssetsByOwner(walletAddress);
  } catch (error) {
    console.error('Failed to fetch cNFTs:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to fetch compressed NFTs'
    );
  }
};

/**
 * Hook to fetch user's compressed NFTs from Helius
 */
export const useUserCNFTs = (walletAddress?: string) => {
  return useQuery({
    queryKey: ['userCNFTs', walletAddress],
    queryFn: () => fetchUserCNFTs(walletAddress),
    enabled: !!walletAddress,
    staleTime: 30000, // 30 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};
