const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  
  // Debug log
  return `${API_URL}${imagePath}`;
}; 