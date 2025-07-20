import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

interface CacheEntry {
  data: any[];
  timestamp: number;
  updateInterval: number;
}

export class DaikinDataCache {
  private readonly cacheFilePath: string;

  constructor(cacheFilePath: string = './daikin-cache.json') {
    // Usa direttamente il path fornito, risolvendolo se relativo
    this.cacheFilePath = resolve(cacheFilePath);
  }

  /**
   * Controlla se i dati in cache sono ancora validi
   */
  private isDataValid(cacheEntry: CacheEntry): boolean {
    const now = Date.now();
    const timeDiff = (now - cacheEntry.timestamp) / 1000; // differenza in secondi
    return timeDiff < cacheEntry.updateInterval;
  }

  /**
   * Salva i dati nella cache
   */
  async saveData(data: any[], updateInterval: number): Promise<void> {
    try {
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        updateInterval
      };

      await writeFile(this.cacheFilePath, JSON.stringify(cacheEntry, null, 2));
      console.log('💾 Data cached successfully');
    } catch (error) {
      console.warn('⚠️ Failed to save data to cache:', error);
    }
  }

  /**
   * Carica i dati dalla cache se sono ancora validi
   */
  async loadData(currentUpdateInterval: number): Promise<any[] | null> {
    try {
      // Controlla se il file di cache esiste
      await access(this.cacheFilePath);

      const cacheContent = await readFile(this.cacheFilePath, 'utf-8');
      const cacheEntry: CacheEntry = JSON.parse(cacheContent);

      // Verifica se i dati sono ancora validi e l'intervallo non è cambiato
      if (this.isDataValid(cacheEntry) && cacheEntry.updateInterval === currentUpdateInterval) {
        const ageInSeconds = Math.floor((Date.now() - cacheEntry.timestamp) / 1000);
        console.log(`📁 Loading cached data (${ageInSeconds}s old, valid for ${cacheEntry.updateInterval}s)`);
        return cacheEntry.data;
      } else {
        const ageInSeconds = Math.floor((Date.now() - cacheEntry.timestamp) / 1000);
        console.log(`🕒 Cached data is stale (${ageInSeconds}s old, limit ${cacheEntry.updateInterval}s) - will fetch fresh data`);
        return null;
      }
    } catch (error) {
      // File non esiste o errore di lettura - nessun problema
      console.log('📭 No valid cache found - will fetch fresh data');
      return null;
    }
  }

  /**
   * Elimina il file di cache
   */
  async clearCache(): Promise<void> {
    try {
      await access(this.cacheFilePath);
      // Se il file esiste, potresti volerlo eliminare qui se necessario
      console.log('🗑️ Cache cleared');
    } catch (error) {
      // File non esiste - nessun problema
    }
  }

  /**
   * Ottieni informazioni sulla cache
   */
  async getCacheInfo(): Promise<{ exists: boolean; age?: number; valid?: boolean }> {
    try {
      await access(this.cacheFilePath);
      const cacheContent = await readFile(this.cacheFilePath, 'utf-8');
      const cacheEntry: CacheEntry = JSON.parse(cacheContent);

      const age = Math.floor((Date.now() - cacheEntry.timestamp) / 1000);
      const valid = this.isDataValid(cacheEntry);

      return {
        exists: true,
        age,
        valid
      };
    } catch (error) {
      return { exists: false };
    }
  }
}
