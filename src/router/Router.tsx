import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Structure from "../pages/Structure/Structure";
import Projects from "../pages/Projects/Projects";
import Tutorials from "../pages/Tutorials/Tutorials";
import Members from "../pages/Members/Members";


// Placeholder dla brakujących stron
const PlaceholderPage = ({ title }: { title: string }) => {
	return (
		<div
			style={{
				padding: "40px",
				textAlign: "center",
				color: "var(--text-muted)",
				fontSize: "18px",
			}}
		>
			<h2 style={{ color: "var(--text-dark)", marginBottom: "12px" }}>
				{title}
			</h2>
			<p>Ta strona jest w trakcie budowy. Wkrótce się pojawi!</p>
		</div>
	);
};

function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<Login />} />

			<Route element={<DashboardLayout />}>
				<Route path="/" element={<Dashboard />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/structure" element={<Structure />} />

				{/* Placeholdery dla innych stron */}
				<Route
					path="/projects"
					element={<Projects />}
				/>
				<Route
					path="/guides"
					element={<Tutorials />}
				/>
				<Route
					path="/members"
					element={<PlaceholderPage title="Członkowie" />}
				/>
				<Route
					path="/profile"
					element={<Members title="Mój profil" />}
				/>
				<Route path="/guides" element={<PlaceholderPage title="Poradniki" />} />
				<Route path="/vacancies" element={<PlaceholderPage title="Wakaty" />} />
				<Route path="/leave" element={<PlaceholderPage title="Urlop" />} />
				<Route
					path="/social"
					element={<PlaceholderPage title="Social Media" />}
				/>
				<Route
					path="/admin"
					element={<PlaceholderPage title="Administracja" />}
				/>
			</Route>
		</Routes>
	);
}

export default AppRoutes;
