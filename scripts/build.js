const fs = require("fs");
const path = require("path");

const sourceDir = path.join(__dirname, "..");
const distDir = path.join(__dirname, "../dist");

if (fs.existsSync(distDir)) {
	fs.rmSync(distDir, { recursive: true });
}

fs.mkdirSync(distDir);

const filesToCopy = [
	"manifest.json",
	"config.js",
	"popup.html",
	"popup.js",
	"auth.js",
	"styles.css",
	"background.js",
	"images",
];

filesToCopy.forEach((file) => {
	const src = path.join(sourceDir, file);
	const dest = path.join(distDir, file);

	if (fs.statSync(src).isDirectory()) {
		fs.cpSync(src, dest, { recursive: true });
	} else {
		fs.copyFileSync(src, dest);
	}
});

console.log("Build complete!");
