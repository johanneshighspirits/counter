import {
  devices,
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  setLogLevel,
  updateDoc,
} from 'firebase/firestore';

// One event's life, from creation to deletion. The steps share the event, so
// they run in order and stop at the first failure.
test.describe.configure({ mode: 'serial' });

// The e2e team, hidden from visitors (src/lib/e2e.ts)
const TEAM_NAME = 'JayBo Test Team';
const TEAM_SLUG = 'jaybotestteam';
const runId = Date.now().toString(36);
// Markup and non-ASCII characters, which must show as plain text and be
// left out of the link
const EVENT_NAME = `E2E <b>Åäö</b> 🎉 ${runId}`;
const EVENT_SLUG = `e2e-b-aao-b-${runId}`;
const EVENT_PATH = `/${TEAM_SLUG}/${EVENT_SLUG}`;
const PIN = String(100_000 + Math.floor(Math.random() * 900_000));
const WRONG_PIN = PIN === '111111' ? '222222' : '111111';

let creator: BrowserContext;
let volunteer: BrowserContext;
// Logged in to the event's admin page, since creating an event does that
let adminPage: Page;
let doorPage: Page;

// With the cookie that shows the e2e team on the start page, unless told not to
const newContext = async (
  browser: Browser,
  baseURL: string | undefined,
  { e2eCookie = true } = {},
) => {
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL });
  if (e2eCookie) {
    await context.addCookies([{ name: 'e2e', value: '1', url: baseURL }]);
  }
  return context;
};

// Confirms resets and deletes, and remembers alerts, which the app shouldn't
// show: errors go in the page
const alerts = new WeakMap<Page, string[]>();
const acceptDialogs = (page: Page) => {
  alerts.set(page, []);
  page.on('dialog', (dialog) => {
    if (dialog.type() === 'alert') alerts.get(page)!.push(dialog.message());
    return dialog.accept();
  });
  return page;
};

// The counter and tickets pages put the live number first in the title,
// e.g. "(3) E2E … · JayBo Test Team"
const expectCount = (page: Page, count: number) =>
  expect(page).toHaveTitle(new RegExp(`^\\(${count}\\) `));

test.beforeAll(async ({ browser }, testInfo) => {
  const { baseURL } = testInfo.project.use;
  creator = await newContext(browser, baseURL);
  volunteer = await newContext(browser, baseURL);
  adminPage = acceptDialogs(await creator.newPage());
  doorPage = acceptDialogs(await volunteer.newPage());
});

test.afterAll(async () => {
  // Clean up when a step failed before the delete step
  const response = await creator.request.get(EVENT_PATH);
  if (response.ok()) {
    await creator.request.post(`${EVENT_PATH}/api/event/delete`);
  }
  await creator.close();
  await volunteer.close();
});

test('the form explains its fields and only takes digits as PIN', async () => {
  await adminPage.goto('/');

  for (const hint of [
    'Välj ditt lag i listan',
    'blir en del av länken',
    'Dagen evenemanget äger rum',
    'Skyddar admin-sidan',
  ]) {
    await expect(adminPage.getByText(hint)).toBeVisible();
  }

  const pin = adminPage.getByLabel('PIN-kod för admin');
  await pin.pressSequentially('ab12-cd34');
  await expect(pin).toHaveValue('1234');
  // Active fields turn white
  await expect(pin).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  // Team and event names are still missing
  await expect(
    adminPage.getByRole('button', { name: 'Skapa evenemang' }),
  ).toBeDisabled();
});

test('a reserved team name is refused', async () => {
  await adminPage.goto('/');
  await adminPage.getByLabel('Lag').fill('Admin');
  await adminPage.getByLabel('Evenemang').fill(EVENT_NAME);
  await adminPage.getByLabel('PIN-kod för admin').fill(PIN);
  await adminPage.getByRole('button', { name: 'Skapa evenemang' }).click();

  await expect(
    adminPage.getByText('Det lagnamnet går inte att använda'),
  ).toBeVisible();
});

