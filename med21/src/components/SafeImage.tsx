import { useState, type ReactNode, type SyntheticEvent } from 'react';

interface SafeImageProps {
  src: string | undefined | null;
  alt: string;
  containerClassName?: string;
  className?: string;
  fallbackSrc?: string;
  fallback?: ReactNode;
  children?: ReactNode;
  referrerPolicy?: HTMLImageElement['referrerPolicy'];
  loading?: 'eager' | 'lazy';
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}

export default function SafeImage({
  src,
  alt,
  containerClassName,
  className,
  fallbackSrc,
  fallback = null,
  children,
  referrerPolicy,
  loading,
  onError,
}: SafeImageProps) {
  const [visible, setVisible] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  if (!src || src.trim() === '') {
    return <>{fallback}</>;
  }

  if (!visible) {
    return <>{fallback}</>;
  }

  const displaySrc = (currentSrc || src).replace(/ /g, '%20');

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (fallbackSrc && (!currentSrc || currentSrc !== fallbackSrc)) {
      setCurrentSrc(fallbackSrc);
      onError?.(event);
      return;
    }
    setVisible(false);
    onError?.(event);
  };

  const image = (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      referrerPolicy={referrerPolicy}
      loading={loading}
      onError={handleError}
    />
  );

  if (containerClassName) {
    return (
      <div className={containerClassName}>
        {image}
        {children}
      </div>
    );
  }

  return image;
}
