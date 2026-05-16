#!/usr/bin/env node
/**
 * cowork-dicas.mjs
 * Runs the Claude Code CLI to generate travel tips and saves them to Convex.
 *
 * Usage:
 *   node scripts/cowork-dicas.mjs
 *
 * Scheduled via launchd (see instructions at bottom of this file).
 * Requires: claude CLI installed & authenticated, npx + convex configured.
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const promptFile = join(__dirname, "cowork-dicas-prompt.md");
const prompt = readFileSync(promptFile, "utf-8").trim();

// ── Unsplash URL helper ─────────────────────────────────────────────────────
function unsplashUrl(keyword) {
  const encoded = encodeURIComponent(keyword);
  return `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80&sig=${encoded}`;
}

// ── Category mapping ────────────────────────────────────────────────────────
function mapCategory(tipo) {
  const map = {
    "geral": "dica",
    "joao-pessoa": "joao-pessoa",
    "curiosidade": "curiosidade",
  };
  return map[tipo] ?? tipo;
}

// ── Run Claude Code CLI ─────────────────────────────────────────────────────
console.log("🤖 Gerando dicas com Claude Code CLI...");

let rawOutput;
try {
  rawOutput = execSync(
    `claude --print --output-format=json "${prompt.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`,
    {
      cwd: projectRoot,
      encoding: "utf-8",
      timeout: 120_000, // 2 min
    }
  );
} catch (err) {
  // If the above fails (prompt too long for inline), fall back to stdin
  try {
    rawOutput = execSync(
      `echo ${JSON.stringify(prompt)} | claude --print --output-format=json`,
      {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 120_000,
      }
    );
  } catch (err2) {
    console.error("❌ Claude CLI falhou:", err2.message);
    process.exit(1);
  }
}

// ── Parse JSON output ───────────────────────────────────────────────────────
// claude --output-format=json returns { result: "...", ... }
let claudeJson;
try {
  claudeJson = JSON.parse(rawOutput.trim());
} catch {
  // Maybe it returned raw JSON already
  claudeJson = { result: rawOutput.trim() };
}

const resultText = claudeJson?.result ?? rawOutput.trim();

// Extract the JSON array from the result text
let dicas;
try {
  // Try direct parse first
  dicas = JSON.parse(resultText);
} catch {
  // Extract JSON array from text (in case there's surrounding text)
  const match = resultText.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error("❌ Não foi possível extrair JSON do output do Claude:");
    console.error(resultText.slice(0, 500));
    process.exit(1);
  }
  try {
    dicas = JSON.parse(match[0]);
  } catch (err) {
    console.error("❌ JSON inválido:", err.message);
    console.error(match[0].slice(0, 500));
    process.exit(1);
  }
}

if (!Array.isArray(dicas) || dicas.length === 0) {
  console.error("❌ Output não é um array ou está vazio");
  process.exit(1);
}

console.log(`✅ ${dicas.length} dica(s) gerada(s)`);

// ── Save each dica to Convex ────────────────────────────────────────────────
let saved = 0;
let failed = 0;

for (const dica of dicas) {
  const { titulo, slug, resumo, conteudoMarkdown, capa_keyword, tipo } = dica;

  if (!titulo || !slug || !resumo || !conteudoMarkdown) {
    console.warn(`⚠️  Dica incompleta, pulando: ${JSON.stringify(dica).slice(0, 80)}`);
    failed++;
    continue;
  }

  const args = {
    title: titulo,
    slug: `${slug}-${Date.now()}`, // Append timestamp to ensure uniqueness
    excerpt: resumo,
    content: conteudoMarkdown,
    cover: unsplashUrl(capa_keyword ?? "João Pessoa Brazil beach"),
    category: mapCategory(tipo ?? "geral"),
    tags: [tipo ?? "geral", "cowork"],
  };

  try {
    execSync(
      `npx --yes convex run dicas:createFromCowork '${JSON.stringify(args)}'`,
      {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 30_000,
        stdio: "inherit",
      }
    );
    console.log(`✅ Salvo: "${titulo}"`);
    saved++;
  } catch (err) {
    console.error(`❌ Falhou ao salvar "${titulo}": ${err.message}`);
    failed++;
  }
}

console.log(`\n📊 Resultado: ${saved} salva(s), ${failed} falha(s)`);

if (saved === 0) {
  process.exit(1);
}

/**
 * ── launchd setup (macOS) ────────────────────────────────────────────────────
 *
 * To schedule this script to run daily at 07:00, create the plist below:
 *
 * File: ~/Library/LaunchAgents/com.huan.cowork-dicas.plist
 *
 * <?xml version="1.0" encoding="UTF-8"?>
 * <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
 *   "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
 * <plist version="1.0">
 * <dict>
 *   <key>Label</key>
 *   <string>com.huan.cowork-dicas</string>
 *   <key>ProgramArguments</key>
 *   <array>
 *     <string>/usr/local/bin/node</string>
 *     <string>/Users/SEU_USUARIO/Decolar/landing-destinos/scripts/cowork-dicas.mjs</string>
 *   </array>
 *   <key>StartCalendarInterval</key>
 *   <dict>
 *     <key>Hour</key>
 *     <integer>7</integer>
 *     <key>Minute</key>
 *     <integer>0</integer>
 *   </dict>
 *   <key>StandardOutPath</key>
 *   <string>/tmp/huan-cowork-dicas.log</string>
 *   <key>StandardErrorPath</key>
 *   <string>/tmp/huan-cowork-dicas.err</string>
 *   <key>WorkingDirectory</key>
 *   <string>/Users/SEU_USUARIO/Decolar/landing-destinos</string>
 *   <key>EnvironmentVariables</key>
 *   <dict>
 *     <key>PATH</key>
 *     <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
 *     <key>NEXT_PUBLIC_CONVEX_URL</key>
 *     <string>YOUR_CONVEX_URL_HERE</string>
 *   </dict>
 * </dict>
 * </plist>
 *
 * Then load it:
 *   launchctl load ~/Library/LaunchAgents/com.huan.cowork-dicas.plist
 *
 * To unload:
 *   launchctl unload ~/Library/LaunchAgents/com.huan.cowork-dicas.plist
 *
 * To run manually:
 *   node scripts/cowork-dicas.mjs
 */
