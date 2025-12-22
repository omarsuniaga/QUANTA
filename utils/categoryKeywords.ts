import { Category } from '../types';

/**
 * Keyword Dictionary for Hybrid Intelligence
 * 
 * This dictionary maps common keywords found in transaction descriptions
 * to specific Categories. This serves as the "Layer 2" heuristic engine,
 * allowing for instant, zero-cost classification before falling back to AI.
 */

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  [Category.Food]: [
    'restaurante', 'restaurant', 'comida', 'food', 'cena', 'dinner', 'almuerzo', 'lunch',
    'desayuno', 'breakfast', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'burger', 'pizza',
    'tacos', 'sushi', 'supermercado', 'supermarket', 'walmart', 'costco', 'grocery', 'mercado',
    'tienda', 'oxxo', 'seven', 'uber eats', 'rappi', 'pedidosya', 'foodora', 'doordash'
  ],
  [Category.Transportation]: [
    'uber', 'cabify', 'didi', 'lyft', 'taxi', 'bus', 'autobus', 'metro', 'subway', 'tren',
    'train', 'gasolina', 'gas', 'fuel', 'petrol', 'estacionamiento', 'parking', 'peaje', 'toll',
    'mecanico', 'mechanic', 'taller', 'aceite', 'llantas', 'tires', 'boleto', 'ticket', 'avion',
    'flight', 'airline', 'aerolinea', 'delta', 'american', 'united', 'vuelo'
  ],
  [Category.Housing]: [
    'renta', 'rent', 'alquiler', 'hipoteca', 'mortgage', 'casa', 'home', 'depto', 'apartment',
    'mantenimiento', 'maintenance', 'reparacion', 'repair', 'muebles', 'furniture', 'ikea',
    'homedepot', 'ferreteria', 'hardware'
  ],
  [Category.Utilities]: [
    'luz', 'electricidad', 'electricity', 'cfe', 'enel', 'agua', 'water', 'gas', 'internet',
    'wifi', 'cable', 'telefono', 'phone', 'celular', 'mobile', 'telcel', 'movistar', 'at&t',
    't-mobile', 'verizon', 'claro', 'recarga'
  ],
  [Category.Services]: [
    'netflix', 'spotify', 'hbo', 'disney', 'amazon prime', 'hulu', 'youtube', 'apple', 'icloud',
    'google', 'dropbox', 'microsoft', 'adobe', 'chatgpt', 'openai', 'midjourney', 'patreon',
    'suscripcion', 'subscription', 'membership', 'membresia', 'gym', 'gimnasio', 'smart fit'
  ],
  [Category.Health]: [
    'doctor', 'medico', 'consult', 'consulta', 'farmacia', 'pharmacy', 'drugstore', 'medicina',
    'medicine', 'hospital', 'clinica', 'clinic', 'dentista', 'dentist', 'dental', 'ojos', 'eyes',
    'optica', 'glasses', 'lentes', 'terapia', 'therapy', 'psicologo', 'psychologist', 'seguro',
    'insurance', 'salud', 'health'
  ],
  [Category.Entertainment]: [
    'cine', 'cinema', 'movie', 'pelicula', 'teatro', 'theater', 'concierto', 'concert', 'boletos',
    'tickets', 'ticketmaster', 'juego', 'game', 'videojuego', 'steam', 'playstation', 'xbox',
    'nintendo', 'boliche', 'bowling', 'bar', 'antro', 'club', 'pub', 'cerveza', 'beer', 'alcohol',
    'fiesta', 'party'
  ],
  [Category.Investments]: [
    'inversion', 'investment', 'acciones', 'stocks', 'bonos', 'bonds', 'crypto', 'bitcoin', 'btc',
    'eth', 'binance', 'coinbase', 'etoro', 'robinhood', 'gbp', 'gbm', 'cetes', 'ahorro', 'savings',
    'deposito', 'deposit'
  ],
  [Category.Salary]: [
    'nomina', 'payroll', 'sueldo', 'salary', 'pago', 'payment', 'deposito', 'transferencia',
    'honorarios', 'fees', 'bonus', 'aguinaldo'
  ],
  [Category.Freelance]: [
    'freelance', 'cliente', 'client', 'proyecto', 'project', 'servicio', 'service', 'venta', 'sale',
    'upwork', 'fiverr', 'workana'
  ],
  // Add other categories as needed...
};

/**
 * Rapidly classifies a transaction description using the local keyword dictionary.
 * Returns null if no match is found (implying fallback to AI).
 * 
 * @param description The raw transaction description
 * @returns Category enum value or null
 */
export const classifyByKeywords = (description: string): string | null => {
  const normalizedDesc = description.toLowerCase().trim();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // Check if any keyword matches "word boundaries" to avoid partial matches
    // e.g. "bus" matches "bus stop" but not "business"
    // For simplicity and speed, we start with simple includes for now, 
    // but word boundary regex is safer for short words.
    
    for (const keyword of keywords) {
      if (normalizedDesc.includes(keyword)) {
        return category;
      }
    }
  }
  
  return null;
};
