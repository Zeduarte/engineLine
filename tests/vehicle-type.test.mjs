import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const rows = [];
let nextId = 1;
const requestedSections = [];
function query(table) {
  const conditions = [];
  let operation = "read",
    payload,
    single = false;
  const api = {
    select() {
      return api;
    },
    order() {
      return api;
    },
    limit() {
      return api;
    },
    in(k, values) {
      conditions.push((r) => values.includes(r[k]));
      return api;
    },
    eq(k, v) {
      conditions.push((r) => r[k] === v);
      return api;
    },
    neq(k, v) {
      conditions.push((r) => r[k] !== v);
      return api;
    },
    insert(v) {
      operation = "insert";
      payload = v;
      return api;
    },
    update(v) {
      operation = "update";
      payload = v;
      return api;
    },
    maybeSingle() {
      single = true;
      return api;
    },
    single() {
      single = true;
      return api;
    },
    then(onResult, onError) {
      let result =
        table === "cars"
          ? rows.filter((r) => conditions.every((c) => c(r)))
          : [];
      if (operation === "insert") {
        result = [
          {
            ...payload,
            id: `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`,
          },
        ];
        rows.push(...result);
      }
      if (operation === "update")
        result.forEach((r) => Object.assign(r, payload));
      return Promise.resolve({
        data: single ? (result[0] ?? null) : result,
        error: null,
      }).then(onResult, onError);
    },
  };
  return api;
}
const db = {
  from: query,
  auth: { getUser: async () => ({ data: { user: { id: "staff-test" } } }) },
};
const cache = new Map();
function load(file) {
  file = resolve(file);
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} };
  const custom = (id) => {
    if (id === "server-only") return {};
    if (id === "next/cache")
      return { revalidatePath() {}, unstable_cache: (f) => f };
    if (id === "@/lib/guard")
      return {
        requireSection: async (section) => requestedSections.push(section),
      };
    if (id === "@/lib/supabase/server") return { createClient: async () => db };
    if (id === "@/lib/supabase/public") return { supabasePublic: db };
    if (id === "@/lib/storage")
      return { MEDIA_BUCKET: "media", publicMediaUrl: (p) => p };
    if (id.startsWith("@/") || id.startsWith(".")) {
      let path = id.startsWith("@/")
        ? resolve("src", id.slice(2))
        : resolve(dirname(file), id);
      if (!existsSync(path)) path += ".ts";
      return load(path);
    }
    return require(id);
  };
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  new Function("module", "exports", "require", outputText)(
    mod,
    mod.exports,
    custom,
  );
  cache.set(file, mod.exports);
  return mod.exports;
}
const { createCar, updateCar } = load("src/lib/actions/cars.ts");
const { getVehicles } = load("src/lib/queries.ts");
const { inventoryVehicleType } = load("src/lib/vehicle-categories.ts");
await test("advert type is persisted on create/edit and scopes public database reads", async () => {
  const common = {
    year: 2023,
    mileage: 8000,
    fuel: "Gasolina",
    transmission: "Manual",
    price: 3500,
    status: "published",
  };
  const bike = {
    ...common,
    make: "Honda",
    model: "PCX",
    body: "Scooter",
    vehicle_type: "motorcycle",
    doors: 0,
    seats: 2,
  };
  const car = {
    ...common,
    make: "BMW",
    model: "320",
    body: "Berlina",
    vehicle_type: "car",
    doors: 4,
    seats: 5,
  };
  const b = await createCar(bike),
    c = await createCar(car);
  assert.equal(b.ok, true);
  assert.equal(c.ok, true);
  assert.equal(rows.find((r) => r.id === b.id).vehicle_type, "motorcycle");
  assert.equal(rows.find((r) => r.id === c.id).vehicle_type, "car");
  assert.equal((await updateCar(b.id, { ...bike, price: 4000 })).ok, true);
  assert.equal(rows.find((r) => r.id === b.id).vehicle_type, "motorcycle");
  assert.deepEqual(
    (await getVehicles("motorcycle")).map((v) => v.id),
    [b.id],
  );
  assert.deepEqual(
    (await getVehicles("car")).map((v) => v.id),
    [c.id],
  );
  assert.equal((await getVehicles()).length, 2);
  assert.deepEqual(requestedSections, ["carros", "carros", "carros"]);
});
test("inventory URL accepts only known vehicle sections", () => {
  assert.equal(inventoryVehicleType("carros"), "car");
  assert.equal(inventoryVehicleType("motas"), "motorcycle");
  for (const value of [undefined, "unknown", ["motas", "carros"]])
    assert.equal(inventoryVehicleType(value), null);
});
