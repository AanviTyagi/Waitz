import React, { createContext, useContext, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const notificationAudio = useRef(new Audio('/chime.mp3'));
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Try to load audio on mount
  React.useEffect(() => {
    if (notificationAudio.current) {
      notificationAudio.current.oncanplaythrough = () => setAudioLoaded(true);
      notificationAudio.current.onerror = () => {
        console.log('Audio file not found, continuing without notification sound');
      };
    }
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Play sound for important alerts
    if (type !== 'info' && audioLoaded) {
        notificationAudio.current.currentTime = 0;
        notificationAudio.current.play().catch(e => console.log("Audio play failed", e));
    }

    // Auto remove after 3 seconds
    setTimeout(() => {
        removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
              <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
          ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
    const ref = useRef();

    useGSAP(() => {
        gsap.fromTo(ref.current, 
            { y: -50, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
        );
    }, []);

    const styles = {
        success: 'bg-gray-900 text-white shadow-green-500/20',
        error: 'bg-red-500 text-white shadow-red-500/20',
        info: 'bg-blue-500 text-white shadow-blue-500/20'
    };
    
    const icons = {
        success: <FaCheckCircle className="text-green-400" />,
        error: <FaExclamationCircle className="text-white" />,
        info: <FaInfoCircle className="text-white" />
    };

    return (
        <div ref={ref} className={`pointer-events-auto flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl font-bold min-w-[300px] backdrop-blur-md ${styles[toast.type] || styles.success}`}>
            <span className="text-xl">{icons[toast.type]}</span>
            <span className="tracking-wide text-sm">{toast.message}</span>
        </div>
    );
};
