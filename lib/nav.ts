import { LayoutDashboard, NotebookText, PlayCircle, BarChart3, Wallet, Trophy, Sparkles, Settings } from "lucide-react";

export const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: NotebookText },
  { href: "/replay", label: "Replay", icon: PlayCircle },
  { href: "/stats", label: "Statistiken", icon: BarChart3 },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/accounts", label: "Konten", icon: Wallet },
  { href: "/leaderboard", label: "Rangliste", icon: Trophy },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];
