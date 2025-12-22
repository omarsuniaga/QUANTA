import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './Button';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, title = 'Error', message, onClose }) => {
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 flex justify-center items-start overflow-y-auto pointer-events-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      {/* Modal */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs sm:max-w-sm overflow-hidden border border-slate-100 max-h-[85vh] mt-16 mb-8 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-rose-50 p-4 sm:p-6 flex flex-col items-center justify-center border-b border-rose-100">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-inner">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-rose-700">{title}</h3>
        </div>

        <div className="p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 leading-relaxed">
            {message}
          </p>
          <Button variant="danger" fullWidth onClick={onClose} className="shadow-lg shadow-rose-100 text-xs sm:text-sm py-2 sm:py-2.5">
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
};