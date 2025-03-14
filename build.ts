import { copy } from "https://deno.land/std@0.220.1/fs/copy.ts";
import { ensureDir } from "https://deno.land/std@0.220.1/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.220.1/path/mod.ts";

// Clean and create dist directory
const distDir = "./dist";
try {
  await Deno.remove(distDir, { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) {
    throw error;
  }
}
await ensureDir(distDir);

// Bundle TypeScript files using esbuild
console.log("Bundling TypeScript files...");
const command = new Deno.Command("deno", {
  args: [
    "run",
    "--allow-read",
    "--allow-write",
    "--allow-env",
    "--allow-net",
    "--allow-run",
    "npm:esbuild",
    "./src/main.ts",
    "--bundle",
    "--outfile=" + join(distDir, "main.js"),
    "--format=esm",
    "--target=es2020",
  ],
});

const { code, stdout, stderr } = await command.output();
if (code !== 0) {
  console.error("Bundling errors:", new TextDecoder().decode(stderr));
  Deno.exit(1);
}

console.log(new TextDecoder().decode(stdout));

// Copy public directory to dist
console.log("Copying public files...");
await copy("./public", distDir, { overwrite: true });

// Create .nojekyll file to disable Jekyll processing on GitHub Pages
await Deno.writeTextFile(`${distDir}/.nojekyll`, "");

console.log("Build completed successfully!");