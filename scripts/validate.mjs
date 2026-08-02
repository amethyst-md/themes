// Checks every theme in the repository, so a pull request is reviewed for taste
// rather than for correctness.
//
// The CSS rule here mirrors `validateThemeCss` in the Amethyst source. Two
// copies is the price of the catalogue being its own repository; if one of them
// changes, the other has to follow, or a theme accepted here would be refused
// by the app that downloads it.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const THEMES_DIR = join(ROOT, "themes");

const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);

/** Only custom properties, only inside `:root`. */
function validateCss(css) {
  const problems = [];
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");

  if (/<\/\s*style/i.test(stripped)) problems.push("contém `</style>`");
  if (/@import/i.test(stripped)) problems.push("contém `@import`");
  if (/url\s*\(/i.test(stripped)) problems.push("contém `url()`");

  let declarations = 0;
  const block = /([^{}]*)\{([^{}]*)\}/g;
  let cursor = 0;
  let match;

  while ((match = block.exec(stripped)) !== null) {
    if (stripped.slice(cursor, match.index).trim()) {
      problems.push("texto solto fora de um bloco");
    }
    cursor = block.lastIndex;

    if (match[1].trim() !== ":root") {
      problems.push(`seletor "${match[1].trim()}" — use apenas :root`);
    }
    for (const raw of match[2].split(";")) {
      const declaration = raw.trim();
      if (!declaration) continue;
      if (!/^--[A-Za-z0-9_-]+\s*:/.test(declaration)) {
        problems.push(`"${declaration.slice(0, 40)}" não é uma variável`);
        continue;
      }
      declarations++;
    }
  }

  if (stripped.slice(cursor).trim()) problems.push("texto solto no fim do arquivo");
  if (declarations === 0 && problems.length === 0) problems.push("nenhuma variável definida");

  return problems;
}

// --- index.json ---

const index = JSON.parse(readFileSync(join(ROOT, "index.json"), "utf8"));
if (!Array.isArray(index.themes)) {
  console.error("index.json não tem uma lista `themes`.");
  process.exit(1);
}

const listed = new Set();
for (const entry of index.themes) {
  const where = `index.json → ${entry.id ?? "(sem id)"}`;

  if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.id ?? "")) {
    fail(where, "id precisa ser minúsculo, sem espaço, e é o nome da pasta");
    continue;
  }
  if (listed.has(entry.id)) fail(where, "id repetido");
  listed.add(entry.id);

  if (!entry.name) fail(where, "falta `name`");
  if (!entry.version) fail(where, "falta `version`");
  for (const slot of ["bg", "sidebar", "accent", "text"]) {
    if (!entry.colors?.[slot]) fail(where, `falta \`colors.${slot}\` — é a miniatura do catálogo`);
  }

  const folder = join(THEMES_DIR, entry.id);
  if (!existsSync(folder)) {
    fail(where, `não existe a pasta themes/${entry.id}`);
    continue;
  }

  // --- theme.css ---
  const cssPath = join(folder, "theme.css");
  if (!existsSync(cssPath)) {
    fail(where, "falta theme.css");
  } else {
    const css = readFileSync(cssPath, "utf8");
    if (css.length > 256 * 1024) fail(where, "theme.css acima de 256 KB");
    for (const problem of validateCss(css)) fail(`themes/${entry.id}/theme.css`, problem);
  }

  // --- manifest.json ---
  const manifestPath = join(folder, "manifest.json");
  if (!existsSync(manifestPath)) {
    fail(where, "falta manifest.json");
  } else {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (!manifest.name) fail(`themes/${entry.id}/manifest.json`, "falta `name`");
      if (manifest.version !== entry.version) {
        fail(
          `themes/${entry.id}`,
          `version do manifest (${manifest.version}) difere do index (${entry.version}) — ` +
            "é o que faz o app oferecer atualização",
        );
      }
    } catch {
      fail(`themes/${entry.id}/manifest.json`, "não é um JSON válido");
    }
  }
}

// A folder nobody listed is invisible to the app, which reads only the index.
if (existsSync(THEMES_DIR)) {
  for (const name of readdirSync(THEMES_DIR)) {
    if (!listed.has(name)) fail(`themes/${name}`, "existe mas não está no index.json");
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} problema(s):\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`${index.themes.length} tema(s) verificado(s). Tudo certo.`);
