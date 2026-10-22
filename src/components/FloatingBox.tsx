import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GripHorizontal, Minus, Plus, RotateCcw, EyeOff } from 'lucide-react';
import { MAX_SCALE, MIN_SCALE, resetWidgetLayout, setWidgetLayout, useWidgetLayout } from '../services/widgetLayout';

type Corner = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

interface Props {
  /** unique name, used to remember position and size */
  id: string;
  /** where it sits until the user moves it */
  corner: Corner;
  /** distance from that corner in px (default corner offsets) */
  offsetX?: number;
  offsetY?: number;
  /** 'bar' = a small handle strip on top; 'body' = grab anywhere (good for the compass) */
  grip?: 'bar' | 'body';
  onHide?: () => void;
  lang: 'en' | 'ar';
  z?: number;
  children: React.ReactNode;
}

const MOVE_THRESHOLD = 5; // px: below this a press counts as a tap (opens the little control bar)

/**
 * A floating widget the user can drag anywhere, make smaller/bigger and hide.
 * Tap the handle (or the compass itself) to show the − / + / reset / hide buttons.
 */
export const FloatingBox: React.FC<Props> = ({ id, corner, offsetX = 8, offsetY = 8, grip = 'bar', onHide, lang, z = 900, children }) => {
  const isAr = lang === 'ar';
  const layout = useWidgetLayout(id);
  const boxRef = useRef<HTMLDivElement>(null);
  const ctlRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [live, setLive] = useState<{ x: number; y: number } | null>(null); // position while dragging
  const [showCtl, setShowCtl] = useState(false);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  // real (unscaled) size of the content
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const sw = size.w * layout.scale;
  const sh = size.h * layout.scale;
  const maxX = Math.max(0, vp.w - sw);
  const maxY = Math.max(0, vp.h - sh);

  const defaults = {
    x: corner.endsWith('left') ? offsetX : vp.w - sw - offsetX,
    y: corner.startsWith('top') ? offsetY : vp.h - sh - offsetY,
  };
  const rawX = live ? live.x : layout.x ?? defaults.x;
  const rawY = live ? live.y : layout.y ?? defaults.y;
  const x = Math.min(maxX, Math.max(0, rawX));
  const y = Math.min(maxY, Math.max(0, rawY));

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: x, oy: y, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;
    d.moved = true;
    setLive({ x: Math.min(maxX, Math.max(0, d.ox + dx)), y: Math.min(maxY, Math.max(0, d.oy + dy)) });
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (!d) return;
    if (d.moved && live) setWidgetLayout(id, { x: Math.round(live.x), y: Math.round(live.y) });
    else if (!d.moved) setShowCtl((v) => !v);
    setLive(null);
  };

  // tap outside closes the control bar
  useEffect(() => {
    if (!showCtl) return;
    const close = (e: PointerEvent) => {
      const t = e.target as Node;
      if (boxRef.current?.contains(t) || ctlRef.current?.contains(t)) return;
      setShowCtl(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [showCtl]);

  const bump = useCallback(
    (delta: number) => {
      setWidgetLayout(id, { scale: layout.scale + delta });
    },
    [id, layout.scale],
  );

  // control bar sits above the box, or below it when the box is at the very top
  const ctlY = y >= 44 ? y - 40 : y + sh + 4;
  const ctlX = Math.min(Math.max(0, x), Math.max(0, vp.w - 190));

  const btn = 'w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 disabled:opacity-40';

  const gripHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

  return (
    <>
      <div
        ref={boxRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: z,
          transform: `translate(${x}px, ${y}px) scale(${layout.scale})`,
          transformOrigin: 'top left',
          visibility: size.w === 0 ? 'hidden' : 'visible',
        }}
        className={grip === 'body' ? `cursor-grab active:cursor-grabbing touch-none ${showCtl ? 'ring-2 ring-sky-400/70 rounded-full' : ''}` : ''}
        {...(grip === 'body' ? gripHandlers : {})}
      >
        {grip === 'bar' && (
          <div
            {...gripHandlers}
            className="h-5 rounded-t-xl bg-slate-800/95 border border-b-0 border-slate-700/80 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            title={isAr ? 'اسحب للتحريك • اضغط لإظهار أزرار الحجم والإخفاء' : 'Drag to move • tap for size / hide buttons'}
          >
            <GripHorizontal className="w-5 h-3.5 text-slate-400" />
          </div>
        )}
        {children}
      </div>

      {showCtl && (
        <div
          ref={ctlRef}
          dir="ltr"
          style={{ position: 'fixed', left: 0, top: 0, zIndex: z + 1, transform: `translate(${ctlX}px, ${ctlY}px)` }}
          className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/95 border border-sky-500/50 shadow-2xl"
        >
          <button className={btn} onClick={() => bump(-0.15)} disabled={layout.scale <= MIN_SCALE} title={isAr ? 'تصغير' : 'Smaller'}>
            <Minus className="w-4 h-4" />
          </button>
          <button className={btn} onClick={() => bump(0.15)} disabled={layout.scale >= MAX_SCALE} title={isAr ? 'تكبير' : 'Bigger'}>
            <Plus className="w-4 h-4" />
          </button>
          <button className={btn} onClick={() => resetWidgetLayout(id)} title={isAr ? 'رجّعه لمكانه وحجمه الأصلي' : 'Reset position & size'}>
            <RotateCcw className="w-4 h-4" />
          </button>
          {onHide && (
            <button
              className={`${btn} !bg-rose-900/70 hover:!bg-rose-800`}
              onClick={() => {
                setShowCtl(false);
                onHide();
              }}
              title={isAr ? 'إخفاء (ترجّعه من القائمة ⋮)' : 'Hide (bring it back from the ⋮ menu)'}
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </>
  );
};
