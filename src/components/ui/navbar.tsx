import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();

  return (
    <div className="flex items-center space-x-4">
      <Link
        href="/backtest"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/backtest"
            ? "text-black dark:text-white"
            : "text-muted-foreground"
        )}
      >
        回测系统
      </Link>
      <Link
        href="/test-agents"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/test-agents"
            ? "text-black dark:text-white"
            : "text-muted-foreground"
        )}
      >
        AI代理测试
      </Link>
    </div>
  );
};

export default Navbar; 