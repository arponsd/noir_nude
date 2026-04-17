export type FixtureProduct = {
  slug: string;
  name: string;
  priceMinor: number;
};

// TODO: populate with catalog fixtures (variants, categories, images) once the
// database agent lands Product/Variant models and the frontend needs filter/PDP
// coverage. Keep in sync with tests/fixtures/users.ts fixture style.
export const fixtureProducts: FixtureProduct[] = [];
