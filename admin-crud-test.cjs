const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const BASE = 'http://localhost:5173';
const results = [];

function log(section, status, detail = '') {
  const icon = status === 'OK' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  results.push(`${icon} ${section}${detail ? ': ' + detail : ''}`);
  console.log(`${icon} ${section}${detail ? ': ' + detail : ''}`);
}

async function checkJs(page, jsErrors, section) {
  if (jsErrors.length) {
    log(section + ' JS fout', 'FAIL', jsErrors.join('; '));
    jsErrors.length = 0;
    return false;
  }
  return true;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  // =====================================================
  // LOGIN
  // =====================================================
  await page.goto(BASE + '/#/login');
  await page.waitForTimeout(1200);
  const adminBtn = page.locator('button:has-text("Admin"), button:has-text("Beheerder")').first();
  if (await adminBtn.count() > 0) {
    await adminBtn.click();
    await page.waitForTimeout(1000);
    log('Login als Admin', 'OK');
  } else {
    log('Login als Admin', 'FAIL', 'knop niet gevonden');
    await browser.close(); return;
  }

  // =====================================================
  // 1. KLANT AANMAKEN
  // =====================================================
  console.log('\n--- 1. KLANT AANMAKEN ---');
  await page.goto(BASE + '/#/klanten');
  await page.waitForTimeout(1200);
  await checkJs(page, jsErrors, 'Klanten laden');
  log('Klanten pagina', 'OK', await page.locator('h2').first().textContent().then(t => t.trim().substring(0,30)).catch(() => '?'));

  // Open modal
  const nieuweKlantBtn = page.locator('button:has-text("Nieuwe Klant")').first();
  if (await nieuweKlantBtn.count() > 0) {
    await nieuweKlantBtn.click();
    await page.waitForTimeout(600);
    const modalOpen = await page.locator('.fixed.inset-0').count() > 0;
    log('Klant modal openen', modalOpen ? 'OK' : 'FAIL');

    if (modalOpen) {
      // Fill naam (required)
      await page.locator('.fixed.inset-0 input').nth(0).fill('Test Beveiliging BV');
      await page.waitForTimeout(200);
      // Fill overige velden
      const inputs = await page.locator('.fixed.inset-0 input').all();
      if (inputs.length > 1) await inputs[1].fill('BE 0123456789');   // BTW
      if (inputs.length > 2) await inputs[2].fill('Jan Janssen');     // Contact
      if (inputs.length > 3) await inputs[3].fill('info@test.be');    // Email
      if (inputs.length > 4) await inputs[4].fill('+32 9 123 45 67'); // Tel
      if (inputs.length > 5) await inputs[5].fill('Teststraat 1, 9000 Gent'); // Adres
      log('Klant formulier invullen', 'OK');

      // Klik gouden Aanmaken knop
      const saveBtn = page.locator('.fixed.inset-0 button.bg-apex-gold');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(800);
        log('Klant opslaan klikken', 'OK');
      } else {
        log('Klant opslaan klikken', 'FAIL', 'knop niet gevonden');
      }
      await checkJs(page, jsErrors, 'Klant aanmaken');
    }
  } else {
    log('Klant modal openen', 'FAIL', '"Nieuwe Klant" knop niet gevonden');
  }

  // Verificeer in lijst
  const klantInList = await page.locator('text=Test Beveiliging BV').count();
  log('Klant zichtbaar in lijst', klantInList > 0 ? 'OK' : 'FAIL');

  // Persistentie na refresh
  await page.reload(); await page.waitForTimeout(1500);
  await checkJs(page, jsErrors, 'Klanten na refresh');
  const klantNaRefresh = await page.locator('text=Test Beveiliging BV').count();
  log('Klant persistentie na refresh', klantNaRefresh > 0 ? 'OK' : 'FAIL',
    klantNaRefresh > 0 ? 'klant blijft zichtbaar' : '❌ klant verdwenen!');

  // =====================================================
  // 2. SHIFT AANMAKEN
  // =====================================================
  console.log('\n--- 2. SHIFT AANMAKEN ---');
  await page.goto(BASE + '/#/planning');
  await page.waitForTimeout(1200);
  await checkJs(page, jsErrors, 'Planning laden');
  log('Planning pagina', 'OK', await page.locator('h2').first().textContent().then(t => t.trim().substring(0,30)).catch(() => '?'));

  const nieuweShiftBtn = page.locator('button:has-text("Nieuwe Shift")').first();
  if (await nieuweShiftBtn.count() > 0) {
    await nieuweShiftBtn.click();
    await page.waitForTimeout(600);
    const modalOpen = await page.locator('.fixed.inset-0').count() > 0;
    log('Shift modal openen', modalOpen ? 'OK' : 'FAIL');

    if (modalOpen) {
      // Selecteer klant
      const klantSelect = page.locator('.fixed.inset-0 select').first();
      if (await klantSelect.count() > 0) {
        const opties = await klantSelect.locator('option').all();
        let gevonden = false;
        for (const opt of opties) {
          const val = await opt.getAttribute('value');
          if (val && val.includes('Test Beveiliging')) {
            await klantSelect.selectOption(val);
            gevonden = true; break;
          }
        }
        log('Shift - klant selecteren', gevonden ? 'OK' : 'WARN',
          gevonden ? 'Test Beveiliging BV' : 'klant niet in lijst');
      }

      // Locatie
      const locInput = page.locator('.fixed.inset-0 input[placeholder="Locatie..."]');
      if (await locInput.count() > 0) {
        await locInput.fill('Hoofdingang A');
        log('Shift - locatie', 'OK', 'Hoofdingang A');
      } else {
        // try any text input in modal
        const anyInput = page.locator('.fixed.inset-0 input[type="text"]').first();
        if (await anyInput.count() > 0) {
          await anyInput.fill('Hoofdingang A');
          log('Shift - locatie (fallback)', 'OK');
        }
      }

      // Datum (morgen)
      const morgen = new Date();
      morgen.setDate(morgen.getDate() + 1);
      const dateStr = morgen.toISOString().split('T')[0];
      const dateInput = page.locator('.fixed.inset-0 input[type="date"]').first();
      if (await dateInput.count() > 0) await dateInput.fill(dateStr);

      // Tijden
      const tijdInputs = page.locator('.fixed.inset-0 input[type="time"]');
      if (await tijdInputs.count() >= 2) {
        await tijdInputs.nth(0).fill('08:00');
        await tijdInputs.nth(1).fill('16:00');
      }

      // Opslaan
      const saveBtn = page.locator('.fixed.inset-0 button.bg-apex-gold:not([disabled])');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
        log('Shift opslaan', 'OK');
      } else {
        // Check if disabled and why
        const disabledBtn = page.locator('.fixed.inset-0 button.bg-apex-gold');
        if (await disabledBtn.count() > 0) {
          log('Shift opslaan', 'FAIL', 'save knop disabled - klant/locatie ontbreekt?');
        } else {
          log('Shift opslaan', 'FAIL', 'save knop niet gevonden');
        }
        await page.keyboard.press('Escape');
      }
      await checkJs(page, jsErrors, 'Shift aanmaken');
    }
  } else {
    log('Shift modal', 'FAIL', 'knop niet gevonden');
  }

  // Persistentie
  await page.reload(); await page.waitForTimeout(1500);
  await checkJs(page, jsErrors, 'Planning na refresh');
  const shiftInList = await page.locator('text=Hoofdingang A').count();
  log('Shift persistentie na refresh', shiftInList > 0 ? 'OK' : 'FAIL',
    shiftInList > 0 ? 'shift zichtbaar' : '❌ shift verdwenen!');

  // =====================================================
  // 3. INCIDENT MELDEN
  // =====================================================
  console.log('\n--- 3. INCIDENT MELDEN ---');
  await page.goto(BASE + '/#/incidenten');
  await page.waitForTimeout(1200);
  await checkJs(page, jsErrors, 'Incidenten laden');
  log('Incidenten pagina', 'OK', await page.locator('h2').first().textContent().then(t => t.trim().substring(0,30)).catch(() => '?'));

  const incidentMeldenBtn = page.locator('button:has-text("Incident Melden")').first();
  if (await incidentMeldenBtn.count() > 0) {
    await incidentMeldenBtn.click();
    await page.waitForTimeout(600);
    const modalOpen = await page.locator('.fixed.inset-0').count() > 0;
    log('Incident modal openen', modalOpen ? 'OK' : 'FAIL');

    if (modalOpen) {
      // Titel
      const titleInput = page.locator('.fixed.inset-0 input[placeholder="Korte omschrijving..."]');
      if (await titleInput.count() > 0) {
        await titleInput.fill('Test Incident - Inbraakpoging');
        log('Incident - titel', 'OK');
      } else {
        log('Incident - titel', 'WARN', 'input niet gevonden');
      }

      // Beschrijving
      const descInput = page.locator('.fixed.inset-0 textarea').first();
      if (await descInput.count() > 0) {
        await descInput.fill('Onbekende probeerde via de hoofdingang binnen te dringen. Situatie onder controle.');
        log('Incident - beschrijving', 'OK');
      }

      // Opslaan
      const saveBtn = page.locator('.fixed.inset-0 button.bg-apex-gold:not([disabled])');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(800);
        log('Incident opslaan', 'OK');
      } else {
        // Try any button with save-like text
        const allBtns = await page.locator('.fixed.inset-0 button').all();
        let saved = false;
        for (const btn of allBtns) {
          const txt = (await btn.textContent().catch(() => '')) || '';
          if (/meld|opslaan|aanmaken|indienen/i.test(txt)) {
            await btn.click(); saved = true; break;
          }
        }
        log('Incident opslaan', saved ? 'OK' : 'FAIL', saved ? '' : 'geen klikbare save knop');
        if (!saved) await page.keyboard.press('Escape');
      }
      await checkJs(page, jsErrors, 'Incident aanmaken');
    }
  } else {
    log('Incident modal', 'FAIL', '"Incident Melden" knop niet gevonden');
  }

  // Persistentie
  await page.reload(); await page.waitForTimeout(1500);
  await checkJs(page, jsErrors, 'Incidenten na refresh');
  const incInList = await page.locator('text=Test Incident - Inbraakpoging').count();
  log('Incident persistentie na refresh', incInList > 0 ? 'OK' : 'FAIL',
    incInList > 0 ? 'incident zichtbaar' : '❌ incident verdwenen!');

  // =====================================================
  // 4. RAPPORT AANMAKEN
  // =====================================================
  console.log('\n--- 4. RAPPORT AANMAKEN ---');
  await page.goto(BASE + '/#/rapporten');
  await page.waitForTimeout(1200);
  await checkJs(page, jsErrors, 'Rapporten laden');
  log('Rapporten pagina', 'OK', await page.locator('h2').first().textContent().then(t => t.trim().substring(0,30)).catch(() => '?'));

  const nieuwRapportBtn = page.locator('button:has-text("Nieuw Rapport")').first();
  if (await nieuwRapportBtn.count() > 0) {
    await nieuwRapportBtn.click();
    await page.waitForTimeout(600);
    const modalOpen = await page.locator('.fixed.inset-0').count() > 0;
    log('Rapport modal openen', modalOpen ? 'OK' : 'FAIL');

    if (modalOpen) {
      const inputs = await page.locator('.fixed.inset-0 input[type="text"], .fixed.inset-0 textarea').all();
      let filled = false;
      for (const inp of inputs) {
        const ph = await inp.getAttribute('placeholder') || '';
        if (!ph.toLowerCase().includes('zoek')) {
          await inp.fill('Dagrapport Test Bewakingsronde');
          filled = true; break;
        }
      }
      log('Rapport - veld invullen', filled ? 'OK' : 'WARN');

      const saveBtn = page.locator('.fixed.inset-0 button.bg-apex-gold:not([disabled])');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(800);
        log('Rapport opslaan', 'OK');
      } else {
        await page.keyboard.press('Escape');
        log('Rapport opslaan', 'WARN', 'save knop disabled');
      }
      await checkJs(page, jsErrors, 'Rapport aanmaken');
    }
  } else {
    log('Rapport modal', 'WARN', '"Nieuw Rapport" knop niet gevonden');
  }

  // =====================================================
  // 5. SHIFTS & OVERIGE PAGINA'S
  // =====================================================
  console.log('\n--- 5. OVERIGE PAGINAS ---');
  for (const [naam, route] of [
    ["Shifts & Opdrachten", "/#/shifts"],
    ["Tijdregistraties", "/#/tijdregistraties"],
    ["Facturatie", "/#/facturatie"],
    ["Facturen", "/#/facturatie/facturen"],
    ["Facturatieronde", "/#/facturatie/ronde"],
    ["Export CSV", "/#/facturatie/export"],
    ["Personeel", "/#/personeel"],
    ["Instellingen", "/#/settings"],
    ["Dashboard", "/#/"],
  ]) {
    await page.goto(BASE + route);
    await page.waitForTimeout(800);
    const hasTitle = await page.locator('h1, h2').first().count() > 0;
    await checkJs(page, jsErrors, naam);
    log(naam, hasTitle ? 'OK' : 'WARN');
  }

  // =====================================================
  // SAMENVATTING
  // =====================================================
  await browser.close();
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║      VOLLEDIG TESTRAPPORT ADMIN      ║');
  console.log('╚══════════════════════════════════════╝');
  const fails = results.filter(r => r.startsWith('❌'));
  const warns = results.filter(r => r.startsWith('⚠️'));
  const oks   = results.filter(r => r.startsWith('✅'));
  console.log(`\n✅ ${oks.length} OK   ⚠️ ${warns.length} WARN   ❌ ${fails.length} FAIL\n`);
  if (fails.length) { console.log('FOUTEN:'); fails.forEach(f => console.log('  ' + f)); }
  if (warns.length) { console.log('\nWAARSCHUWINGEN:'); warns.forEach(w => console.log('  ' + w)); }
  if (fails.length === 0) console.log('\n🎉 Geen fouten gevonden!');
})();
