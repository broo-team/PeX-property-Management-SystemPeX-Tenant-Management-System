import { useEffect, useState } from 'react';
import { getImageUrl } from '@/utils/imageUtils';

export const ImageTest = ({ imagePath }: { imagePath: string }) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const fullUrl = getImageUrl(imagePath);

  useEffect(() => {
    console.log('Environment variables:', import.meta.env); // Debug log
    console.log('API URL:', import.meta.env.VITE_API_URL); // Debug specific env var

    if (!fullUrl) {
      setError('Invalid URL generated');
      setImageStatus('error');
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImageStatus('success');
      setError(null);
    };
    img.onerror = (e) => {
      setImageStatus('error');
      setError(`Failed to load image: ${e}`);
    };
    img.src = fullUrl;
  }, [fullUrl]);

  return (
    <div className="p-4 border rounded">
      {imageStatus === 'success' && (
        <img 
          src={fullUrl!} 
          alt="Test" 
          className="w-32 h-32 object-cover"
        />
      )}
    </div>
  );
}; 