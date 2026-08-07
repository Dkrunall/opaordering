// Generates supabase/migrations/0003_seed_tables.sql and 0004_seed_menu.sql
// from scripts/menu_clean.json (raw extract from Zillout's getFullMenu2 API).
//
// Run with: node scripts/generate-seed-sql.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC = path.join(__dirname, 'menu_clean.json');
const OUT_TABLES = path.join(__dirname, '..', 'supabase', 'migrations', '0003_seed_tables.sql');
const OUT_MENU = path.join(__dirname, '..', 'supabase', 'migrations', '0004_seed_menu.sql');

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// section key -> [section display name, { subCategoryKey: category display name }]
const SECTION_MAP = {
  'signature mocktail': ['Signature Mocktails', { 'SIGNATURE MOCKTAILS': 'Signature Mocktails' }],
  'signature cocktail': ['Signature Cocktails', { 'SIGNATURE COCKTAILS': 'Signature Cocktails' }],
  desserts: ['Desserts', { DESSERT: 'Desserts' }],
  drinks: [
    'Bar',
    {
      WHISKEY: 'Whiskey',
      'AMERICAN WHISKEY/BOURBON': 'American Whiskey / Bourbon',
      'SINGLE MALTS': 'Single Malts',
      VODKA: 'Vodka',
      GIN: 'Gin',
      'BRANDY /COGNAC': 'Brandy / Cognac',
      RUM: 'Rum',
      TEQUILA: 'Tequila',
      LIQUEURS: 'Liqueurs',
      BEER: 'Beer',
      BREEZER: 'Breezer',
      'CHAMPAGNE & SPARKLING WINES': 'Champagne & Sparkling Wines',
      'WHITE WINE': 'White Wine',
      'RED WINE': 'Red Wine',
      'ROSE WINE': 'Rose Wine',
      SHOOTERS: 'Shooters',
      'SHOTS & SHOT TRAYS': 'Shots & Shot Trays',
      'CLASSIC COCKTAILS': 'Classic Cocktails',
      LIIT: 'LIIT',
      'ENERGY COCKTAILS': 'Energy Cocktails',
    },
  ],
  beverages: [
    'Beverages',
    { MIXERS: 'Mixers', MOCKTAILS: 'Mocktails', 'ENERGY ZONE': 'Energy Zone' },
  ],
  barista: [
    'Barista',
    {
      'HOT BEVERAGES': 'Hot Beverages',
      'COLD COFFEE': 'Cold Coffee',
      'ICED TEA': 'Iced Tea',
      LEMONADE: 'Lemonade',
      MILKSHAKE: 'Milkshake',
      'HERBAL TEA': 'Herbal Tea',
      TEA: 'Tea',
      'FRESH JUICE': 'Fresh Juice',
    },
  ],
  food: [
    'Food',
    {
      'COLD MEZZE': 'Cold Mezze',
      'HOT MEZZE VEGETARIAN': 'Hot Mezze — Vegetarian',
      'HOT MEZZE NON-VEGETARIAN': 'Hot Mezze — Non-Vegetarian',
      SALADS: 'Salads',
      SOUP: 'Soup',
      GRILLS: 'Grills',
      'FROM THE TURKISH GRILL': 'From the Turkish Grill',
      'FRESHLY BAKED BREAD BASKET': 'Freshly Baked Bread Basket',
      PIDES: 'Pides',
      PIZZAS: 'Pizzas',
      'MAIN COURSE': 'Main Course',
      'WRAPS/SAVORIES': 'Wraps / Savories',
    },
  ],
};

const VARIANT_LABEL_MAP = {
  PEG: 'Peg',
  BOTTLE: 'Bottle',
  GLASS: 'Glass',
  '30ML': '30ml',
  'SINGLE SHOT': 'Single Shot',
  'SHOTS OF 6': 'Shots of 6',
  'SHOTS OF 12': 'Shots of 12',
};

const TYPE_MAP = {
  veg: { dietary_type: 'veg', is_alcoholic: false },
  'non-veg': { dietary_type: 'non_veg', is_alcoholic: false },
  egg: { dietary_type: 'egg', is_alcoholic: false },
  seafood: { dietary_type: 'seafood', is_alcoholic: false },
  alcoholic: { dietary_type: null, is_alcoholic: true },
  'non-alcoholic': { dietary_type: null, is_alcoholic: false },
};

