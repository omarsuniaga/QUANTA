import React, { useState, useEffect } from 'react';
import { X, Delete, Equal, Plus, Minus, X as Multiply, Divide, Check } from 'lucide-react';

interface CalculatorProps {
  initialValue?: number;
  onConfirm: (value: number) => void;
  onClose: () => void;
  currencySymbol?: string;
}

export const Calculator: React.FC<CalculatorProps> = ({
  initialValue = 0,
  onConfirm,
  onClose,
  currencySymbol = '$'
}) => {
  const [display, setDisplay] = useState(initialValue > 0 ? initialValue.toString() : '0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('');

  useEffect(() => {
    if (initialValue > 0) {
      setDisplay(initialValue.toString());
      setExpression(initialValue.toString());
    }
  }, [initialValue]);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
      setExpression(prev => prev + digit);
    } else {
      if (display === '0' && digit !== '.') {
        setDisplay(digit);
        if (expression === '' || expression === '0') {
          setExpression(digit);
        } else {
          setExpression(prev => prev + digit);
        }
      } else {
        // Prevent multiple decimals
        if (digit === '.' && display.includes('.')) return;
        setDisplay(display + digit);
        setExpression(prev => prev + digit);
      }
    }
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result = currentValue;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '×':
          result = currentValue * inputValue;
          break;
        case '÷':
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
    
    // Update expression
    const opSymbol = nextOperation === '×' ? '×' : nextOperation === '÷' ? '÷' : nextOperation;
    setExpression(prev => prev + ' ' + opSymbol + ' ');
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    let result = previousValue;

    switch (operation) {
      case '+':
        result = previousValue + inputValue;
        break;
      case '-':
        result = previousValue - inputValue;
        break;
      case '×':
        result = previousValue * inputValue;
        break;
      case '÷':
        result = inputValue !== 0 ? previousValue / inputValue : 0;
        break;
    }

    // Round to 2 decimals
    result = Math.round(result * 100) / 100;

    setDisplay(String(result));
    setExpression(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setExpression('');
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
      setExpression(prev => prev.slice(0, -1));
    } else {
      setDisplay('0');
      setExpression('');
    }
  };

  const handleConfirm = () => {
    // Calculate if there's a pending operation
    if (operation && previousValue !== null) {
      calculate();
    }
    const finalValue = parseFloat(display) || 0;
    onConfirm(Math.round(finalValue * 100) / 100);
  };

  const buttons = [
    { label: 'C', action: clear, className: 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200' },
    { label: '⌫', action: backspace, className: 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200' },
    { label: '÷', action: () => performOperation('÷'), className: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' },
    { label: '×', action: () => performOperation('×'), className: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' },
    { label: '7', action: () => inputDigit('7'), className: 'bg-white dark:bg-slate-700' },
    { label: '8', action: () => inputDigit('8'), className: 'bg-white dark:bg-slate-700' },
    { label: '9', action: () => inputDigit('9'), className: 'bg-white dark:bg-slate-700' },
    { label: '-', action: () => performOperation('-'), className: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' },
    { label: '4', action: () => inputDigit('4'), className: 'bg-white dark:bg-slate-700' },
    { label: '5', action: () => inputDigit('5'), className: 'bg-white dark:bg-slate-700' },
    { label: '6', action: () => inputDigit('6'), className: 'bg-white dark:bg-slate-700' },
    { label: '+', action: () => performOperation('+'), className: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' },
    { label: '1', action: () => inputDigit('1'), className: 'bg-white dark:bg-slate-700' },
    { label: '2', action: () => inputDigit('2'), className: 'bg-white dark:bg-slate-700' },
    { label: '3', action: () => inputDigit('3'), className: 'bg-white dark:bg-slate-700' },
    { label: '=', action: calculate, className: 'bg-emerald-500 text-white row-span-2' },
    { label: '0', action: () => inputDigit('0'), className: 'bg-white dark:bg-slate-700 col-span-2' },
    { label: '.', action: () => inputDigit('.'), className: 'bg-white dark:bg-slate-700' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div 
        className="bg-slate-50 dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-80">Calculadora</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Expression */}
          {expression && expression !== display && (
            <div className="text-sm opacity-70 text-right truncate mb-1">
              {expression}
            </div>
          )}
          
          {/* Display */}
          <div className="text-right">
            <span className="text-lg opacity-70">{currencySymbol}</span>
            <span className="text-4xl font-bold ml-1">
              {parseFloat(display).toLocaleString('en-US', { 
                minimumFractionDigits: display.includes('.') ? display.split('.')[1]?.length || 0 : 0,
                maximumFractionDigits: 2 
              })}
            </span>
          </div>
        </div>

        {/* Keypad */}
        <div className="p-3 grid grid-cols-4 gap-2">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              className={`
                ${btn.className}
                ${btn.label === '=' ? 'row-span-2' : ''}
                ${btn.label === '0' ? 'col-span-2' : ''}
                p-4 rounded-xl font-bold text-xl
                active:scale-95 transition-all
                shadow-sm hover:shadow-md
                text-slate-800 dark:text-white
              `}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Confirm Button */}
        <div className="p-3 pt-0">
          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none"
          >
            <Check className="w-5 h-5" />
            Usar {currencySymbol} {parseFloat(display).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </button>
        </div>
      </div>
    </div>
  );
};
