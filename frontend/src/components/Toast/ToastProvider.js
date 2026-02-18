import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext({
  addToast: () => {},
});

const toastStyles = {
  success: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100',
  error: 'border-red-400/60 bg-red-500/15 text-red-100',
  info: 'border-navy-600 bg-navy-800 text-white',
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = toast.duration ?? 3500;
    const nextToast = {
      id,
      type: toast.type || 'info',
      title: toast.title || 'Update',
      message: toast.message || '',
    };

    setToasts((prev) => [...prev, nextToast]);

    if (duration > 0) {
      window.setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${toastStyles[toast.type]}`}
            role="status"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-navy-200/80 mt-1">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-navy-200/80 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastProvider;
