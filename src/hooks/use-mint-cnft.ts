/**
 * Hook to mint a compressed NFT using Helius Mint API
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWallet } from '@/components/solana/solana-provider';

interface MintCNFTParams {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
}

const mintCompressedNFT = async (
  params: MintCNFTParams,
  walletAddress: string
): Promise<{ assetId: string; signature?: string }> => {
  // Call server-side mint endpoint so the Helius API key stays on server
  const response = await fetch('/api/helius/mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: params.name,
      symbol: params.symbol,
      owner: walletAddress,
      description: params.description || 'A compressed NFT for testing fractionalization',
      attributes: [
        { trait_type: 'Type', value: 'Compressed' },
        { trait_type: 'Network', value: 'Devnet' },
        { trait_type: 'Created', value: new Date().toISOString() },
      ],
      imageUrl: params.imageUrl || 'https://via.placeholder.com/400/6366f1/ffffff?text=cNFT',
      externalUrl: 'https://example.com',
      sellerFeeBasisPoints: 500,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to mint cNFT');
  }

  if (!data.result?.assetId) {
    throw new Error('No asset ID returned from mint');
  }

  return {
    assetId: data.result.assetId,
    signature: data.result.signature,
  };
};

export const useMintCNFT = () => {
  const { account } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MintCNFTParams) => {
      if (!account?.address) {
        throw new Error('Wallet not connected');
      }

      return mintCompressedNFT(params, account.address);
    },
    onSuccess: (data) => {
      toast.success('Compressed NFT Minted!', {
        description: `Asset ID: ${data.assetId.slice(0, 8)}...`,
        duration: 5000,
      });

      // Invalidate cNFT queries to refetch
      queryClient.invalidateQueries({ queryKey: ['user-cnfts'] });
      
      // Wait a bit for Helius indexing before refetching
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['user-cnfts'] });
      }, 3000);
    },
    onError: (error) => {
      toast.error('Failed to mint cNFT', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
};
