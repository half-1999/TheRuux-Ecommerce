import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/client';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import { useUiStore } from '../store/uiStore';

export function useCart() {
  const setItemCount = useCartStore((s) => s.setItemCount);
  const query = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const data = await cartApi.get();
      const count = data.items?.reduce((n, i) => n + i.quantity, 0) || 0;
      setItemCount(count);
      return data;
    },
  });
  return query;
}

export function useAddToCart() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);
  const openCart = useUiStore((s) => s.openCart);
  const setItemCount = useCartStore((s) => s.setItemCount);

  return useMutation({
    mutationFn: cartApi.add,
    onSuccess: (data) => {
      qc.setQueryData(['cart'], data);
      const count = data.items?.reduce((n, i) => n + i.quantity, 0) || 0;
      setItemCount(count);
      push({ title: "IT'S YOURS NOW." });
      openCart();
    },
    onError: (err) => {
      push({ title: 'Could not add', message: err.message });
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);
  return useMutation({
    mutationFn: ({ id, quantity }) => cartApi.update(id, quantity),
    onSuccess: (data) => {
      qc.setQueryData(['cart'], data);
      setItemCount(data.items?.reduce((n, i) => n + i.quantity, 0) || 0);
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  const setItemCount = useCartStore((s) => s.setItemCount);
  return useMutation({
    mutationFn: (id) => cartApi.remove(id),
    onSuccess: (data) => {
      qc.setQueryData(['cart'], data);
      setItemCount(data.items?.reduce((n, i) => n + i.quantity, 0) || 0);
    },
  });
}
