import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './Button';

interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, title = 'Error', message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xs sm:max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
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