import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { useNavigate } from 'react-router-dom';

export function useWishlist() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.get,
    enabled: Boolean(user),
  });
}

export function useToggleWishlist() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: async ({ productId, isActive }) => {
      if (!user) {
        navigate('/auth/login');
        throw new Error('Sign in required');
      }
      if (isActive) return wishlistApi.remove(productId);
      return wishlistApi.add(productId);
    },
    onSuccess: (data, vars) => {
      qc.setQueryData(['wishlist'], data);
      push({
        title: vars.isActive ? 'Removed from wishlist' : 'Saved',
        message: vars.isActive ? undefined : '♡',
      });
    },
  });
}
