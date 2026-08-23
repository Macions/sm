
import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import toast from 'react-hot-toast';


interface PaymentData {
  id: number;
  memberName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
}

export const usePayments = () => {
  const [data, setData] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      

      const endpoints = [
        '/api/payments',
        '/api/payments/status', 
        '/api/members/payments',
        '/api/profile/payments'
      ];
      

      let response = null;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (res.ok) {
            response = res;
            break;
          }
        } catch (e) {
          lastError = e;
        }
      }
      
      if (!response) {
        throw new Error('Żaden endpoint nie działa');
      }
      
      const result = await response.json();
      setData(Array.isArray(result) ? result : result.data || []);
      logger.info('✅ Pobrano dane:', result);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Błąd pobierania';
      setError(message);
      logger.error('❌ Błąd:', err);
      toast.error('Nie udało się pobrać danych składek');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return { data, loading, error, refetch: fetchPayments };
};