import Image, { ImageProps } from 'next/image';
import React from 'react';

type Props = Omit<ImageProps, 'src'> & { src: string };

export default function ExternalImage(props: Props) {
  // Use next/image for optimization. If a domain is not allowed by next.config, Next will fail at runtime.
  // Consumers can add trusted domains to next.config.remotePatterns.
  return <Image {...props} src={props.src} alt={props.alt ?? ''} />;
}
