import { 
  Transaction, User, Goal, AppSettings, QuickAction, Account, Budget, Promo 
} from '../types';
import { storageService } from './storageService';
import { logger } from './loggerService';
import { db, auth } from '../firebaseConfig';

export interface QuantaBackupJSON {
  version: string;
  timestamp: string;
  user: User | null;
  settings: AppSettings | null;
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  quickActions: QuickAction[];
  promos: Promo[];
}

export const backupService = {
  /**
   * Generates a full system backup object.
   */
  async createBackup(): Promise<QuantaBackupJSON> {
    try {
      const [user, settings, accounts, transactions, goals, budgets, quickActions, promos] = await Promise.all([
        storageService.getUser(),
        storageService.getSettings(),
        storageService.getAccounts(),
        storageService.getTransactions(),
        storageService.getGoals(),
        storageService.getBudgets(),
        storageService.getQuickActions(),
        storageService.getPromos(),
      ]);

      const backup: QuantaBackupJSON = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        user: user || null,
        settings: settings || null,
        accounts: accounts || [],
        transactions: transactions || [],
        goals: goals || [],
        budgets: budgets || [],
        quickActions: quickActions || [],
        promos: promos || []
      };

      logger.success('backup', `Backup created with ${transactions.length} transactions`);
      return backup;
    } catch (error: any) {
      logger.error('backup', 'Failed to create backup', error);
      throw error;
    }
  },

  /**
   * Downloads the backup as a JSON file.
   */
  async downloadBackup() {
    const backup = await this.createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quanta_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Restores data from a backup object directly to Firestore.
   */
  async restoreBackup(file: File): Promise<{ restored: number; errors: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const json = e.target?.result as string;
          const backup: QuantaBackupJSON = JSON.parse(json);
          
          if (!backup.version) {
            throw new Error('Invalid backup format');
          }

          const user = auth?.currentUser;
          if (!user || !db) {
            throw new Error('Must be authenticated and online to restore to cloud');
          }
          const uid = user.uid;
          const userRef = db.collection('users').doc(uid);
          
          logger.info('backup', 'Starting Cloud Restore...');

          // BATCH WRITE HELPER
          const commitBatch = async (items: any[], collectionName: string) => {
            const BATCH_SIZE = 450; // Safety margin under 500
            const chunks = [];
            for (let i = 0; i < items.length; i += BATCH_SIZE) {
               chunks.push(items.slice(i, i + BATCH_SIZE));
            }

            for (const chunk of chunks) {
              const batch = db.batch();
              chunk.forEach((item: any) => {
                 if (item.id) {
                   const ref = userRef.collection(collectionName).doc(item.id);
                   batch.set(ref, item, { merge: true });
                 }
              });
              await batch.commit();
            }
          };

          // 1. Restore Sub-Collections
          await commitBatch(backup.accounts, 'accounts');
          await commitBatch(backup.transactions, 'transactions');
          await commitBatch(backup.goals, 'goals');
          await commitBatch(backup.budgets, 'budgets');
          await commitBatch(backup.quickActions, 'quick_actions');
          await commitBatch(backup.promos, 'promos');

          // 2. Restore Settings (Single Doc)
          if (backup.settings) {
            await userRef.collection('settings').doc('config').set(backup.settings, { merge: true });
          }

          // 3. Force Local Storage Update?
          // Instead of writing to LS manually, we should reload the page.
          // The App initializes `storageService` which fetches from Firebase if online.
          // Since we just wrote to Firebase, the next fetch will get this new data.
          
          logger.success('backup', `Cloud Restore successful.`);
          
          // Clear LS to force re-fetch
          localStorage.clear(); 
          // Note: clearing ALL LS might trigger a logout if auth token is there, 
          // but Firebase Auth persists in IndexDB usually. 
          // Safest to just reload.

          resolve({ restored: backup.transactions.length, errors: 0 });
          
          setTimeout(() => window.location.reload(), 1500);

        } catch (error: any) {
          logger.error('backup', 'Restore failed', error);
          alert('Restore Failed: ' + error.message);
          reject(error);
        }
      };
      
      reader.readAsText(file);
    });
  }
};
