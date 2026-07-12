const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "../dist");
const zipPath = path.join(__dirname, "../haus-search-extension.zip");

const output = fs.createWriteStream(zipPath);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
	console.log(`Extension packaged: ${zipPath} (${archive.pointer()} bytes)`);
});

archive.on("error", (err) => {
	throw err;
});

archive.pipe(output);
archive.directory(distDir, false);
archive.finalize();
