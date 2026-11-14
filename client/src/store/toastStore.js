import { create } from 'zustand';

let toastId = 0;

const toneFor = (title = '', tone) => {
  if (tone) return tone;
  const text = String(title).toLowerCase();
  if (/could not|failed|unavailable|error/.test(text)) return 'danger';
  if (/^(add|need|choose)|needs a /.test(text)) return 'warn';
  return 'ok';
};

export const useToastStore = create((set) => ({
  toasts: [],
  push: ({ title, message, tone, duration = 3200 }) => {
    const id = ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, title, message, tone: toneFor(title, tone) }],
    }));
    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
