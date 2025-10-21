/**
 * Helius DAS (Digital Asset Standard) API Client
 * Documentation: https://docs.helius.dev/compression-and-das-api/digital-asset-standard-das-api
 * 
 * ⚠️ IMPORTANT: This requires REAL compressed NFTs on Solana devnet.
 * 
 * Mock NFTs will NOT work because:
 * - Merkle proofs must match actual on-chain tree structures
 * - Your program will verify proofs on-chain
 * - Invalid proofs will cause transaction failures
 * 
 * You MUST:
 * 1. Create a real cNFT on Solana devnet
 * 2. Add NEXT_PUBLIC_HELIUS_API_KEY to .env.local
 * 3. Connect wallet that owns the cNFT
 * 
 * See CNFT_SETUP.md for instructions.
 */

import { PublicKey } from '@solana/web3.js';

const HELIUS_API_KEY = (process.env.NEXT_PUBLIC_HELIUS_API_KEY || '').trim();
const HELIUS_RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

/**
 * Returns true if the Helius API key is configured in the environment.
 * Exported so UI/hooks can show a friendly banner before calling any Helius APIs.
 */
export function isHeliusConfigured(): boolean {
  return !!HELIUS_API_KEY;
}



/**
 * Compressed NFT metadata structure from Helius DAS API
 */
export interface DASAsset {
  id: string; // Asset ID (mint address for cNFTs)
  content: {
    $schema: string;
    json_uri: string;
    files?: Array<{
      uri: string;
      mime?: string;
    }>;
    metadata: {
      name: string;
      symbol: string;
      description?: string;
      attributes?: Array<{
        trait_type: string;
        value: string;
      }>;
    };
    links?: {
      image?: string;
      external_url?: string;
    };
  };
  authorities?: Array<{
    address: string;
    scopes: string[];
  }>;
  compression: {
    eligible: boolean;
    compressed: boolean;
    data_hash: string;
    creator_hash: string;
    asset_hash: string;
    tree: string;
    seq: number;
    leaf_id: number;
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
  royalty?: {
    royalty_model: string;
    target: string | null;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
  };
  creators?: Array<{
    address: string;
    share: number;
    verified: boolean;
  }>;
  ownership: {
    frozen: boolean;
    delegated: boolean;
    delegate: string | null;
    ownership_model: string;
    owner: string;
  };
  supply?: {
    print_max_supply: number;
    print_current_supply: number;
    edition_nonce: number | null;
  };
  mutable: boolean;
  burnt: boolean;
}

/**
 * Asset proof structure from Helius
 */
export interface AssetProof {
  root: string;
  proof: string[];
  node_index: number;
  leaf: string;
  tree_id: string;
}

/**
 * Simplified cNFT structure for UI
 */
export interface CompressedNFT {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  tree: string;
  leafId: number;
  owner: string;
}

/**
 * Call Helius DAS API
 */
async function callDASApi<T>(method: string, params: unknown): Promise<T> {
  // Call server-side proxy which keeps the API key secret
  const response = await fetch('/api/helius/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'helius-das-api', method, params }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Helius proxy error: ${response.status} ${text}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Helius API request failed');
  }

  return data.result;
}

/**
 * Fetch all compressed NFTs owned by an address
 * Uses: getAssetsByOwner
 */
export async function getAssetsByOwner(
  ownerAddress: string
): Promise<CompressedNFT[]> {
  try {
    const result = await callDASApi<{
      total: number;
      limit: number;
      page: number;
      items: DASAsset[];
    }>('getAssetsByOwner', {
      ownerAddress,
      page: 1,
      limit: 1000,
      displayOptions: {
        showFungible: false, // Only NFTs
        showNativeBalance: false,
      },
    });

    // Filter only compressed NFTs and map to simplified structure
    return result.items
      .filter((asset) => asset.compression?.compressed)
      .map((asset) => ({
        id: asset.id,
        mint: asset.id,
        name: asset.content?.metadata?.name || 'Unnamed cNFT',
        symbol: asset.content?.metadata?.symbol || '',
        description: asset.content?.metadata?.description,
        image:
          asset.content?.links?.image ||
          asset.content?.files?.[0]?.uri ||
          '/placeholder-nft.png',
        attributes: asset.content?.metadata?.attributes,
        tree: asset.compression.tree,
        leafId: asset.compression.leaf_id,
        owner: asset.ownership.owner,
      }));
  } catch (error) {
    console.error('Error fetching cNFTs:', error);
    throw error;
  }
}

/**
 * Fetch detailed information about a specific asset
 * Uses: getAsset
 */
export async function getAsset(assetId: string): Promise<DASAsset> {
  try {
    return await callDASApi<DASAsset>('getAsset', {
      id: assetId,
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    throw error;
  }
}

/**
 * Fetch Merkle proof for a compressed NFT
 * Required for on-chain operations (fractionalize, transfer, etc.)
 * Uses: getAssetProof
 */
export async function getAssetProof(assetId: string): Promise<AssetProof> {
  try {
    return await callDASApi<AssetProof>('getAssetProof', {
      id: assetId,
    });
  } catch (error) {
    console.error('Error fetching asset proof:', error);
    throw error;
  }
}

/**
 * Convert proof to PublicKey array for transaction accounts
 */
export function proofToAccounts(proof: AssetProof): PublicKey[] {
  return proof.proof.map((node) => new PublicKey(node));
}

/**
 * Get Helius RPC endpoint URL
 */
export function getHeliusRpcUrl(): string {
  return HELIUS_RPC_URL;
}
