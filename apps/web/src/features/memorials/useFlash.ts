import { useCallback, useEffect, useRef, useState } from 'react';

export const FLASH_MS = 2600;

export function useFlash(ms = FLASH_MS): [string | null, (text: string) => void] {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = useCallback(
    (next: string) => {
      window.clearTimeout(timer.current);
      setText(next);
      timer.current = window.setTimeout(() => setText(null), ms);
    },
    [ms],
  );

  return [text, show];
}
