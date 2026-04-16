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
  // LOGIN ALS AGENT
  // =====================================================
  await page.goto(BASE + '/#/login');
  await page.waitForTimeout(1200);
  const agentBtn = page.locator('button:has-text("Inloggen als Agent"), button:has-text("Agent")').first();
  if (await agentBtn.count() > 0) {
    await agentBtn.click();
    await page.waitForTimeout(1200);
    const url = page.url();
    if (url.includes('/agent')) {
      log('Login als Agent', 'OK', 'doorgestuurd naar /agent');
    } else {
      log('Login als Agent', 'WARN', `url: ${url}`);
    }
  } else {
    log('Login als Agent', 'FAIL', 'knop niet gevonden');
    await browser.close(); return;
  }
  await checkJs(page, jsErrors, 'Login');

  // =====================================================
  // AGENT DASHBOARD
  // =====================================================
  console.log('\n--- AGENT DASHBOARD ---');
  await page.goto(BASE + '/#/agent');
  await page.waitForTimeout(1000);
  await checkJs(page, jsErrors, 'Agent dashboard');
  const dashTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
  log('Agent dashboard', dashTitle ? 'OK' : 'WARN', dashTitle?.trim().substring(0, 40) || 'geen titel');

  // =====================================================
  // AGENT SHIFTS
  // =====================================================
  console.log('\n--- AGENT SHIFTS ---');
  await page.goto(BASE + '/#/agent/shifts');
  await page.waitForTimeout(1000);
  await checkJs(page, jsErrors, 'Agent shifts');
  const shiftsTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
  log('Agent shifts pagina', shiftsTitle ? 'OK' : 'WARN', shiftsTitle?.trim().substring(0, 40) || 'geen titel');

  // Check empty state or shift list
  const emptyState = await page.locator('text=Geen shifts, text=geen shifts, text=Geen beschikbare').count();
  const shiftCards = await page.locator('[class*="card"], [class*="grid"] > div, [class*="space-y"] > div').count();
  log('Agent shifts overzicht', 'OK', emptyState > 0 ? 'lege staat' : `${shiftCards} elementen`);

  // =====================================================
  // AGENT TIJDREGISTRATIE
  // =====================================================
  console.log('\n--- AGENT TIJDREGISTRATIE ---');
  await page.goto(BASE + '/#/agent/tijdregistratie');
  await page.waitForTimeout(1000);
  await checkJs(page, jsErrors, 'Agent tijdregistratie');
  const tijdTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
  log('Agent tijdregistratie pagina', tijdTitle ? 'OK' : 'WARN', tijdTitle?.trim().substring(0, 40) || 'geen titel');

  // Check clock-in/out buttons
  const clockBtn = page.locator('button').filter({ hasText: /Inchecken|Uitchecken|Clock|check/i }).first();
  if (await clockBtn.count() > 0) {
    const txt = await clockBtn.textContent();
    log('Tijdregistratie - klok knop', 'OK', txt?.trim().substring(0, 30) || '');
  } else {
    log('Tijdregistratie - klok knop', 'WARN', 'niet gevonden (mogelijk geen actieve shift)');
  }

  // =====================================================
  // AGENT RAPPORTEN
  // =====================================================
  console.log('\n--- AGENT RAPPORTEN ---');
  await page.goto(BASE + '/#/agent/rapporten');
  await page.waitForTimeout(1000);
  await checkJs(page, jsErrors, 'Agent rapporten');
  const rapTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
  log('Agent rapporten pagina', rapTitle ? 'OK' : 'WARN', rapTitle?.trim().substring(0, 40) || 'geen titel');

  // Try opening new rapport form
  const newRapBtn = page.locator('button').filter({ hasText: /Nieuw Rapport|Rapport.*aanmaken|Nieuw/i }).first();
  if (await newRapBtn.count() > 0) {
    await newRapBtn.click();
    await page.waitForTimeout(500);
    const formVisible = await page.locator('textarea, input[placeholder*="titel"], input[placeholder*="Titel"]').count() > 0;
    log('Agent rapport formulier', formVisible ? 'OK' : 'WARN', formVisible ? 'formulier zichtbaar' : 'geen formulier');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } else {
    // Rapport form might be inline
    const textareas = await page.locator('textarea').count();
    log('Agent rapport formulier', textareas > 0 ? 'OK' : 'WARN',
      textareas > 0 ? 'inline formulier gevonden' : 'geen knop of formulier');
  }

  // =====================================================
  // AGENT INCIDENTEN
  // =====================================================
  console.log('\n--- AGENT INCIDENTEN ---');
  await page.goto(BASE + '/#/agent/incidenten');
  await page.waitForTimeout(1000);
  await checkJs(page, jsErrors, 'Agent incidenten');
  const incTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
  log('Agent incidenten pagina', incTitle ? 'OK' : 'WARN', incTitle?.trim().substring(0, 40) || 'geen titel');

  // Fill incident form (inline)
  const titleInput = page.locator('input[placeholder]').filter({ hasText: '' }).nth(0);
  // Find incident title input
  const allInputs = await page.locator('input[type="text"], input:not([type])').all();
  let incFormFound = false;
  for (const inp of allInputs) {
    const ph = await inp.getAttribute('placeholder') || '';
    if (/omschrijving|titel|incident/i.test(ph)) {
      await inp.fill('Agent Test Incident');
      incFormFound = true;
      break;
    }
  }
  const descTextarea = await page.locator('textarea').first();
  if (await descTextarea.count() > 0) {
    await descTextarea.fill('Test beschrijving voor agent incident test.');
    incFormFound = true;
  }
  log('Agent incident formulier invullen', incFormFound ? 'OK' : 'WARN',
    incFormFound ? 'velden ingevuld' : 'geen formulier gevonden');

  if (incFormFound) {
    const saveBtn = page.locator('button.bg-apex-gold:not([disabled]), button.bg-blue-600:not([disabled])').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(800);
      log('Agent incident opslaan', 'OK');
    } else {
      log('Agent incident opslaan', 'WARN', 'geen klikbare save knop');
    }
    await checkJs(page, jsErrors, 'Agent incident aanmaken');
  }

  // =====================================================
  // AGENT PROFIEL
  // =====================================================
  console.log('\n--- AGENT PROFIEL ---');
  await page.goto(BASE + '/#/agent/profiel');
  await page.waitForTimeout(1000);
  await checkJs(page, jsErrors, 'Agent profiel');
  const profTitle = await page.locator('h1, h2').first().textContent().catch(() => '');
  log('Agent profiel pagina', profTitle ? 'OK' : 'WARN', profTitle?.trim().substring(0, 40) || 'geen titel');

  // Check profile form fields
  const profInputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').count();
  log('Agent profiel - velden aanwezig', profInputs > 0 ? 'OK' : 'WARN', `${profInputs} invoervelden`);

  // Fill first name if available
  const firstNameInput = page.locator('input').nth(0);
  if (await firstNameInput.count() > 0) {
    const currentVal = await firstNameInput.inputValue().catch(() => '');
    if (!currentVal) {
      await firstNameInput.fill('Test Agent');
      log('Agent profiel - naam invullen', 'OK');
    } else {
      log('Agent profiel - naam reeds ingevuld', 'OK', currentVal.substring(0, 20));
    }
  }

  // =====================================================
  // SAMENVATTING
  // =====================================================
  await browser.close();
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║      VOLLEDIG TESTRAPPORT AGENT      ║');
  console.log('╚══════════════════════════════════════╝');
  const fails = results.filter(r => r.startsWith('❌'));
  const warns = results.filter(r => r.startsWith('⚠️'));
  const oks   = results.filter(r => r.startsWith('✅'));
  console.log(`\n✅ ${oks.length} OK   ⚠️ ${warns.length} WARN   ❌ ${fails.length} FAIL\n`);
  if (fails.length) { console.log('FOUTEN:'); fails.forEach(f => console.log('  ' + f)); }
  if (warns.length) { console.log('\nWAARSCHUWINGEN:'); warns.forEach(w => console.log('  ' + w)); }
  if (fails.length === 0 && warns.length === 0) console.log('\n🎉 Alles geslaagd!');
})();