function sqlStr(v) {
  if (v === null || v === undefined) return 'null';
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlBool(v) {
  return v ? 'true' : 'false';
}
function sqlNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? String(n) : 'null';
}
function titleCaseLabel(desc) {
  // Used only for the small, known allergen-label vocabulary, not for
  // free-text item names (which are kept exactly as the source gives them).
  return desc
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

let categoryRows = [];
let itemRows = [];
let variantRows = [];

let categorySort = 0;

for (const [sectionKey, [sectionName, subCatMap]] of Object.entries(SECTION_MAP)) {
  const sectionData = raw[sectionKey];
  if (!sectionData) continue;

  for (const [subKey, catName] of Object.entries(subCatMap)) {
    const items = sectionData[subKey];
    if (!items) continue;

    const categoryId = crypto.randomUUID();
    categoryRows.push({ id: categoryId, name: catName, section: sectionName, sort_order: categorySort });
    categorySort += 1;

    let itemSort = 0;
    for (const item of items) {
      const itemId = crypto.randomUUID();
      const typeInfo = TYPE_MAP[item.type] || { dietary_type: null, is_alcoholic: false };
      const priceNum = parseFloat(item.price);
      const isZeroPrice = !Number.isFinite(priceNum) || priceNum <= 0;

      let description = (item.description || '').trim();
      if (item.labels) {
        const parts = titleCaseLabel(item.labels).filter((p) => p.toUpperCase() !== 'CONTAINS ALLERGENS');
        if (parts.length) {
          const allergenNote = `Contains: ${parts.map((p) => p.charAt(0) + p.slice(1).toLowerCase()).join(', ')}`;
          description = description ? `${description} | ${allergenNote}` : allergenNote;
        }
      }
      if (isZeroPrice) {
        description = description
          ? `${description} | Ask your server for pricing`
          : 'Ask your server for pricing';
      }

      itemRows.push({
        id: itemId,
        category_id: categoryId,
        name: item.name.trim(),
        description: description || null,
        price: isZeroPrice ? 0 : priceNum,
        image_url: item.image || null,
        dietary_type: typeInfo.dietary_type,
        is_alcoholic: typeInfo.is_alcoholic,
        is_available: !isZeroPrice,
        sort_order: itemSort,
      });
      itemSort += 1;

      if (item.quantity && typeof item.quantity === 'object') {
        let variantSort = 0;
        for (const [qKey, qPrice] of Object.entries(item.quantity)) {
          const label = VARIANT_LABEL_MAP[qKey] || qKey;
          const vPrice = parseFloat(qPrice);
          if (!Number.isFinite(vPrice)) continue;
          variantRows.push({
            id: crypto.randomUUID(),
            menu_item_id: itemId,
            label,
            price: vPrice,
            sort_order: variantSort,
          });
          variantSort += 1;
        }
      }
    }
  }
}

// ── Write 0003_seed_tables.sql ──────────────────────────────────────────
const N_TABLES = 20;
let tablesSql = `-- OPA Bar & Cafe — QR table ordering
-- 0003_seed_tables.sql: starter set of ${N_TABLES} dining tables so the
-- customer flow (/order?table=N) works before the admin QR tool adds more.

insert into public.tables (table_number, is_active) values\n`;
tablesSql += Array.from({ length: N_TABLES }, (_, i) => `  (${i + 1}, true)`).join(',\n');
tablesSql += '\non conflict (table_number) do nothing;\n';
fs.writeFileSync(OUT_TABLES, tablesSql);

// ── Write 0004_seed_menu.sql ────────────────────────────────────────────
let menuSql = `-- OPA Bar & Cafe — QR table ordering
-- 0004_seed_menu.sql: full menu extracted from the venue's Zillout page
-- (categories, menu items, and serving-size price variants).
-- Generated by scripts/generate-seed-sql.js — do not hand-edit; regenerate
-- from scripts/menu_clean.json instead.

insert into public.categories (id, name, section, sort_order) values\n`;
menuSql += categoryRows
  .map((c) => `  (${sqlStr(c.id)}, ${sqlStr(c.name)}, ${sqlStr(c.section)}, ${c.sort_order})`)
  .join(',\n');
menuSql += ';\n\n';

menuSql += `insert into public.menu_items (id, category_id, name, description, price, image_url, dietary_type, is_alcoholic, is_available, sort_order) values\n`;
menuSql += itemRows
  .map(
    (i) =>
      `  (${sqlStr(i.id)}, ${sqlStr(i.category_id)}, ${sqlStr(i.name)}, ${sqlStr(i.description)}, ${sqlNum(
        i.price
      )}, ${sqlStr(i.image_url)}, ${sqlStr(i.dietary_type)}, ${sqlBool(i.is_alcoholic)}, ${sqlBool(
        i.is_available
      )}, ${i.sort_order})`
  )
  .join(',\n');
menuSql += ';\n\n';

if (variantRows.length) {
  menuSql += `insert into public.menu_item_variants (id, menu_item_id, label, price, sort_order) values\n`;
  menuSql += variantRows
    .map(
      (v) =>
        `  (${sqlStr(v.id)}, ${sqlStr(v.menu_item_id)}, ${sqlStr(v.label)}, ${sqlNum(v.price)}, ${v.sort_order})`
    )
    .join(',\n');
  menuSql += ';\n';
}

fs.writeFileSync(OUT_MENU, menuSql);

console.log(`categories: ${categoryRows.length}`);
console.log(`items: ${itemRows.length}`);
console.log(`variants: ${variantRows.length}`);
console.log(`wrote ${OUT_TABLES}`);
console.log(`wrote ${OUT_MENU}`);
