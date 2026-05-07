import { useEffect, useRef } from "react";

export type HotkeyBinding = {
  /** "mod+k", "shift+/", "esc", "enter", "arrowup", "arrowdown", "ctrl+=", etc. `mod` = Meta on macOS, Ctrl elsewhere. */
  combo: string;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  /** Default: false. Hotkey is suppressed when focus is in an input/textarea/contenteditable. */
  allowInInputs?: boolean;
};

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

function eventInEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function matches(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  const keyPart = parts[parts.length - 1];
  if (!keyPart) return false;

  const wantMod = parts.includes("mod") || parts.includes("cmd") || parts.includes("ctrl");
  const wantMeta = parts.includes("cmd") || (parts.includes("mod") && isMac);
  const wantCtrl = parts.includes("ctrl") || (parts.includes("mod") && !isMac);
  const wantShift = parts.includes("shift");
  const wantAlt = parts.includes("alt") || parts.includes("opt");

  if (wantMod) {
    if (wantMeta && !event.metaKey) return false;
    if (wantCtrl && !event.ctrlKey) return false;
  } else {
    if (event.metaKey || event.ctrlKey) return false;
  }
  if (wantShift !== event.shiftKey) return false;
  if (wantAlt !== event.altKey) return false;

  const key = event.key.toLowerCase();
  if (keyPart === "esc") return key === "escape";
  if (keyPart === "space") return key === " ";
  if (keyPart === "plus" || keyPart === "+") return key === "+" || key === "=" || event.code === "Equal";
  if (keyPart === "minus" || keyPart === "-") return key === "-" || event.code === "Minus";
  return key === keyPart;
}

export function useHotkeys(bindings: HotkeyBinding[]): void {
  const ref = useRef<HotkeyBinding[]>(bindings);
  ref.current = bindings;

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const editable = eventInEditableTarget(event.target);
      for (const binding of ref.current) {
        if (editable && !binding.allowInInputs) continue;
        if (!matches(event, binding.combo)) continue;
        if (binding.preventDefault) event.preventDefault();
        if (binding.stopPropagation) event.stopPropagation();
        binding.handler(event);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export const isAppleDevice = isMac;
