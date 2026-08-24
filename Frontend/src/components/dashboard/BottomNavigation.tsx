import { Home, Sprout, ShoppingCart, TrendingUp, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
    activeModule: string;
    setActiveModule: (module: string) => void;
    onToggleSidebar: () => void;
}

const BottomNavigation = ({ activeModule, setActiveModule, onToggleSidebar }: BottomNavigationProps) => {
    const navItems = [
        { id: "home", icon: Home, label: "Home" },
        { id: "crop-profit-predictor", icon: TrendingUp, label: "Predict" },
        { id: "disease-detection", icon: Sprout, label: "Disease" },
        { id: "marketplace", icon: ShoppingCart, label: "Market" },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 px-2 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id)}
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors",
                            activeModule === item.id ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5", activeModule === item.id && "scale-110")} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
                <button
                    onClick={onToggleSidebar}
                    className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-muted-foreground"
                >
                    <Menu className="h-5 w-5" />
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNavigation;
