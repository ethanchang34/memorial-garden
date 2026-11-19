import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { cn } from '@/lib/utils';

type HoldButtonProps = Omit<ComponentProps<'button'>, 'onClick'> & {
  holdMs?: number;
  onHoldComplete: () => void;
  onTap?: () => void;
  inactive?: boolean;
};

const HOLD_KEYS = new Set([' ', 'Enter']);

export function HoldButton({
  holdMs = 1200,
  onHoldComplete,
  onTap,
  inactive = false,
  className,
  children,
  style,
  ...props
}: HoldButtonProps) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const complete = useRef(onHoldComplete);
  const tap = useRef(onTap);

  useEffect(() => {
    complete.current = onHoldComplete;
    tap.current = onTap;
  }, [onHoldComplete, onTap]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function start() {
    if (inactive) {
      tap.current?.();
      return;
    }
    if (timer.current !== undefined) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      setHolding(false);
      complete.current();
    }, holdMs);
  }

  function stop() {
    const early = timer.current !== undefined;
    window.clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
    if (early) tap.current?.();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!HOLD_KEYS.has(event.key)) return;
    event.preventDefault();
    if (!event.repeat) start();
  }

  function onKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (!HOLD_KEYS.has(event.key)) return;
    event.preventDefault();
    stop();
  }

  function onClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0 && !inactive && timer.current === undefined) complete.current();
  }

  return (
    <button
      type="button"
      aria-disabled={inactive || undefined}
      data-holding={holding || undefined}
      className={cn('touch-none select-none [-webkit-touch-callout:none]', className)}
      style={{ ...style, '--hold-ms': `${holdMs}ms` } as CSSProperties}
      onPointerDown={(event) => {
        if (event.button === 0) start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={stop}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
