import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export function TopNav() {
  const { user, logout } = useAuthStore();
  const { setTheme, theme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      // Ignore
    } finally {
      localStorage.removeItem("accessToken");
      logout();
      router.push("/login");
    }
  };

  return (
    <div className="h-16 flex items-center border-b bg-card px-4 shadow-sm">
      <div className="ml-auto flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <div className="flex items-center space-x-2 border-l pl-4">
          <div className="text-sm font-medium leading-none">
            {user?.name || "User"}
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
