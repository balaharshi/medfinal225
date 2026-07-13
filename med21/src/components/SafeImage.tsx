import { useState, type ReactNode, type SyntheticEvent } from 'react';

interface SafeImageProps {
  src: string | undefined | null;
  alt: string;
  containerClassName?: string;
  className?: string;
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
  fallback = null,
  children,
  referrerPolicy,
  loading,
  onError,
}: SafeImageProps) {
  const [visible, setVisible] = useState(true);

  if (!src || src.trim() === '') {
    return <>{fallback}</>;
  }

  if (!visible) {
    return <>{fallback}</>;
  }

  const safeSrc = src.replace(/ /g, '%20');

  const image = (
    <img
      src={safeSrc}
      alt={alt}
      className={className}
      referrerPolicy={referrerPolicy}
      loading={loading}
      onError={(event) => {
        setVisible(false);
        if (onError) {
          onError(event);
        }
      }}
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