test('creating an event gives a link and a QR code', async ({ baseURL }) => {
  await adminPage.goto('/');
  await adminPage.getByLabel('Lag').fill(TEAM_NAME);
  await adminPage.getByLabel('Evenemang').fill(EVENT_NAME);
  await adminPage.getByLabel('PIN-kod för admin').fill(PIN);
  await adminPage.getByRole('button', { name: 'Skapa evenemang' }).click();

  await expect(adminPage.getByText('Klart!')).toBeVisible();
  await expect(adminPage.getByText(`${baseURL}${EVENT_PATH}`)).toBeVisible();
  await expect(adminPage.getByRole('img', { name: /QR-kod/ })).toBeVisible();

  await adminPage.getByRole('link', { name: 'Öppna evenemanget' }).click();
  await expect(adminPage).toHaveURL(EVENT_PATH);
  // The name is text, not markup
  const heading = adminPage.getByRole('heading', { level: 1 });
  await expect(heading).toHaveText(EVENT_NAME);
  await expect(heading.locator('b')).toHaveCount(0);
});

test('the e2e team only shows with the e2e cookie', async ({
  browser,
  baseURL,
}) => {
  await adminPage.goto('/');
  await expect(adminPage.getByRole('link', { name: TEAM_NAME })).toBeVisible();

  const visitor = await newContext(browser, baseURL, { e2eCookie: false });
  const page = await visitor.newPage();
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Nytt evenemang' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: TEAM_NAME })).toHaveCount(0);
  await expect(page.locator(`option[value="${TEAM_NAME}"]`)).toHaveCount(0);
  await visitor.close();
});

test('the event is listed on the team page', async () => {
  await doorPage.goto(`/${TEAM_SLUG}`);
  await expect(
    doorPage.getByRole('heading', { name: TEAM_NAME }),
  ).toBeVisible();
  await doorPage.getByRole('link', { name: new RegExp(runId) }).click();
  await expect(doorPage).toHaveURL(EVENT_PATH);
});

test('the share dialog shows the link and QR code', async ({ baseURL }) => {
  await doorPage.goto(EVENT_PATH);
  await doorPage.getByRole('button', { name: 'Dela med QR-kod' }).click();

  const dialog = doorPage.getByRole('dialog');
  await expect(dialog.getByRole('img', { name: /QR-kod/ })).toBeVisible();
  await expect(dialog.getByText(`${baseURL}${EVENT_PATH}`)).toBeVisible();
  await expect(
    dialog.getByRole('link', { name: 'Ladda ner QR-kod' }),
  ).toHaveAttribute('download', `${TEAM_SLUG}-${EVENT_SLUG}-qr.png`);

  await dialog.getByRole('button', { name: 'Stäng' }).click();
  await expect(dialog).toBeHidden();
});

test('unknown teams and events are 404', async ({ request }) => {
  expect((await request.get(`/${TEAM_SLUG}/no-such-event`)).status()).toBe(404);
  expect((await request.get(`/no-such-team-${runId}`)).status()).toBe(404);

  // In Swedish, with a way back
  await doorPage.goto(`/${TEAM_SLUG}/no-such-event`);
  await expect(
    doorPage.getByRole('heading', { name: 'Sidan finns inte' }),
  ).toBeVisible();
  await expect(doorPage.locator('html')).toHaveAttribute('lang', 'sv');
  await doorPage.getByRole('link', { name: 'Till startsidan' }).click();
  await expect(doorPage).toHaveURL('/');
});

test('the counter counts and keeps its value after a reload', async () => {
  await doorPage.goto(`${EVENT_PATH}/counter`);
  await expectCount(doorPage, 0);

  const plus = doorPage.getByRole('button', {
    name: 'Increment visitor count',
  });
  const minus = doorPage.getByRole('button', {
    name: 'Decrement visitor count',
  });
  await expect(minus).toBeDisabled();

  await plus.click();
  await plus.click();
  await plus.click();
  await expectCount(doorPage, 3);
  await minus.click();
  await expectCount(doorPage, 2);

  await doorPage.reload();
  await expectCount(doorPage, 2);
});

