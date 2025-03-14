import { serve } from "std/http/server.ts";
import { serveDir } from "std/http/file_server.ts";

const port = 8000;

console.log(`HTTP webserver running at http://localhost:${port}`);

await serve((req) => {
  const url = new URL(req.url);
  
  // Serve static files from the public directory
  return serveDir(req, {
    fsRoot: "dist",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
}, { port });