import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DomainsPage } from "./pages/DomainsPage";
import { DomainRecordsPage } from "./pages/DomainRecordsPage";
import { UsersPage } from "./pages/UsersPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DomainsPage />} />
          <Route path="/domains/:domain" element={<DomainRecordsPage />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
