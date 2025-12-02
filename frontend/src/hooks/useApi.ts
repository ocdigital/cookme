import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  call: () => Promise<T>;
  reset: () => void;
}

export const useApi = <T,>(
  apiCall: () => Promise<any>,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
): UseApiReturn<T> => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const call = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await apiCall();
      const result = response.data.data || response.data;
      setState({ data: result, loading: false, error: null });
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage =
        (error.response?.data as any)?.message ||
        error.message ||
        'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      onError?.(errorMessage);
      throw error;
    }
  }, [apiCall, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    call,
    reset,
  };
};
