import { describe, it, expect } from 'vitest';
import nl from '../i18n/nl.ts';

// SMOKE TEST: Anti-wissen alarm
// Ensures all core modules are defined in the translations, implying they exist in the UI
describe('Critical Module Smoke Test', () => {
  const CORE_MODULES = [
    'dashboard',
    'personeel',
    'planning',
    'shifts',
    'tijdregistraties',
    'rapporten',
    'incidenten',
    'klanten',
    'facturatie'
  ];

  it('should have translation keys for all core modules', () => {
    // Check if the 'nav' section exists and contains all core module keys
    expect(nl).toHaveProperty('nav');
    
    // Using explicit loop for clearer failure messages if one is missing
    CORE_MODULES.forEach(moduleName => {
      expect(nl.nav).toHaveProperty(moduleName);
    });
  });
});