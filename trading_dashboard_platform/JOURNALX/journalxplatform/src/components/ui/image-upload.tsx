// This component provides a more user-friendly image upload experience

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImagePlus, X, Upload } from 'lucide-react';
import { fileToDataURL, filesToDataURLs } from '@/lib/data-url-utils';

interface ImageUploadProps {
  onChange: (file: File | null) => void;
  value?: FileList | null;
  preview?: string | null;
  previews?: string[];
  label?: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
  onPreviewsChange?: (previews: string[]) => void;
  onPreviewChange?: (preview: string | null) => void;
}

export function ImageUpload({
  onChange,
  value,
  preview,
  previews: initialPreviews,
  label = "Upload Image",
  accept = "image/*",
  multiple = false,
  className = "",
  onPreviewsChange,
  onPreviewChange,
}: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Initialize previews from the preview prop or previews prop
  const [previews, setPreviews] = useState<string[]>(() => {
    if (initialPreviews && initialPreviews.length > 0) return initialPreviews;
    if (preview) return [preview];
    return [];
  });
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      // Clear the selection
      onChange(null);
      setPreviews([]);
      if (onPreviewsChange) onPreviewsChange([]);
      if (onPreviewChange) onPreviewChange(null);
      return;
    }
    
    // For single file upload
    if (!multiple) {
      const file = files[0];
      onChange(file);
      
      try {
        // Convert to data URL instead of object URL
        const dataUrl = await fileToDataURL(file);
        console.log("Created data URL for single image");
        setPreviews([dataUrl]);
        // Call both callbacks for consistency
        if (onPreviewsChange) onPreviewsChange([dataUrl]);
        if (onPreviewChange) onPreviewChange(dataUrl);
      } catch (error) {
        console.error("Error creating data URL:", error);
      }
      return;
    }
    
    // For multiple files
    try {
      const fileArray = Array.from(files);
      // Convert all files to data URLs
      const dataUrls = await filesToDataURLs(fileArray);
      console.log(`Created ${dataUrls.length} data URLs for multiple images`);
      setPreviews(dataUrls);
      if (onPreviewsChange) onPreviewsChange(dataUrls);
    } catch (error) {
      console.error("Error creating data URLs:", error);
    }
  };
  
  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
    const handleClear = (index: number) => {
    const newPreviews = [...previews];
    
    // No need to revoke data URLs
    
    // Remove the preview
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    
    // If we've removed all previews and this is a single file uploader
    if (newPreviews.length === 0 && !multiple) {
      onChange(null);
    }
    
    if (onPreviewsChange) {
      onPreviewsChange(newPreviews);
    }
    
    // Reset the input value to allow uploading the same file again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          className="flex gap-2"
        >
          <Upload className="h-4 w-4" />
          {label}
        </Button>
        
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
        />
        
        {previews.length > 0 && (
          <div className={multiple ? "grid grid-cols-2 md:grid-cols-3 gap-4 mt-4" : "mt-4"}>
            {previews.map((src, index) => (
              <div key={index} className="relative group">                <img 
                  src={src} 
                  alt={`Preview ${index}`} 
                  className="rounded-lg object-cover w-full aspect-video border bg-gray-100 dark:bg-gray-800" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loops
                    target.src = '/placeholder.svg'; // Fallback image
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleClear(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
