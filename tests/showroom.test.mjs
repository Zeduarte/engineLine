import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
const require = createRequire(import.meta.url);
function load(path) {
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const mod = { exports: {} };
  new Function("module", "exports", "require", outputText)(
    mod,
    mod.exports,
    (name) =>
      name.startsWith(".")
        ? load(resolve(dirname(path), name + ".ts"))
        : require(name),
  );
  return mod.exports;
}
const { applyFilters, emptyFilters } = load("src/lib/vehicles.ts");
const { registrationLabel, isCampaign } = load("src/lib/vehicle-categories.ts");
const { DEFAULT_SHOWROOM, showroomSchema, isGoogleMapsUrl } = load(
  "src/lib/showroom.ts",
);
test("combined inventory filters include boundaries and stable location identifiers", () => {
  const car = {
    year: 2020,
    mileage: 40000,
    price: 20000,
    previousPrice: 22000,
    vehicleType: "car",
    pointOfSaleId: "porto",
    location: "Porto",
  };
  const filters = {
    ...emptyFilters(),
    minYear: 2020,
    maxYear: 2020,
    minMileage: 40000,
    maxMileage: 40000,
    location: "porto",
    vehicleType: "car",
    campaignOnly: true,
  };
  assert.deepEqual(
    applyFilters(
      [
        car,
        { ...car, year: 2021 },
        { ...car, mileage: 39999 },
        { ...car, pointOfSaleId: "lisboa" },
        { ...car, priceOnRequest: true },
      ],
      filters,
    ),
    [car],
  );
  assert.equal(
    applyFilters([car], { ...filters, vehicleType: "motorcycle" }).length,
    0,
  );
});
test("registration and promotions never invent missing data", () => {
  assert.equal(registrationLabel(2020, 2), "02/2020");
  assert.equal(registrationLabel(2020, null), "2020");
  assert.equal(isCampaign({ price: 100, previousPrice: 110 }), true);
  for (const v of [
    { price: 0, previousPrice: 110 },
    { price: 110, previousPrice: 100 },
    { price: 100, previousPrice: 110, priceOnRequest: true },
  ])
    assert.equal(isCampaign(v), false);
});
test("showroom rejects duplicate services and untrusted Google links", () => {
  assert.equal(showroomSchema.safeParse(DEFAULT_SHOWROOM).success, true);
  assert.equal(
    showroomSchema.safeParse({
      ...DEFAULT_SHOWROOM,
      services: Array(4).fill(DEFAULT_SHOWROOM.services[0]),
    }).success,
    false,
  );
  assert.equal(isGoogleMapsUrl("https://www.google.com/maps/place/test"), true);
  for (const url of [
    "javascript:alert(1)",
    "https://google.com.evil.test/maps",
    "https://evil.test",
    "https://user@google.com/maps",
  ])
    assert.equal(isGoogleMapsUrl(url), false);
});

const { carFormSchema, publicTestimonialSchema } = load('src/lib/schemas.ts');
test('car editor validates motorcycle categories, zero doors and optional month', () => {
  const bike = {make:'Honda',model:'PCX',year:2023,mileage:8000,fuel:'Gasolina',transmission:'Automática',body:'Scooter',vehicle_type:'motorcycle',doors:0,seats:2,price:3500,registration_month:'6'};
  assert.equal(carFormSchema.parse(bike).registration_month,6);
  assert.equal(carFormSchema.parse({...bike,registration_month:''}).registration_month,null);
  for(const patch of [{registration_month:13},{vehicle_type:'car'},{doors:2},{body:'Berlina'}]) assert.equal(carFormSchema.safeParse({...bike,...patch}).success,false);
});
test('public testimonials require an explicit privacy acknowledgment', () => {
  const input={name:'Teste',body:'Uma experiência de teste',rating:5};
  assert.equal(publicTestimonialSchema.safeParse(input).success,false);
  assert.equal(publicTestimonialSchema.safeParse({...input,privacyAcknowledged:false}).success,false);
  assert.equal(publicTestimonialSchema.safeParse({...input,privacyAcknowledged:true}).success,true);
});
