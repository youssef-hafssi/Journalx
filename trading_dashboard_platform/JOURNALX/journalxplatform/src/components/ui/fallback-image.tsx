import React, { useState, useEffect } from 'react';
import { FileImage } from 'lucide-react';
import { isDataURL } from '@/lib/data-url-utils';

interface FallbackImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * A component that displays an image with a fallback if the image fails to load.
 * This is particularly useful for object URLs that might have been revoked.
 */
export function FallbackImage({
  src,
  alt,
  className = "",
  fallbackSrc = "/placeholder.svg"
}: FallbackImageProps) {  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Check if the source is valid
  useEffect(() => {
    // Reset state when source changes
    setError(false);
    setLoaded(false);
    
    // Log image source type for debugging
    if (isDataURL(src)) {
      console.log('Using data URL for image');
    } else if (src.startsWith('http') || src.startsWith('/')) {
      console.log('Using remote or local URL for image');
    } else {
      console.warn('Unknown image source format');
    }
  }, [src]);
  
  // Handle loading error
  const handleError = () => {
    console.warn(`Image failed to load: ${src.substring(0, 50)}...`);
    setError(true);
  };

  // Handle successful load
  const handleLoad = () => {
    console.log(`Image loaded successfully: ${src.substring(0, 30)}...`);
    setLoaded(true);
  };  // For data URLs, ensure we handle them properly
  if (src && isDataURL(src) && !error) {
    return (
      <img 
        src={src}
        alt={alt} 
        className={className}
        onError={(e) => {
          console.warn(`Data URL image failed to load (${src.substring(0, 30)}...)`);
          setError(true);
        }}
        onLoad={() => {
          console.log(`Data URL image loaded successfully`);
          setLoaded(true);
        }}
      />
    );
  }

  // If there's an error, show the fallback image or icon
  if (error) {
    if (fallbackSrc) {
      return (
        <img 
          src={fallbackSrc} 
          alt={alt} 
          className={className} 
          onError={() => console.error("Even fallback image failed to load")}
        />
      );
    }
    
    // If no fallback src is provided or it also fails, show an icon
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <FileImage className="w-1/3 h-1/3 text-muted-foreground/40" />
      </div>
    );
  }

  // Show loading state until the image loads
  return (
    <>
      {!loaded && (
        <div className={`flex items-center justify-center bg-muted ${className}`}>
          <FileImage className="w-1/3 h-1/3 text-muted-foreground/40 animate-pulse" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'block' : 'hidden'}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </>
  );
}