test('rapid clicks are all counted', async () => {
  await doorPage.goto(`${EVENT_PATH}/counter`);
  const plus = doorPage.getByRole('button', {
    name: 'Increment visitor count',
  });
  for (let i = 0; i < 10; i++) {
    await plus.click({ delay: 0 });
  }
  await expectCount(doorPage, 12);

  await doorPage.reload();
  await expectCount(doorPage, 12);
});

test('two devices see each other’s clicks', async () => {
  const otherDoor = await volunteer.newPage();
  await otherDoor.goto(`${EVENT_PATH}/counter`);
  await doorPage.goto(`${EVENT_PATH}/counter`);
  await expectCount(otherDoor, 12);

  await doorPage
    .getByRole('button', { name: 'Increment visitor count' })
    .click();
  await expectCount(otherDoor, 13);

  await otherDoor
    .getByRole('button', { name: 'Decrement visitor count' })
    .click();
  await expectCount(doorPage, 12);
  await otherDoor.close();
});

test('tickets are sold, undone and shown on the counter page', async () => {
  await doorPage.goto(`${EVENT_PATH}/tickets`);
  await expectCount(doorPage, 0);
  await expect(
    doorPage.getByRole('button', { name: 'Ta bort 1 biljett' }),
  ).toBeDisabled();

  for (const label of [
    'Sälj 1 biljett',
    'Sälj 2 biljetter',
    'Sälj 3 biljetter',
    'Sälj 4 biljetter',
  ]) {
    await doorPage.getByRole('button', { name: label }).click();
  }
  await expectCount(doorPage, 10);
  await doorPage.getByRole('button', { name: 'Ta bort 1 biljett' }).click();
  await expectCount(doorPage, 9);

  // Switch tabs with the bottom navigation
  await doorPage.getByRole('link', { name: 'Räknare' }).click();
  await expectCount(doorPage, 12);
  await expect(doorPage.getByText('Sålda biljetter:')).toBeVisible();
  await expect(
    doorPage.getByText('Sålda biljetter:').locator('..'),
  ).toContainText('9');
});

test('stats show live totals and a chart', async () => {
  await doorPage.goto(`${EVENT_PATH}/stats`);
  // The tiles come before the chart, whose legend has the same labels
  const tile = (label: string) =>
    doorPage.getByText(label, { exact: true }).first().locator('..');
  await expect(tile('Nuvarande besökare')).toContainText('12');
  await expect(tile('Sålda biljetter')).toContainText('9');
  await expect(doorPage.locator('.recharts-surface').first()).toBeVisible();

  // A click on another device shows up without a reload
  const otherDoor = await volunteer.newPage();
  await otherDoor.goto(`${EVENT_PATH}/counter`);
  await otherDoor
    .getByRole('button', { name: 'Increment visitor count' })
    .click();
  await expectCount(otherDoor, 13);
  await expect(tile('Nuvarande besökare')).toContainText('13');
  await otherDoor.close();

  // Tab switching keeps working with pages reused from the browser cache
  for (const tab of ['Räknare', 'Statistik', 'Biljetter', 'Statistik']) {
    await doorPage.getByRole('link', { name: tab }).click();
  }
  await expect(tile('Nuvarande besökare')).toContainText('13');
});

