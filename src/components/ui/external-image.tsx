import Image from 'next/image';
import React from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt?: string;
  fill?: boolean;
};

export default function ExternalImage({ src, alt = '', fill = false, ...rest }: Props) {
  // next/image will throw if the domain is not configured. Use try/catch via dynamic import is not possible here,
  // so we fallback to a plain <img> for unknown domains.
  try {
    if (fill) {
      return (
        // @ts-ignore next/image supports fill prop
        <Image src={src} alt={alt} fill {...(rest as any)} />
      );
    }

    return <Image src={src} alt={alt} {...(rest as any)} />;
  } catch (err) {
    return <img src={src} alt={alt} {...rest} />;
  }
}
