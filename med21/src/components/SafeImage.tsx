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

/**
 * SafeImage
 *
 * Renders an <img> only when a non-empty src is provided. If the image fails
 * to load, the entire container is hidden so no broken-image icon or empty
 * placeholder box is shown.
 *
 * Use this for all product/service/category images so the UI degrades cleanly
 * when an image path is missing or a file is unavailable.
 */
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

  // Defensive: ensure spaces in URLs are encoded. Most browsers handle raw
  // spaces, but encoding keeps paths consistent and avoids edge cases.
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
