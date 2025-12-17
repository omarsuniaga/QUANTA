import React from 'react';
import { Transaction, CustomCategory } from '../types';
import { ArrowLeft } from 'lucide-react';

interface Props {
  category: string;
  transactions: Transaction[];
  customCategories: CustomCategory[];
  currencySymbol: string;
  currencyCode: string;
  onBack: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const CategoryProfileScreen: React.FC<Props> = ({
  category,
  transactions,
  customCategories,
  currencySymbol,
  currencyCode,
  onBack,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const displayName = (() => {
    const found = customCategories.find(c => c.id === category || c.key === category);
    if (found) return found.name?.es || found.name?.en || found.key;
    return category;
  })();

  const categoryTx = transactions.filter(t => t.category === category);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-md hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">{displayName}</h2>
        <div className="ml-auto text-sm text-slate-500">{currencySymbol}</div>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold">Transacciones ({categoryTx.length})</h3>
          <div className="mt-3 space-y-2">
            {categoryTx.length === 0 && (
              <p className="text-sm text-slate-400">No hay transacciones en esta categoría.</p>
            )}
            {categoryTx.map(tx => (
              <div key={tx.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{tx.description || tx.category}</div>
                  <div className="text-xs text-slate-400">{tx.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold">{tx.amount.toLocaleString()} {currencyCode}</div>
                  <button onClick={() => onEditTransaction(tx)} className="text-xs text-indigo-600">Editar</button>
                  <button onClick={() => onDeleteTransaction(tx.id)} className="text-xs text-rose-600">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
