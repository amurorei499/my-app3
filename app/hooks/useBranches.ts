import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/app/utils/firebase';

export interface Branch {
  id: string;
  name: string;
  teams: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesRef = collection(db, 'branches');
        const q = query(branchesRef, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const branchData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Branch[];

        setBranches(branchData);
        setError(null);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('支店情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, []);

  return { branches, isLoading, error };
} 