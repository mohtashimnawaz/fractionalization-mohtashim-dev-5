/**
 * Fractionalization page - Fractionalize your NFTs
 */

'use client';

import { FractionalizationWorkflow } from '@/components/fractionalization/fractionalization-workflow';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';

export default function FractionalizePage() {
  const [heliusOk, setHeliusOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/helius/health')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setHeliusOk(Boolean(data?.ok));
      })
      .catch(() => {
        if (!mounted) return;
        setHeliusOk(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Fractionalize NFT</h1>
        <p className="text-muted-foreground">
          Convert your NFT into fractional tokens
        </p>
      </div>

      {!heliusOk && (
        <Alert variant="warning" className="mb-6">
          <AlertTitle>Helius API key missing</AlertTitle>
          <AlertDescription>
            This app needs a Helius API key to load compressed NFTs.
            <br />
            Add <code>NEXT_PUBLIC_HELIUS_API_KEY</code> to your <code>.env.local</code> or set it in Vercel environment variables.
          </AlertDescription>
        </Alert>
      )}

      <FractionalizationWorkflow />
    </div>
  );
}
