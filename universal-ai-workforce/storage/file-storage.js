/**
 * Universal AI Workforce - Atomic File Storage
 * Safe state persistence using temporary file rename patterns to prevent corruption.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export class FileStorage {
  constructor(options = {}) {
    this.filePath = options.filePath || path.resolve(process.cwd(), 'storage/state.json');
  }

  async saveState(stateData) {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    const tempFile = `${this.filePath}.tmp.${Date.now()}`;
    const payload = JSON.stringify(stateData, null, 2);

    // Write to temp file first
    await fs.writeFile(tempFile, payload, 'utf8');

    // Atomic rename
    await fs.rename(tempFile, this.filePath);
    return true;
  }

  async loadState() {
    try {
      await fs.access(this.filePath);
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return null; // No state exists yet
      }
      throw err;
    }
  }

  async clear() {
    try {
      await fs.unlink(this.filePath);
    } catch {
      // Ignore if file does not exist
    }
  }
}

export const globalStorage = new FileStorage();
