import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useGuestWishlist } from '../store/wishlistStore';
import { useToastStore } from '../store/toastStore';

export function useWishlist() {
  const user = useAuthStore((s) => s.user);
  const guestItems = useGuestWishlist((s) => s.items);
  const query = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const guest = useGuestWishlist.getState().items;
      if (guest.length) {
        const data = await wishlistApi.merge(guest.map((item) => item.id));
        useGuestWishlist.getState().clear();
        return data;
      }
      return wishlistApi.get();
    },
    enabled: Boolean(user),
  });

  if (!user) return { data: { items: guestItems }, isLoading: false };
  return query;
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: async ({ productId, isActive, product }) => {
      if (!useAuthStore.getState().user) {
        const items = useGuestWishlist.getState().toggle(product || { id: productId });
        return { items };
      }
      if (isActive) return wishlistApi.remove(productId);
      return wishlistApi.add(productId);
    },
    onSuccess: (data, vars) => {
      if (useAuthStore.getState().user) qc.setQueryData(['wishlist'], data);
      push({
        title: vars.isActive ? 'Removed from wishlist' : 'Saved',
        message: vars.isActive ? undefined : '♡',
      });
    },
    onError: (err) => {
      if (err?.message === 'Sign in required') return;
      push({ title: 'Could not update wishlist', message: err.message });
    },
  });
}
