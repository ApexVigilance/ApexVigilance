const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASE = 'http://localhost:5173';

const results = [];
const bugs = [];

function log(section, status, detail = '') {
  const icon = status === 'OK' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  const msg = `${icon} ${section}${detail ? ': ' + detail : ''}`;
  results.push(msg);
  console.log(msg);
  if (status === 'FAIL') bugs.push(msg);
}

async function waitAndCheck(page, selector, timeout = 3000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch { return false; }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  const checkJs = (label) => {
    if (jsErrors.length) { log(label + ' JS fout', 'FAIL', jsErrors.splice(0).join('; ')); }
  };

  // ════════════════════════════════════════
  // LOGIN
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/login');
  await page.waitForTimeout(1500);
  checkJs('Login pagina');

  const adminBtn = page.locator('button:has-text("Admin"), button:has-text("Beheerder")').first();
  if (await adminBtn.count() > 0) {
    await adminBtn.click();
    await page.waitForTimeout(1500);
    log('Login als Admin', 'OK');
  } else {
    log('Login als Admin', 'FAIL', 'login knop niet gevonden');
    await browser.close(); return;
  }

  // ════════════════════════════════════════
  // DASHBOARD
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/');
  await page.waitForTimeout(1500);
  checkJs('Dashboard');
  const dashH = await page.locator('h2').first().textContent().catch(() => '');
  log('Dashboard laadt', dashH ? 'OK' : 'FAIL', dashH?.trim() || 'geen titel');
  // Check stat cards visible
  const statCards = await page.locator('[class*="rounded-xl"]').count();
  log('Dashboard - stat cards', statCards > 2 ? 'OK' : 'WARN', `${statCards} kaarten`);

  // ════════════════════════════════════════
  // KLANTEN - AANMAKEN
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/klanten');
  await page.waitForTimeout(1500);
  checkJs('Klanten pagina');
  const klantH = await page.locator('h2').first().textContent().catch(() => '');
  log('Klanten pagina laadt', klantH ? 'OK' : 'FAIL', klantH?.trim() || '');

  // Zoek "Nieuwe Klant" knop
  const nieuwKlantBtn = page.locator('button:has-text("Nieuwe Klant"), button:has-text("Klant Aanmaken"), button:has-text("nieuw")').first();
  const nieuwKlantCount = await nieuwKlantBtn.count();
  log('Klanten - "Nieuwe Klant" knop zichtbaar', nieuwKlantCount > 0 ? 'OK' : 'FAIL',
    nieuwKlantCount === 0 ? 'KNOP NIET GEVONDEN - admin kan geen klant aanmaken!' : '');

  if (nieuwKlantCount > 0) {
    await nieuwKlantBtn.click();
    await page.waitForTimeout(800);
    checkJs('Klant modal openen');
    const modalOpen = await page.locator('.fixed.inset-0').count() > 0;
    log('Klanten - modal opent', modalOpen ? 'OK' : 'FAIL');

    if (modalOpen) {
      const inputs = await page.locator('.fixed.inset-0 input').all();
      log('Klanten - formulier velden', inputs.length >= 4 ? 'OK' : 'WARN', `${inputs.length} velden`);
      if (inputs.length > 0) {
        await inputs[0].fill('Testklant NV');
        if (inputs.length > 1) await inputs[1].fill('BE 0987654321');
        if (inputs.length > 2) await inputs[2].fill('Piet Pieters');
        if (inputs.length > 3) await inputs[3].fill('piet@testklant.be');
        if (inputs.length > 4) await inputs[4].fill('+32 3 456 78 90');
        if (inputs.length > 5) await inputs[5].fill('Industrieweg 5, 2000 Antwerpen');
      }
      // Zoek save knop
      const saveBtn = page.locator('.fixed.inset-0 button.bg-apex-gold, .fixed.inset-0 button:has-text("aanmaken")').first();
      const saveBtnCount = await saveBtn.count();
      log('Klanten - opslaan knop', saveBtnCount > 0 ? 'OK' : 'FAIL', saveBtnCount === 0 ? 'geen gouden knop' : '');
      if (saveBtnCount > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
        checkJs('Klant opslaan');
      }
    }
  }

  // Verificeer klant in lijst
  await page.waitForTimeout(500);
  const klantInList = await page.locator('text=Testklant NV').count();
  log('Klanten - klant zichtbaar na aanmaken', klantInList > 0 ? 'OK' : 'FAIL',
    klantInList === 0 ? 'klant verschijnt niet in lijst!' : 'Testklant NV zichtbaar');

  // Refresh test
  await page.reload(); await page.waitForTimeout(1500);
  const klantNaRefresh = await page.locator('text=Testklant NV').count();
  log('Klanten - persistentie na refresh', klantNaRefresh > 0 ? 'OK' : 'FAIL',
    klantNaRefresh === 0 ? 'klant verdwenen na refresh!' : 'blijft staan');

  // Klant detail pagina
  const klantCard = page.locator('text=Testklant NV').first();
  if (await klantCard.count() > 0) {
    await klantCard.click();
    await page.waitForTimeout(1000);
    checkJs('Klant detail');
    const detailH = await page.locator('h1, h2').first().textContent().catch(() => '');
    log('Klanten - detail pagina', detailH ? 'OK' : 'FAIL', detailH?.trim() || '');
    await page.goBack(); await page.waitForTimeout(800);
  }

  // ════════════════════════════════════════
  // PERSONEEL
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/personeel');
  await page.waitForTimeout(1500);
  checkJs('Personeel pagina');
  const persH = await page.locator('h2').first().textContent().catch(() => '');
  log('Personeel pagina laadt', persH ? 'OK' : 'FAIL', persH?.trim() || '');
  // Check filters & zoekbalk
  const zoekbalk = await page.locator('input[placeholder]').first().count();
  log('Personeel - zoekbalk aanwezig', zoekbalk > 0 ? 'OK' : 'WARN');
  const emptyState = await page.locator('text=Geen personeelsleden, text=geen medewerkers').count();
  log('Personeel - lege staat correct', emptyState > 0 ? 'OK' : 'WARN', 'toont lege staat bij geen medewerkers');

  // ════════════════════════════════════════
  // PLANNING - SHIFT AANMAKEN
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/planning');
  await page.waitForTimeout(1500);
  checkJs('Planning pagina');
  const planH = await page.locator('h2').first().textContent().catch(() => '');
  log('Planning pagina laadt', planH ? 'OK' : 'FAIL', planH?.trim() || '');

  const newShiftBtn = page.locator('button:has-text("Nieuwe Shift")').first();
  if (await newShiftBtn.count() > 0) {
    await newShiftBtn.click();
    await page.waitForTimeout(800);
    checkJs('Shift modal');
    const modalOpen = await page.locator('.fixed.inset-0').count() > 0;
    log('Planning - shift modal opent', modalOpen ? 'OK' : 'FAIL');

    if (modalOpen) {
      // Klant selecteren
      const klantSelect = page.locator('.fixed.inset-0 select').first();
      if (await klantSelect.count() > 0) {
        const opts = await klantSelect.locator('option').all();
        let found = false;
        for (const opt of opts) {
          const v = await opt.getAttribute('value');
          if (v && v.includes('Testklant')) { await klantSelect.selectOption(v); found = true; break; }
        }
        if (!found && opts.length > 1) await klantSelect.selectOption({ index: 1 });
        log('Planning - klant selecteren in modal', 'OK');
      }
      // Locatie
      const locInput = page.locator('.fixed.inset-0 input[type="text"]').first();
      if (await locInput.count() > 0) { await locInput.fill('Magazijn B'); }

      // Datum
      const morgen = new Date(); morgen.setDate(morgen.getDate() + 1);
      const dateInput = page.locator('.fixed.inset-0 input[type="date"]').first();
      if (await dateInput.count() > 0) await dateInput.fill(morgen.toISOString().split('T')[0]);

      // Tijden
      const tijden = page.locator('.fixed.inset-0 input[type="time"]');
      if (await tijden.count() >= 2) { await tijden.nth(0).fill('07:00'); await tijden.nth(1).fill('15:00'); }

      // Opslaan
      const saveBtn = page.locator('.fixed.inset-0 button.bg-apex-gold:not([disabled])');
      if (await saveBtn.count() > 0) {
        await saveBtn.click(); await page.waitForTimeout(1000);
        log('Planning - shift aangemaakt', 'OK');
        checkJs('Shift aanmaken');
      } else {
        const disabledBtn = page.locator('.fixed.inset-0 button.bg-apex-gold');
        log('Planning - shift opslaan', 'FAIL',
          await disabledBtn.count() > 0 ? 'knop disabled (klant/locatie ontbreekt?)' : 'geen save knop');
        await page.keyboard.press('Escape');
      }
    }
  } else {
    log('Planning - "Nieuwe Shift" knop', 'FAIL', 'niet gevonden');
  }

  // Refresh
  await page.reload(); await page.waitForTimeout(1500);
  const shiftInList = await page.locator('text=Magazijn B').count();
  log('Planning - shift persistentie', shiftInList > 0 ? 'OK' : 'FAIL',
    shiftInList === 0 ? 'shift verdwenen na refresh!' : 'shift blijft staan');

  // ════════════════════════════════════════
  // SHIFTS OVERZICHT
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/shifts');
  await page.waitForTimeout(1500);
  checkJs('Shifts pagina');
  const shiftsH = await page.locator('h2').first().textContent().catch(() => '');
  log('Shifts pagina laadt', shiftsH ? 'OK' : 'FAIL', shiftsH?.trim() || '');
  const shiftsVisible = await page.locator('text=Magazijn B').count();
  log('Shifts - aangemaakte shift zichtbaar', shiftsVisible > 0 ? 'OK' : 'WARN',
    shiftsVisible === 0 ? 'shift niet in overzicht' : 'OK');

  // Klik op shift detail
  if (shiftsVisible > 0) {
    await page.locator('text=Magazijn B').first().click();
    await page.waitForTimeout(1000);
    checkJs('Shift detail');
    const shiftDetailH = await page.locator('h1, h2').first().textContent().catch(() => '');
    log('Shifts - detail pagina', shiftDetailH ? 'OK' : 'FAIL', shiftDetailH?.trim() || '');
    await page.goBack(); await page.waitForTimeout(800);
  }

  // ════════════════════════════════════════
  // INCIDENTEN
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/incidenten');
  await page.waitForTimeout(1500);
  checkJs('Incidenten pagina');
  const incH = await page.locator('h2').first().textContent().catch(() => '');
  log('Incidenten pagina laadt', incH ? 'OK' : 'FAIL', incH?.trim() || '');

  const incBtn = page.locator('button:has-text("Incident Melden")').first();
  if (await incBtn.count() > 0) {
    await incBtn.click(); await page.waitForTimeout(800);
    const incModal = await page.locator('.fixed.inset-0').count() > 0;
    log('Incidenten - modal opent', incModal ? 'OK' : 'FAIL');
    if (incModal) {
      const titleInput = page.locator('.fixed.inset-0 input[placeholder*="omschrijving"], .fixed.inset-0 input[placeholder*="titel"]').first();
      if (await titleInput.count() > 0) await titleInput.fill('Verdachte persoon aan ingang');
      const descInput = page.locator('.fixed.inset-0 textarea').first();
      if (await descInput.count() > 0) await descInput.fill('Onbekende man probeerde toegang te krijgen tot afgesloten zone.');
      const saveBtn = page.locator('.fixed.inset-0 button.bg-apex-gold:not([disabled])');
      if (await saveBtn.count() > 0) { await saveBtn.click(); await page.waitForTimeout(800); log('Incidenten - aangemaakt', 'OK'); }
      else {
        const allBtns = await page.locator('.fixed.inset-0 button').all();
        let saved = false;
        for (const b of allBtns) { const t = await b.textContent().catch(() => ''); if (/meld|opslaan|aanmaken/i.test(t||'')) { await b.click(); saved = true; break; } }
        log('Incidenten - opslaan', saved ? 'OK' : 'FAIL', saved ? '' : 'geen klikbare save knop');
        if (!saved) await page.keyboard.press('Escape');
      }
      checkJs('Incident aanmaken');
    }
  } else { log('Incidenten - "Incident Melden" knop', 'FAIL', 'niet gevonden'); }

  await page.reload(); await page.waitForTimeout(1500);
  const incInList = await page.locator('text=Verdachte persoon').count();
  log('Incidenten - persistentie', incInList > 0 ? 'OK' : 'FAIL',
    incInList === 0 ? 'incident verdwenen!' : 'blijft staan');

  // ════════════════════════════════════════
  // RAPPORTEN
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/rapporten');
  await page.waitForTimeout(1500);
  checkJs('Rapporten pagina');
  const rapH = await page.locator('h2').first().textContent().catch(() => '');
  log('Rapporten pagina laadt', rapH ? 'OK' : 'FAIL', rapH?.trim() || '');

  const rapBtn = page.locator('button:has-text("Nieuw Rapport")').first();
  if (await rapBtn.count() > 0) {
    await rapBtn.click(); await page.waitForTimeout(800);
    const rapModal = await page.locator('.fixed.inset-0').count() > 0;
    log('Rapporten - modal opent', rapModal ? 'OK' : 'FAIL');
    if (rapModal) {
      const rapInputs = await page.locator('.fixed.inset-0 input[type="text"], .fixed.inset-0 textarea').all();
      for (const inp of rapInputs) {
        const ph = await inp.getAttribute('placeholder') || '';
        if (!ph.toLowerCase().includes('zoek')) { await inp.fill('Dagrapport bewakingsronde'); break; }
      }
      const saveBtn = page.locator('.fixed.inset-0 button.bg-apex-gold:not([disabled])');
      if (await saveBtn.count() > 0) { await saveBtn.click(); await page.waitForTimeout(800); log('Rapporten - aangemaakt', 'OK'); }
      else { await page.keyboard.press('Escape'); log('Rapporten - opslaan', 'WARN', 'save knop disabled'); }
      checkJs('Rapport aanmaken');
    }
  } else { log('Rapporten - "Nieuw Rapport" knop', 'FAIL', 'niet gevonden'); }

  // ════════════════════════════════════════
  // TIJDREGISTRATIES
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/tijdregistraties');
  await page.waitForTimeout(1500);
  checkJs('Tijdregistraties pagina');
  const tijdH = await page.locator('h2').first().textContent().catch(() => '');
  log('Tijdregistraties pagina laadt', tijdH ? 'OK' : 'FAIL', tijdH?.trim() || '');
  const tijdContent = await page.locator('[class*="grid"], [class*="table"], [class*="space-y"]').count();
  log('Tijdregistraties - inhoud zichtbaar', tijdContent > 0 ? 'OK' : 'WARN');

  // ════════════════════════════════════════
  // FACTURATIE
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/facturatie');
  await page.waitForTimeout(1500);
  checkJs('Facturatie dashboard');
  const factH = await page.locator('h2').first().textContent().catch(() => '');
  log('Facturatie dashboard laadt', factH ? 'OK' : 'FAIL', factH?.trim() || '');

  // Check "Nieuwe Factuur" knop
  const nieuwFactuurBtn = page.locator('button:has-text("Nieuwe Factuur")').first();
  log('Facturatie - "Nieuwe Factuur" knop', await nieuwFactuurBtn.count() > 0 ? 'OK' : 'FAIL');

  // Ga naar Nieuwe Factuur pagina
  await page.goto(BASE + '/#/facturatie/nieuw');
  await page.waitForTimeout(1500);
  checkJs('Nieuwe factuur pagina');
  const nieuwFactH = await page.locator('h2').first().textContent().catch(() => '');
  log('Nieuwe Factuur pagina laadt', nieuwFactH ? 'OK' : 'FAIL', nieuwFactH?.trim() || '');

  // Check tabs aanwezig
  const tabShifts = await page.locator('button:has-text("Op basis van shifts"), button:has-text("shifts")').count();
  const tabHandmatig = await page.locator('button:has-text("Handmatig")').count();
  log('Nieuwe Factuur - tab "Van shifts"', tabShifts > 0 ? 'OK' : 'FAIL');
  log('Nieuwe Factuur - tab "Handmatig"', tabHandmatig > 0 ? 'OK' : 'FAIL');

  // Test handmatige factuur
  if (tabHandmatig > 0) {
    await page.locator('button:has-text("Handmatig")').first().click();
    await page.waitForTimeout(500);
    const klantDrop = page.locator('select').first();
    if (await klantDrop.count() > 0) {
      const opts = await klantDrop.locator('option').all();
      if (opts.length > 1) await klantDrop.selectOption({ index: 1 });
    }
    // Check factuurlijn
    const lijnInputs = await page.locator('input[type="number"]').count();
    log('Nieuwe Factuur - handmatig formulier', lijnInputs > 0 ? 'OK' : 'FAIL', `${lijnInputs} numerieke velden`);
    // Prijs invullen
    const prijsInput = page.locator('input[type="number"]').nth(1);
    if (await prijsInput.count() > 0) await prijsInput.fill('500');
    await page.waitForTimeout(300);
    const totaal = await page.locator('text=€').last().textContent().catch(() => '');
    log('Nieuwe Factuur - live berekening', totaal ? 'OK' : 'WARN', totaal?.trim() || '');
    checkJs('Handmatige factuur');
  }

  // Facturen lijst
  await page.goto(BASE + '/#/facturatie/facturen');
  await page.waitForTimeout(1500);
  checkJs('Facturen lijst');
  const facturenH = await page.locator('h1').first().textContent().catch(() => '');
  log('Facturen overzicht laadt', facturenH ? 'OK' : 'FAIL', facturenH?.trim() || '');
  const nieuwFactuurInList = await page.locator('button:has-text("Nieuwe Factuur")').count();
  log('Facturen lijst - "Nieuwe Factuur" knop', nieuwFactuurInList > 0 ? 'OK' : 'FAIL');

  // Export
  await page.goto(BASE + '/#/facturatie/export');
  await page.waitForTimeout(1500);
  checkJs('Export pagina');
  log('Facturatie export laadt', 'OK');

  // ════════════════════════════════════════
  // INSTELLINGEN
  // ════════════════════════════════════════
  await page.goto(BASE + '/#/settings');
  await page.waitForTimeout(1500);
  checkJs('Instellingen pagina');
  const settH = await page.locator('h2').first().textContent().catch(() => '');
  log('Instellingen pagina laadt', settH ? 'OK' : 'FAIL', settH?.trim() || '');

  // Check SMTP velden
  const smtpHost = await page.locator('input[type="text"]').filter({ hasText: '' }).count();
  log('Instellingen - SMTP velden', smtpHost > 0 ? 'OK' : 'WARN');
  const smtpPass = await page.locator('input[type="password"]').count();
  log('Instellingen - wachtwoord veld', smtpPass > 0 ? 'OK' : 'FAIL', smtpPass === 0 ? 'geen wachtwoord veld' : '');

  // Logo upload
  const logoUpload = await page.locator('input[type="file"]').count();
  log('Instellingen - upload velden aanwezig', logoUpload > 0 ? 'OK' : 'WARN', `${logoUpload} file inputs`);

  // Tarieven tabel
  const tarievenTabel = await page.locator('table').count();
  log('Instellingen - tarieven tabel', tarievenTabel > 0 ? 'OK' : 'FAIL', tarievenTabel === 0 ? 'tarieven tabel ontbreekt' : '');

  // Reset knop
  const resetBtn = await page.locator('button:has-text("Reset")').count();
  log('Instellingen - Reset knop', resetBtn > 0 ? 'OK' : 'FAIL');

  // ════════════════════════════════════════
  // AGENT SECTIE
  // ════════════════════════════════════════
  // Logout first: clear localStorage and force full page reload so Zustand reinitializes
  await page.evaluate(() => { localStorage.removeItem('apex_auth_session'); });
  await page.goto(BASE + '/');           // hard navigate — triggers full React re-init
  await page.waitForTimeout(1500);
  await page.goto(BASE + '/#/login');
  await page.waitForTimeout(2500);
  const agentBtn = page.locator('button:has-text("Inloggen als Agent")').first();
  if (await agentBtn.count() > 0) {
    await agentBtn.click(); await page.waitForTimeout(1500);
    log('Agent login', 'OK');
  } else { log('Agent login', 'FAIL', 'knop niet gevonden'); }

  checkJs('Agent login');

  for (const [naam, route] of [
    ['Agent Dashboard', '/#/agent'],
    ['Agent Shifts', '/#/agent/shifts'],
    ['Agent Tijdregistratie', '/#/agent/tijdregistratie'],
    ['Agent Rapporten', '/#/agent/rapporten'],
    ['Agent Incidenten', '/#/agent/incidenten'],
    ['Agent Profiel', '/#/agent/profiel'],
  ]) {
    await page.goto(BASE + route);
    await page.waitForTimeout(1000);
    const h = await page.locator('h1, h2').first().textContent().catch(() => '');
    checkJs(naam);
    log(naam + ' laadt', h ? 'OK' : 'FAIL', h?.trim() || 'geen titel');
  }

  // Agent incident aanmaken — click the "Nieuw Incident" tab first
  await page.goto(BASE + '/#/agent/incidenten');
  await page.waitForTimeout(1500);
  // Click the new incident tab
  const newIncTab = page.locator('button:has-text("Nieuw"), button:has-text("Meld"), button:has-text("+ Meld")').first();
  if (await newIncTab.count() > 0) await newIncTab.click();
  await page.waitForTimeout(800);
  const agentIncInputs = await page.locator('input[type="text"], textarea').all();
  let agentIncFilled = false;
  for (const inp of agentIncInputs) {
    const ph = await inp.getAttribute('placeholder') || '';
    if (/omschrijving|titel|incident|meld/i.test(ph)) {
      await inp.fill('Agent test - verdacht voertuig');
      agentIncFilled = true; break;
    }
  }
  if (!agentIncFilled) {
    // Try filling the first visible input
    const allInps = await page.locator('input[type="text"]:visible').all();
    if (allInps.length > 0) { await allInps[0].fill('Agent test - verdacht voertuig'); agentIncFilled = true; }
  }
  const agentDescTextarea = page.locator('textarea:visible').first();
  if (await agentDescTextarea.count() > 0) await agentDescTextarea.fill('Verdacht voertuig geparkeerd voor ingang.');
  log('Agent - incident formulier invullen', agentIncFilled ? 'OK' : 'WARN', agentIncFilled ? '' : 'titel input niet gevonden');
  const agentSave = page.locator('button:has-text("Verstuur"), button:has-text("Opslaan"), button:has-text("Indienen")').first();
  if (await agentSave.count() > 0) { await agentSave.click(); await page.waitForTimeout(800); log('Agent - incident opslaan', 'OK'); }
  else { log('Agent - incident opslaan', 'WARN', 'geen klikbare save knop'); }
  checkJs('Agent incident');

  await browser.close();

  // ════════════════════════════════════════
  // RAPPORT
  // ════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   VOLLEDIG TESTRAPPORT — ADMIN + AGENT   ║');
  console.log('╚══════════════════════════════════════════╝');
  const fails = results.filter(r => r.startsWith('❌'));
  const warns = results.filter(r => r.startsWith('⚠️'));
  const oks   = results.filter(r => r.startsWith('✅'));
  console.log(`\n✅ ${oks.length} OK   ⚠️ ${warns.length} WARN   ❌ ${fails.length} FAIL\n`);
  if (fails.length) { console.log('BUGS GEVONDEN:'); fails.forEach(f => console.log('  ' + f)); }
  if (warns.length) { console.log('\nWAARSCHUWINGEN:'); warns.forEach(w => console.log('  ' + w)); }
  if (fails.length === 0) console.log('\n🎉 Geen bugs gevonden!');
})();
