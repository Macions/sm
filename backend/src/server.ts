import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db";
import authRoutes from "./routes/auth.routes";
import onboardingRoutes from "./routes/onboarding.routes";
import dashboardRoutes from "./routes/dashboard.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/test-db", async (req, res) => {
	try {
		const [rows] = await db.query("SELECT 1");

		res.json({
			success: true,
			database: rows,
		});
	} catch (error) {
		console.error(error);

		res.status(500).json({
			success: false,
			error: "Błąd połączenia z bazą",
		});
	}
});
app.get("/", (req, res) => {
	res.send("Backend Siły Młodych działa 🚀");
});

app.listen(3000, () => {
	console.log("Backend działa na porcie 3000");
});
