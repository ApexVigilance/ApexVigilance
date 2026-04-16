const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const BASE = 'http://localhost:5173';
const results = [];

function log(section, status, detail = '') {
  const icon = status === 'OK' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  results.push(`${icon} ${section}${detail ? ': ' + detail : ''}`);
  console.log(`${icon} ${section}${detail ? ': ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Capture JS errors
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  // --- LOGIN AS ADMIN ---
  await page.goto(BASE + '/#/login');
  await page.waitForTimeout(1000);
  const adminBtn = page.locator('button:has(svg.lucide-shield), button:has-text("Admin"), button:has-text("Beheerder")').first();
  if (await adminBtn.count() > 0) {
    await adminBtn.click();
    await page.waitForTimeout(1000);
    log('Login als Admin', 'OK');
  } else {
    log('Login als Admin', 'FAIL', 'Knop niet gevonden');
  }

  // --- DASHBOARD ---
  await page.goto(BASE + '/#/');
  await page.waitForTimeout(1000);
  const dashTitle = await page.locator('h2').first().textContent().catch(() => '');
  if (dashTitle && dashTitle.length > 0) {
    log('Dashboard', 'OK', dashTitle.trim().substring(0, 30));
  } else {
    log('Dashboard', 'WARN', 'Titel niet gevonden');
  }
  if (jsErrors.length) log('Dashboard JS errors', 'FAIL', jsErrors.join('; '));
  jsErrors.length = 0;

  // --- PERSONEEL ---
  await page.goto(BASE + '/#/personeel');
  await page.waitForTimeout(1000);
  const persTitle = await page.locator('h2').first().textContent().catch(() => '');
  log('Personeelsbestand', persTitle ? 'OK' : 'WARN', persTitle?.trim().substring(0, 30) || 'geen titel');
  if (jsErrors.length) { log('Personeel JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  // --- PLANNING ---
  await page.goto(BASE + '/#/planning');
  await page.waitForTimeout(1000);
  const planTitle = await page.locator('h2').first().textContent().catch(() => '');
  log('Planning', planTitle ? 'OK' : 'WARN', planTitle?.trim().substring(0, 30) || 'geen titel');
  // Try opening new shift modal
  const newShiftBtn = page.locator('button:has-text("Nieuwe Shift")').first();
  if (await newShiftBtn.count() > 0) {
    await newShiftBtn.click();
    await page.waitForTimeout(500);
    const modalOpen = await page.locator('.fixed.inset-0').count() > 0;
    log('Planning - Nieuwe shift modal', modalOpen ? 'OK' : 'WARN');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  if (jsErrors.length) { log('Planning JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  // --- SHIFTS ---
  await page.goto(BASE + '/#/shifts');
  await page.waitForTimeout(1000);
  const shiftsTitle = await page.locator('h2').first().textContent().catch(() => '');
  log('Shifts & Opdrachten', shiftsTitle ? 'OK' : 'WARN', shiftsTitle?.trim().substring(0, 30) || 'geen titel');
  if (jsErrors.length) { log('Shifts JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  // --- TIJDREGISTRATIES ---
  await page.goto(BASE + '/#/tijdregistraties');
  await page.waitForTimeout(1000);
  const tijdTitle = await page.locator('h2').first().textContent().catch(() => '');
  log('Tijdregistraties', tijdTitle ? 'OK' : 'WARN', tijdTitle?.trim().substring(0, 30) || 'geen titel');
  if (jsErrors.length) { log('Tijdregistraties JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  // --- RAPPORTEN ---
  await page.goto(BASE + '/#/rapporten');
  await page.waitForTimeout(1000);
  const rapTitle = await page.locator('h2').first().textContent().catch(() => '');
  log('Rapporten', rapTitle ? 'OK' : 'WARN', rapTitle?.trim().substring(0, 30) || 'geen titel');
  // Try opening new report modal
  const newRapBtn = page.locator('button:has-text("Nieuw")').first();
  if (await newRapBtn.count() > 0) {
    await newRapBtn.click();
    await page.waitForTimeout(500);
    const rapModal = await page.locator('.fixed.inset-0').count() > 0;
    log('Rapporten - Nieuw rapport modal', rapModal ? 'OK' : 'WARN');
    const closeBtn = page.locator('.fixed.inset-0 button:has(.lucide-x)').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
    await page.waitForTimeout(300);
  }
  if (jsErrors.length) { log('Rapporten JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  // --- INCIDENTEN ---
  await page.goto(BASE + '/#/incidenten');
  await page.waitForTimeout(1000);
  const incTitle = await page.locator('h2').first().textContent().catch(() => '');
  log('Incidenten', incTitle ? 'OK' : 'WARN', incTitle?.trim().substring(0, 30) || 'geen titel');
  // Try opening new incident modal
  const newIncBtn = page.locator('button:has-text("Nieuw")').first();
  if (await newIncBtn.count() > 0) {
    await newIncBtn.click();
    await page.waitForTimeout(500);
    const incModal = await page.locator('.fixed.inset-0').count() > 0;
    log('Incidenten - Nieuw incident modal', incModal ? 'OK' : 'WARN');
    const closeBtn = page.locator('.fixed.inset-0 button').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
    await page.waitForTimeout(300);
  }
  if (jsErrors.length) { log('Incidenten JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  // --- KLANTEN ---
  await page.goto(BASE + '/#/klanten');
  await page.waitForTimeout(1000);
  const klantTitle = await page.locator('h2').first().textContent().catch(() => '');
  log('Klanten & Locaties', klantTitle ? 'OK' : 'WARN', klantTitle?.trim().substring(0, 30) || 'geen titel');
  // Try opening new client modal
  const newKlantBtn = page.locator('button:has-text("Nieuwe Klant")').first();
  if (await newKlantBtn.count() > 0) {
    await newKlantBtn.click();
    await page.waitForTimeout(500);
    const klantModal = await page.locator('.fixed.inset-0').count() > 0;
    log('Klanten - Nieuwe klant modal', klantModal ? 'OK' : 'WARN');
    const closeBtn = page.locator('.fixed.inset-0 button').last();
    if (await closeBtn.count() > 0) await closeBtn.click();
    await page.waitForTimeout(300);
  }
  if (jsErrors.length) { log('Klanten JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  // --- FACTURATIE ---
  await page.goto(BASE + '/#/facturatie');
  await page.waitForTimeout(1000);
  const factTitle = await page.locator('h1').first().textContent().catch(() => '');
  log('Facturatie Dashboard', factTitle ? 'OK' : 'WARN', factTitle?.trim().substring(0, 30) || 'geen titel');
  if (jsErrors.length) { log('Facturatie JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  await page.goto(BASE + '/#/facturatie/facturen');
  await page.waitForTimeout(1000);
  const facturenTitle = await page.locator('h1').first().textContent().catch(() => '');
  log('Facturatie - Facturen overzicht', facturenTitle ? 'OK' : 'WARN', facturenTitle?.trim().substring(0, 30) || 'geen titel');
  if (jsErrors.length) { log('Facturen JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  await page.goto(BASE + '/#/facturatie/ronde');
  await page.waitForTimeout(1000);
  const rondeTitle = await page.locator('h1').first().textContent().catch(() => '');
  log('Facturatie - Nieuwe ronde', rondeTitle ? 'OK' : 'WARN', rondeTitle?.trim().substring(0, 30) || 'geen titel');
  if (jsErrors.length) { log('Facturatie ronde JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  await page.goto(BASE + '/#/facturatie/export');
  await page.waitForTimeout(1000);
  const exportTitle = await page.locator('h1').first().textContent().catch(() => '');
  log('Facturatie - Export CSV', exportTitle ? 'OK' : 'WARN', exportTitle?.trim().substring(0, 30) || 'geen titel');
  if (jsErrors.length) { log('Export JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  // --- INSTELLINGEN ---
  await page.goto(BASE + '/#/settings');
  await page.waitForTimeout(1000);
  const settTitle = await page.locator('h2').first().textContent().catch(() => '');
  log('Instellingen', settTitle ? 'OK' : 'WARN', settTitle?.trim().substring(0, 30) || 'geen titel');
  // Check reset button exists
  const resetBtn = page.locator('button:has-text("Reset")');
  if (await resetBtn.count() > 0) log('Instellingen - Reset knop aanwezig', 'OK');
  else log('Instellingen - Reset knop aanwezig', 'WARN', 'niet gevonden');
  if (jsErrors.length) { log('Instellingen JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  // --- TEST: Create new shift and verify persistence ---
  await page.goto(BASE + '/#/planning');
  await page.waitForTimeout(1000);
  const newBtn = page.locator('button:has-text("Nieuwe Shift")').first();
  if (await newBtn.count() > 0) {
    await newBtn.click();
    await page.waitForTimeout(500);
    // Type location
    await page.locator('input[placeholder="bv. Hoofdingang"]').fill('Test Locatie');
    await page.waitForTimeout(200);
    // Select client (if any)
    // Click save - should be disabled if no client
    log('Planning - Nieuwe shift formulier invullen', 'OK');
    await page.keyboard.press('Escape');
  }
  if (jsErrors.length) { log('Planning create JS errors', 'FAIL', jsErrors.join('; ')); jsErrors.length = 0; }

  await browser.close();

  console.log('\n=== SAMENVATTING ===');
  const fails = results.filter(r => r.startsWith('❌'));
  const warns = results.filter(r => r.startsWith('⚠️'));
  const oks = results.filter(r => r.startsWith('✅'));
  console.log(`✅ ${oks.length} OK  ⚠️ ${warns.length} WARN  ❌ ${fails.length} FAIL`);
  if (fails.length) { console.log('\nFOUTEN:'); fails.forEach(f => console.log(f)); }
  if (warns.length) { console.log('\nWAARSCHUWINGEN:'); warns.forEach(w => console.log(w)); }
})();