test('clicks made offline are saved when the connection is back', async () => {
  await doorPage.goto(`${EVENT_PATH}/counter`);
  await expectCount(doorPage, 13);
  const notice = doorPage.getByRole('status').filter({
    hasText: 'Dålig anslutning',
  });
  await expect(notice).toBeHidden();

  await volunteer.setOffline(true);
  const plus = doorPage.getByRole('button', {
    name: 'Increment visitor count',
  });
  await plus.click();
  await plus.click();
  // Counted on the device right away, with a notice that it's not sent yet
  await expectCount(doorPage, 15);
  await expect(notice).toBeVisible();
  // Long enough for a transaction to have given up
  await doorPage.waitForTimeout(8_000);
  await expectCount(doorPage, 15);
  await expect(doorPage.getByText('kunde inte sparas')).toHaveCount(0);

  await volunteer.setOffline(false);
  await expect(notice).toBeHidden({ timeout: 20_000 });

  // Saved on the server: another device sees them
  const otherDoor = await creator.newPage();
  await otherDoor.goto(`${EVENT_PATH}/counter`);
  await expectCount(otherDoor, 15);
  await otherDoor.close();
});

test.describe('the security rules', () => {
  let app: FirebaseApp;

  test.beforeAll(() => {
    test.skip(
      !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      'Needs the NEXT_PUBLIC_FIREBASE_* variables, e.g. from .env.local',
    );
    // The denied writes below are expected, so don't log them
    setLogLevel('silent');
    app = initializeApp(
      {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      },
      `e2e-${runId}`,
    );
    // When the app under test uses the emulator, so does this
    const emulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;
    if (emulatorHost) {
      const [host, port] = emulatorHost.split(':');
      connectFirestoreEmulator(getFirestore(app), host, Number(port));
    }
  });

  test.afterAll(async () => {
    if (app) await deleteApp(app);
  });

  test('block writes the app never makes', async () => {
    const db = getFirestore(app);
    const eventRef = doc(db, 'teams', TEAM_SLUG, 'events', EVENT_SLUG);
    const denied = (write: Promise<unknown>) =>
      expect(write).rejects.toMatchObject({ code: 'permission-denied' });

    // Reading is open, so the counter pages work without a login
    expect((await getDoc(eventRef)).get('count')).toBe(15);

    await denied(updateDoc(eventRef, { count: 999 }));
    await denied(updateDoc(eventRef, { maxCount: 1 }));
    await denied(
      addDoc(collection(eventRef, 'log'), {
        type: 'occupancy',
        delta: 1,
        source: 'main-door',
        createdAt: serverTimestamp(),
      }),
    );
    await denied(getDoc(doc(eventRef, 'private', 'pin')));
    await denied(setDoc(doc(db, 'teams', `e2e-${runId}`), { name: 'x' }));
    await denied(setDoc(doc(db, 'tasks', `e2e-${runId}`), { x: 1 }));
    await denied(getDoc(doc(db, 'rateLimits', 'x')));
  });
});

test('the admin page needs the PIN', async () => {
  await doorPage.goto(`${EVENT_PATH}/admin`);
  const password = doorPage.getByPlaceholder('Enter PIN or admin password');
  await expect(password).toBeVisible();

  await password.fill(WRONG_PIN);
  await doorPage.getByRole('button', { name: 'Enter' }).click();
  await expect(doorPage.getByText('Wrong PIN, 2 attempts left')).toBeVisible();
  expect(alerts.get(doorPage)).toEqual([]);

  await password.fill(PIN);
  await doorPage.getByRole('button', { name: 'Enter' }).click();
  await expect(
    doorPage.getByRole('heading', { name: 'Settings' }),
  ).toBeVisible();
});

