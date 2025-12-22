/**
 * FIRESTORE RULES TESTS
 * =====================
 * Tests automatizados para validar las reglas de seguridad de Firestore.
 * 
 * Requisitos:
 * - @firebase/rules-unit-testing
 * - Firebase Emulator
 * 
 * Setup:
 * npm install --save-dev @firebase/rules-unit-testing
 * 
 * Ejecutar:
 * npm test -- firestore.rules.test.ts
 * 
 * Emulator:
 * firebase emulators:start --only firestore
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { setLogLevel } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { describe, beforeAll, afterAll, it, expect, beforeEach } from 'vitest';

// Silenciar logs de Firestore en tests
setLogLevel('error');

const PROJECT_ID = 'quanta-test';
const RULES_PATH = './firestore.rules';

let testEnv: RulesTestEnvironment;

describe('Firestore Rules - Goals Collection (Root Level)', () => {
  beforeAll(async () => {
    // Inicializar entorno de pruebas con reglas
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(RULES_PATH, 'utf8'),
        host: 'localhost',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    // Limpiar datos antes de cada test
    await testEnv.clearFirestore();
  });

  describe('CREATE - Crear Goals', () => {
    it('✅ Permite crear goal con datos válidos y usuario autenticado', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      await assertSucceeds(
        alice.firestore().collection('goals').add({
          userId: 'alice-uid',
          name: 'Ahorros para Vacaciones',
          targetAmount: 50000,
          currentAmount: 0,
          status: 'active',
          source: 'surplus_plan',
          periodKey: '2024-12',
          planId: 'balanced',
          category: 'savings',
          // createdAt se agrega automáticamente por serverTimestamp
        })
      );
    });

    it('✅ Permite crear goal sin createdAt (se agrega por serverTimestamp)', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      // El campo createdAt NO debe estar en hasAll() porque serverTimestamp
      // se procesa DESPUÉS de la validación
      await assertSucceeds(
        alice.firestore().collection('goals').add({
          userId: 'alice-uid',
          name: 'Test Goal',
          targetAmount: 1000,
          currentAmount: 0,
          status: 'active',
          source: 'manual',
        })
      );
    });

    it('❌ Rechaza crear goal sin autenticación', async () => {
      const unauth = testEnv.unauthenticatedContext();
      
      await assertFails(
        unauth.firestore().collection('goals').add({
          userId: 'alice-uid',
          name: 'Test Goal',
          targetAmount: 1000,
          currentAmount: 0,
          status: 'active',
          source: 'manual',
        })
      );
    });

    it('❌ Rechaza crear goal para otro usuario (userId diferente)', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      await assertFails(
        alice.firestore().collection('goals').add({
          userId: 'bob-uid', // Intentando crear para otro usuario
          name: 'Test Goal',
          targetAmount: 1000,
          currentAmount: 0,
          status: 'active',
          source: 'manual',
        })
      );
    });

    it('❌ Rechaza crear goal sin campo userId', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      await assertFails(
        alice.firestore().collection('goals').add({
          // userId faltante
          name: 'Test Goal',
          targetAmount: 1000,
          currentAmount: 0,
          status: 'active',
          source: 'manual',
        })
      );
    });

    it('❌ Rechaza crear goal con targetAmount negativo', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      await assertFails(
        alice.firestore().collection('goals').add({
          userId: 'alice-uid',
          name: 'Test Goal',
          targetAmount: -1000, // Negativo
          currentAmount: 0,
          status: 'active',
          source: 'manual',
        })
      );
    });

    it('❌ Rechaza crear goal con currentAmount > targetAmount', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      await assertFails(
        alice.firestore().collection('goals').add({
          userId: 'alice-uid',
          name: 'Test Goal',
          targetAmount: 1000,
          currentAmount: 2000, // Mayor que target
          status: 'active',
          source: 'manual',
        })
      );
    });

    it('❌ Rechaza crear goal con status inválido', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      await assertFails(
        alice.firestore().collection('goals').add({
          userId: 'alice-uid',
          name: 'Test Goal',
          targetAmount: 1000,
          currentAmount: 0,
          status: 'deleted', // No se puede crear como deleted
          source: 'manual',
        })
      );
    });
  });

  describe('READ - Leer Goals', () => {
    it('✅ Permite leer propios goals', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      // Crear goal
      const docRef = await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'manual',
      });

      // Leer goal
      await assertSucceeds(docRef.get());
    });

    it('✅ Permite query con filtro userId', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      // Crear goal
      await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'manual',
      });

      // Query con filtro userId
      await assertSucceeds(
        alice.firestore()
          .collection('goals')
          .where('userId', '==', 'alice-uid')
          .get()
      );
    });

    it('❌ Rechaza leer goals de otro usuario', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      const bob = testEnv.authenticatedContext('bob-uid');
      
      // Alice crea un goal
      const docRef = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore().collection('goals').add({
          userId: 'alice-uid',
          name: 'Alice Goal',
          targetAmount: 1000,
          currentAmount: 0,
          status: 'active',
          source: 'manual',
        });
      });

      // Bob intenta leerlo
      await assertFails(bob.firestore().collection('goals').doc(docRef.id).get());
    });

    it('❌ Rechaza leer sin autenticación', async () => {
      const unauth = testEnv.unauthenticatedContext();
      
      // Crear goal con reglas deshabilitadas
      const docRef = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore().collection('goals').add({
          userId: 'alice-uid',
          name: 'Test Goal',
          targetAmount: 1000,
          currentAmount: 0,
          status: 'active',
          source: 'manual',
        });
      });

      // Intentar leer sin auth
      await assertFails(unauth.firestore().collection('goals').doc(docRef.id).get());
    });
  });

  describe('UPDATE - Actualizar Goals', () => {
    it('✅ Permite actualizar propio goal', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      // Crear goal
      const docRef = await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'manual',
      });

      // Actualizar currentAmount
      await assertSucceeds(
        docRef.update({
          currentAmount: 500,
        })
      );
    });

    it('✅ Permite soft-delete (status=deleted + deletedAt)', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      // Crear goal
      const docRef = await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'manual',
      });

      // Soft-delete
      await assertSucceeds(
        docRef.update({
          status: 'deleted',
          // deletedAt: serverTimestamp() se procesa después de validación
        })
      );
    });

    it('✅ Permite marcar goal como completed', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      // Crear goal
      const docRef = await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'manual',
      });

      // Completar
      await assertSucceeds(
        docRef.update({
          status: 'completed',
          currentAmount: 1000,
        })
      );
    });

    it('❌ Rechaza cambiar userId', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      // Crear goal
      const docRef = await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'manual',
      });

      // Intentar cambiar userId
      await assertFails(
        docRef.update({
          userId: 'bob-uid', // No se puede cambiar
        })
      );
    });

    it('❌ Rechaza actualizar goal de otro usuario', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      const bob = testEnv.authenticatedContext('bob-uid');
      
      // Alice crea goal
      const docRef = await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Alice Goal',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'manual',
      });

      // Bob intenta actualizar
      await assertFails(
        bob.firestore().collection('goals').doc(docRef.id).update({
          currentAmount: 500,
        })
      );
    });

    it('❌ Rechaza actualizar con currentAmount > targetAmount', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      // Crear goal
      const docRef = await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'manual',
      });

      // Intentar actualizar con currentAmount mayor
      await assertFails(
        docRef.update({
          currentAmount: 2000, // Mayor que targetAmount
        })
      );
    });
  });

  describe('DELETE - Eliminar Goals (Físico)', () => {
    it('❌ Rechaza delete físico (debe usar soft-delete)', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      
      // Crear goal
      const docRef = await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'manual',
      });

      // Intentar delete físico (debe fallar)
      await assertFails(docRef.delete());
    });
  });

  describe('Escenarios Reales - Surplus Plan', () => {
    it('✅ Permite crear 3 goals desde surplus plan', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      const periodKey = '2024-12';
      const planId = 'balanced';

      // Crear 3 goals (savings, goals, personal)
      const categories = ['savings', 'goals', 'personal'];
      const amounts = [30000, 15000, 5000];

      for (let i = 0; i < categories.length; i++) {
        await assertSucceeds(
          alice.firestore().collection('goals').add({
            userId: 'alice-uid',
            name: `Meta ${categories[i]}`,
            targetAmount: amounts[i],
            currentAmount: 0,
            status: 'active',
            source: 'surplus_plan',
            periodKey,
            planId,
            category: categories[i],
          })
        );
      }
    });

    it('✅ Permite soft-delete batch de goals surplus_plan', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      const periodKey = '2024-12';

      // Crear 2 goals
      const doc1 = await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Goal 1',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'surplus_plan',
        periodKey,
      });

      const doc2 = await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Goal 2',
        targetAmount: 2000,
        currentAmount: 0,
        status: 'active',
        source: 'surplus_plan',
        periodKey,
      });

      // Soft-delete ambos
      await assertSucceeds(doc1.update({ status: 'deleted' }));
      await assertSucceeds(doc2.update({ status: 'deleted' }));
    });

    it('✅ Permite query hasGoalsForPeriod', async () => {
      const alice = testEnv.authenticatedContext('alice-uid');
      const periodKey = '2024-12';

      // Crear goal
      await alice.firestore().collection('goals').add({
        userId: 'alice-uid',
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        status: 'active',
        source: 'surplus_plan',
        periodKey,
      });

      // Query equivalente a hasGoalsForPeriod
      await assertSucceeds(
        alice.firestore()
          .collection('goals')
          .where('userId', '==', 'alice-uid')
          .where('periodKey', '==', periodKey)
          .where('source', '==', 'surplus_plan')
          .get()
      );
    });
  });
});
