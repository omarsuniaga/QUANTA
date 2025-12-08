import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider, AuthProvider, SettingsProvider, TransactionsProvider, I18nProvider } from './contexts';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <TransactionsProvider>
              <App />
            </TransactionsProvider>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  </React.StrictMode>
);