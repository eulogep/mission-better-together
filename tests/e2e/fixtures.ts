import { test as base, expect, Page } from '@playwright/test';

/** Lieux fictifs renvoyés à la place de Nominatim : tests indépendants des serveurs publics. */
const NOMINATIM_FIXTURE: Record<string, unknown[]> = {
  police: [{ osm_type: 'node', osm_id: 1, lat: '48.8570', lon: '2.3530', name: 'Commissariat de test', extratags: { opening_hours: '24/7', phone: '+33 1 00 00 00 00' }, address: { road: 'Rue du Test', city: 'Paris' } }],
  pharmacy: [{ osm_type: 'node', osm_id: 2, lat: '48.8568', lon: '2.3525', name: 'Pharmacie de test', extratags: { opening_hours: 'Mo-Sa 09:00-20:00' }, address: {} }],
  hospital: [{ osm_type: 'way', osm_id: 3, lat: '48.8600', lon: '2.3600', name: 'Hôpital de test', extratags: {}, address: {} }],
};

export async function mockExternalServices(page: Page) {
  await page.route(/nominatim\.openstreetmap\.org\/search/, (route) => {
    const amenity = new URL(route.request().url()).searchParams.get('amenity') ?? '';
    route.fulfill({ json: NOMINATIM_FIXTURE[amenity] ?? [] });
  });
  await page.route(/tile\.openstreetmap\.org/, (route) => route.fulfill({ status: 204, body: '' }));
  await page.route(/(data\.geopf\.fr|api-adresse\.data\.gouv\.fr)/, (route) =>
    route.fulfill({ json: { features: [{ geometry: { coordinates: [4.835, 45.758] }, properties: { label: 'Lyon' } }] } })
  );
  await page.route(/google\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>neutre</h1>' }));
}

/** Empêche l'ouverture réelle des applis SMS/téléphone pendant les tests (les gestionnaires React s'exécutent). */
export async function blockExternalSchemes(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener(
      'click',
      (e) => {
        const a = (e.target as Element)?.closest?.('a[href^="sms:"], a[href^="tel:"]');
        if (a) e.preventDefault();
      },
      true
    );
  });
}

export const test = base.extend<{ app: Page }>({
  app: async ({ page, context }, use) => {
    await context.addInitScript(() => localStorage.setItem('mbt_onboarded_v1', '1'));
    await mockExternalServices(page);
    await blockExternalSchemes(page);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await use(page);
    expect(errors, 'erreurs JavaScript').toEqual([]);
  },
});

export { expect };
export const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;
