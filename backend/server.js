import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/pageRouter.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.resolve(__dirname, "../frontend")));

app.use("/", router);

app.use((req, res) => {
	console.log(req.url, "not found");
	res.status(404).sendFile(
		path.join(__dirname, "../frontend/pages/404.html")
	);
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
