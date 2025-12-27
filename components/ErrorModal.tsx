import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { ModalWrapper } from './ModalWrapper';

interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, title = 'Error', message, onClose }) => {
  if (!isOpen) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} alignment="center">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xs sm:max-w-sm overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[85vh]">
        <div className="bg-rose-50 dark:bg-rose-900/20 p-4 sm:p-6 flex flex-col items-center justify-center border-b border-rose-100 dark:border-rose-800/50">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-100 dark:bg-rose-800/30 text-rose-500 dark:text-rose-400 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-inner">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-rose-700 dark:text-rose-300">{title}</h3>
        </div>

        <div className="p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 leading-relaxed">
            {message}
          </p>
          <Button variant="danger" fullWidth onClick={onClose} className="shadow-lg shadow-rose-100 dark:shadow-none text-xs sm:text-sm py-2 sm:py-2.5">
            Entendido
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
};