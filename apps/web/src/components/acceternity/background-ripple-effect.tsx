"use client";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type PulseTarget = "center" | "random";

/**
 * An interactive grid background that emits ripple waves on cell click.
 * Based on Aceternity UI Background Ripple Effect — requires `@theme inline`
 * `--animate-cell-ripple` so per-cell `--delay` / `--duration` resolve correctly.
 *
 * @see https://ui.aceternity.com/components/background-ripple-effect
 *
 * @param rows - Number of grid rows. Default: `8`
 * @param cols - Number of grid columns. Default: `27`
 * @param cellSize - Size of each cell in pixels. Default: `56`
 * @param className - Additional class names applied to the root element.
 *
 * ### Auto-pulse (loading indicator)
 *
 * @param pulse - Enable the auto-ripple loop. Default: `false`
 * @param pulseInterval - Milliseconds between each ripple. Default: `2000`
 * @param pulseTarget - Origin cell strategy: `"center"` | `"random"`. Default: `"center"`
 */
export const BackgroundRippleEffect = ({
  rows = 8,
  cols = 27,
  cellSize = 56,
  className,
  pulse = false,
  pulseInterval = 2000,
  pulseTarget = "center",
}: {
  rows?: number;
  cols?: number;
  cellSize?: number;
  className?: string;
  pulse?: boolean;
  pulseInterval?: number;
  pulseTarget?: PulseTarget;
}) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  function triggerRipple(row: number, col: number) {
    setClickedCell({ row, col });
    setRippleKey((k) => k + 1);
  }

  useEffect(() => {
    if (!pulse) return;

    const id = setInterval(() => {
      const row =
        pulseTarget === "center" ? Math.floor(rows / 2) : Math.floor(Math.random() * rows);
      const col =
        pulseTarget === "center" ? Math.floor(cols / 2) : Math.floor(Math.random() * cols);
      triggerRipple(row, col);
    }, pulseInterval);

    return () => clearInterval(id);
  }, [pulse, pulseInterval, pulseTarget, rows, cols]);

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 h-full w-full",
        "[--cell-border-color:var(--color-neutral-300)] [--cell-fill-color:var(--color-neutral-100)] [--cell-shadow-color:var(--color-neutral-500)]",
        "dark:[--cell-border-color:var(--color-neutral-700)] dark:[--cell-fill-color:var(--color-neutral-900)] dark:[--cell-shadow-color:var(--color-neutral-800)]",
        className,
      )}
    >
      <div className="relative h-auto w-auto overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-2 h-full w-full overflow-hidden" />
        <DivGrid
          key={`base-${rippleKey}`}
          className="mask-radial-from-20% mask-radial-at-top opacity-600"
          rows={rows}
          cols={cols}
          cellSize={cellSize}
          borderColor="var(--cell-border-color)"
          fillColor="var(--cell-fill-color)"
          clickedCell={clickedCell}
          onCellClick={triggerRipple}
          interactive
        />
      </div>
    </div>
  );
};

type DivGridProps = {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number;
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
};

function DivGrid({
  className,
  rows,
  cols,
  cellSize,
  borderColor,
  fillColor,
  clickedCell,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) {
  const cells = Array.from({ length: rows * cols }, (_, idx) => idx);

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
    marginInline: "auto",
  };

  return (
    <div className={cn("relative z-3", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 55) : 0;
        const duration = 200 + distance * 80;

        const style: CellStyle = clickedCell
          ? {
              "--delay": `${delay}ms`,
              "--duration": `${duration}ms`,
            }
          : {};

        return (
          <div
            key={idx}
            className={cn(
              "cell relative border-[0.5px] opacity-40 transition-opacity duration-150 will-change-transform hover:opacity-80 dark:shadow-[0px_0px_40px_1px_var(--cell-shadow-color)_inset]",
              clickedCell && "animate-cell-ripple fill-mode-[none]",
              !interactive && "pointer-events-none",
            )}
            style={{
              backgroundColor: fillColor,
              borderColor: borderColor,
              ...style,
            }}
            onClick={interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined}
          />
        );
      })}
    </div>
  );
}
