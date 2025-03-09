import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useSuggestions(story: string) {
  const [debouncedStory, setDebouncedStory] = useState(story);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStory(story);
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [story]);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['/api/features/suggest', debouncedStory],
    queryFn: async () => {
      if (!debouncedStory || debouncedStory.length < 10) return { suggestions: [] };
      
      const res = await apiRequest('POST', '/api/features/suggest', { story: debouncedStory });
      return res.json();
    },
    enabled: debouncedStory.length >= 10,
  });

  return {
    suggestions: suggestions?.suggestions || [],
    isLoading,
  };
}
