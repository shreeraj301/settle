import { useEffect } from "react";
import { useSettle } from "@/lib/settle/store";

export function ThemeBoot() {
  const theme = useSettle((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}
