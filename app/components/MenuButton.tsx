"use client";

import { Menu } from "lucide-react";
import { openMobileSidebar } from "./MobileSidebar";

export default function MenuButton() {
  return (
    <button
      type="button"
      onClick={openMobileSidebar}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border text-gray-600 hover:bg-gray-50 lg:hidden"
      aria-label="Deschide meniul"
    >
      <Menu className="h-5 w-5" strokeWidth={2} />
    </button>
  );
}