test('admin settings change the max count and date', async () => {
  await adminPage.goto(`${EVENT_PATH}/admin`);

  const setting = (label: string) =>
    adminPage.locator('form', { has: adminPage.getByLabel(label) });

  // Only whole numbers, in the form and in the API
  await setting('Max visitors').getByLabel('Max visitors').fill('1.5');
  await setting('Max visitors').getByRole('button', { name: 'Save' }).click();
  await expect(
    setting('Max visitors').getByText(/Please enter a whole number/),
  ).toBeVisible();
  for (const maxCount of [1.5, 1e9]) {
    const response = await adminPage.request.post(
      `${EVENT_PATH}/api/counter/max-count`,
      { data: { maxCount } },
    );
    expect(response.status()).toBe(400);
  }

  await setting('Max visitors').getByLabel('Max visitors').fill('20');
  await setting('Max visitors').getByRole('button', { name: 'Save' }).click();
  await expect(setting('Max visitors').getByText('Saved')).toBeVisible();

  await setting('Date').getByLabel('Date').fill('2026-12-24');
  await setting('Date').getByRole('button', { name: 'Save' }).click();
  await expect(setting('Date').getByText('Saved')).toBeVisible();

  await doorPage.goto(`${EVENT_PATH}/counter`);
  await expect(doorPage.getByText('Max: 20')).toBeVisible();
  await doorPage.goto(EVENT_PATH);
  await expect(doorPage.getByText('24 dec. 2026')).toBeVisible();
});

test('trimming the log keeps the counters', async () => {
  await adminPage.goto(`${EVENT_PATH}/admin`);
  await expect(adminPage.getByText('Entries', { exact: true })).toBeVisible();

  // Keeping only entries from after the event day deletes all of them
  await adminPage.getByLabel('Keep from').fill('2026-12-25T00:00');
  await adminPage
    .getByRole('button', { name: 'Delete entries outside this range' })
    .click();
  await expect(adminPage.getByText(/Deleted \d+ entries/)).toBeVisible();
  await expect(adminPage.getByText('The log is empty')).toBeVisible();

  await doorPage.goto(`${EVENT_PATH}/counter`);
  await expectCount(doorPage, 15);
});

test('resetting sets both counters to 0', async () => {
  await adminPage.goto(`${EVENT_PATH}/admin`);
  await adminPage
    .getByRole('button', { name: 'Reset counters and log' })
    .click();

  await doorPage.goto(`${EVENT_PATH}/counter`);
  await expectCount(doorPage, 0);
  await doorPage.goto(`${EVENT_PATH}/tickets`);
  await expectCount(doorPage, 0);
});

test('three wrong PINs lock the admin login', async ({ browser, baseURL }) => {
  const stranger = await newContext(browser, baseURL);
  const page = acceptDialogs(await stranger.newPage());
  await page.goto(`${EVENT_PATH}/admin`);
  const password = page.getByPlaceholder('Enter PIN or admin password');
  const enter = page.getByRole('button', { name: 'Enter' });

  for (const left of ['2 attempts left', '1 attempt left']) {
    await password.fill(WRONG_PIN);
    await enter.click();
    await expect(page.getByText(`Wrong PIN, ${left}`)).toBeVisible();
  }
  await password.fill(WRONG_PIN);
  await enter.click();
  await expect(page.getByText(/Too many wrong attempts/)).toBeVisible();

  // Even the right PIN waits out the lockout
  await password.fill(PIN);
  await enter.click();
  await expect(page.getByText(/Too many wrong attempts/)).toBeVisible();
  await stranger.close();
});

test('deleting the event removes it and its links', async () => {
  // A door device that still has the counter open
  await doorPage.goto(`${EVENT_PATH}/counter`);

  // Logged in before the lockout, so still allowed
  await adminPage.goto(`${EVENT_PATH}/admin`);
  await adminPage.getByRole('button', { name: 'Delete event' }).click();
  await adminPage.waitForURL((url) => !url.pathname.startsWith(EVENT_PATH));

  expect((await adminPage.request.get(EVENT_PATH)).status()).toBe(404);
  await adminPage.goto(`/${TEAM_SLUG}`);
  await expect(adminPage.getByText(runId)).toHaveCount(0);

  // The open counter says why it stopped working
  await expect(
    doorPage.getByText('Evenemanget finns inte längre'),
  ).toBeVisible();
  expect(alerts.get(doorPage)).toEqual([]);
});
