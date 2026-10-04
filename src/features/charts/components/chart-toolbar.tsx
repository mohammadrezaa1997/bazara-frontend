'use client';

import { useState } from 'react';
import {
  Activity,
  BellRing,
  Camera,
  Crosshair,
  Eye,
  EyeOff,
  Lock,
  Magnet,
  Maximize2,
  Minus,
  MousePointer2,
  Move,
  Pencil,
  PlayCircle,
  Redo2,
  Rows3,
  Ruler,
  SlidersHorizontal,
  Square,
  Trash2,
  TrendingUp,
  Type,
  Undo2,
  Unlock,
} from 'lucide-react';

import type { ChartDrawing, ChartDrawingTool } from './chart-drawings';

export type IndicatorKey =
  | 'ema20'
  | 'ema50'
  | 'ema200'
  | 'levels'
  | 'volume'
  | 'rsi'
  | 'macd';

interface DrawingRailProps {
  activeTool: ChartDrawingTool;
  onToolChange: (tool: ChartDrawingTool) => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
}

interface ChartTopToolbarProps {
  indicators: Record<IndicatorKey, boolean>;
  onToggleIndicator: (key: IndicatorKey) => void;
  selectedDrawing: ChartDrawing | null;
  drawingCount: number;
  allDrawingsHidden: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  onToggleSelectedLock: () => void;
  onToggleSelectedVisibility: () => void;
  onToggleAllVisibility: () => void;
  onClearAll: () => void;
  onFullscreen: () => void;
  onScreenshot: () => void;
  priceAlertCount?: number;
  onOpenPriceAlerts?: () => void;
  replayActive?: boolean;
  replayCanStart?: boolean;
  onToggleReplay?: () => void;
}

const drawingTools: Array<{
  tool: ChartDrawingTool;
  label: string;
  Icon: typeof Move;
}> = [
  { tool: 'navigate', label: 'حرکت و زوم', Icon: Move },
  { tool: 'select', label: 'انتخاب ترسیم', Icon: MousePointer2 },
  { tool: 'trendline', label: 'خط روند', Icon: TrendingUp },
  { tool: 'horizontal', label: 'خط افقی', Icon: Minus },
  { tool: 'vertical', label: 'خط عمودی', Icon: Crosshair },
  { tool: 'fibonacci', label: 'فیبوناچی', Icon: Rows3 },
  { tool: 'rectangle', label: 'ناحیه قیمتی', Icon: Square },
  { tool: 'brush', label: 'قلم آزاد', Icon: Pencil },
  { tool: 'text', label: 'یادداشت متنی', Icon: Type },
  { tool: 'measure', label: 'اندازه‌گیری', Icon: Ruler },
];

const indicatorLabels: Record<IndicatorKey, string> = {
  ema20: 'EMA 20',
  ema50: 'EMA 50',
  ema200: 'EMA 200',
  levels: 'سطوح تحلیل',
  volume: 'حجم',
  rsi: 'RSI 14',
  macd: 'MACD',
};

function ToolbarButton({
  title,
  active = false,
  disabled = false,
  danger = false,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? 'border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)] shadow-sm'
          : danger
            ? 'border-[var(--nv-danger-border)] bg-[var(--nv-danger-soft)] text-[var(--nv-danger)] hover:brightness-95'
            : 'border-[var(--nv-border)] bg-[var(--nv-soft)] text-[var(--nv-muted)] hover:border-[var(--nv-border-strong)] hover:bg-[var(--nv-soft-strong)] hover:text-[var(--nv-text)]'
      }`}
    >
      {children}
    </button>
  );
}

export function DrawingRail({
  activeTool,
  onToolChange,
  snapEnabled,
  onToggleSnap,
}: DrawingRailProps) {
  return (
    <aside
      dir="rtl"
      className="nv-scrollbar flex max-w-full gap-1.5 overflow-x-auto border-b border-[var(--nv-border)] bg-[var(--nv-panel-raised)] p-2 lg:absolute lg:bottom-0 lg:left-0 lg:top-0 lg:z-30 lg:w-14 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:border-b-0 lg:border-r"
      aria-label="ابزارهای ترسیم نمودار"
    >
      {drawingTools.map(({ tool, label, Icon }) => (
        <ToolbarButton
          key={tool}
          title={label}
          active={activeTool === tool}
          onClick={() => onToolChange(tool)}
        >
          <Icon className="h-4 w-4" />
        </ToolbarButton>
      ))}
      <div className="mx-1 h-8 w-px shrink-0 bg-[var(--nv-border)] lg:my-1 lg:h-px lg:w-8" />
      <ToolbarButton
        title={snapEnabled ? 'خاموش‌کردن آهنربا' : 'چسبیدن به قیمت‌های کندل'}
        active={snapEnabled}
        onClick={onToggleSnap}
      >
        <Magnet className="h-4 w-4" />
      </ToolbarButton>
    </aside>
  );
}

export function ChartTopToolbar({
  indicators,
  onToggleIndicator,
  selectedDrawing,
  drawingCount,
  allDrawingsHidden,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDeleteSelected,
  onToggleSelectedLock,
  onToggleSelectedVisibility,
  onToggleAllVisibility,
  onClearAll,
  onFullscreen,
  onScreenshot,
  priceAlertCount = 0,
  onOpenPriceAlerts,
  replayActive = false,
  replayCanStart = false,
  onToggleReplay,
}: ChartTopToolbarProps) {
  const [showIndicators, setShowIndicators] = useState(false);
  return (
    <div
      dir="rtl"
      className="nv-scrollbar relative flex min-h-14 flex-nowrap items-center gap-2 overflow-x-auto border-b border-[var(--nv-border)] bg-[var(--nv-panel-raised)] px-3 py-2 lg:flex-wrap lg:overflow-visible lg:pr-4"
    >
      <button
        type="button"
        onClick={() => setShowIndicators((current) => !current)}
        className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-black transition ${
          showIndicators
            ? 'border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)] shadow-sm'
            : 'border-[var(--nv-border)] bg-[var(--nv-soft)] text-[var(--nv-text-soft)]'
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        اندیکاتورها
      </button>

      <div className="h-6 w-px bg-[var(--nv-border)]" />

      {onOpenPriceAlerts ? (
        <div className="relative">
          <ToolbarButton title="هشدار قیمت" onClick={onOpenPriceAlerts}>
            <BellRing className="h-4 w-4" />
          </ToolbarButton>
          {priceAlertCount > 0 ? (
            <span className="pointer-events-none absolute -left-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--nv-warning)] px-1 text-[9px] font-black text-white">
              {priceAlertCount > 9 ? '9+' : priceAlertCount}
            </span>
          ) : null}
        </div>
      ) : null}

      {onToggleReplay ? (
        <ToolbarButton
          title={replayActive ? 'خروج از بازپخش کندل' : 'بازپخش کندل‌ها'}
          active={replayActive}
          disabled={!replayActive && !replayCanStart}
          onClick={onToggleReplay}
        >
          <PlayCircle className="h-4 w-4" />
        </ToolbarButton>
      ) : null}

      {onOpenPriceAlerts || onToggleReplay ? (
        <div className="h-6 w-px bg-[var(--nv-border)]" />
      ) : null}

      <ToolbarButton title="بازگشت" disabled={!canUndo} onClick={onUndo}>
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="انجام مجدد" disabled={!canRedo} onClick={onRedo}>
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        title={selectedDrawing?.locked ? 'بازکردن قفل ترسیم' : 'قفل‌کردن ترسیم'}
        disabled={!selectedDrawing}
        active={Boolean(selectedDrawing?.locked)}
        onClick={onToggleSelectedLock}
      >
        {selectedDrawing?.locked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Unlock className="h-4 w-4" />
        )}
      </ToolbarButton>

      <ToolbarButton
        title={selectedDrawing?.visible === false ? 'نمایش ترسیم' : 'مخفی‌کردن ترسیم'}
        disabled={!selectedDrawing}
        onClick={onToggleSelectedVisibility}
      >
        {selectedDrawing?.visible === false ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </ToolbarButton>

      <ToolbarButton
        title="حذف ترسیم انتخاب‌شده"
        disabled={!selectedDrawing || selectedDrawing.locked}
        danger
        onClick={onDeleteSelected}
      >
        <Trash2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        title={allDrawingsHidden ? 'نمایش همه ترسیم‌ها' : 'مخفی‌کردن همه ترسیم‌ها'}
        disabled={drawingCount === 0}
        onClick={onToggleAllVisibility}
      >
        {allDrawingsHidden ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </ToolbarButton>

      <ToolbarButton
        title="پاک‌کردن تمام ترسیم‌ها"
        disabled={drawingCount === 0}
        danger
        onClick={onClearAll}
      >
        <Trash2 className="h-4 w-4" />
      </ToolbarButton>

      <div className="mr-auto flex shrink-0 items-center gap-2">
        {selectedDrawing ? (
          <span className="nv-chip-active hidden rounded-xl px-3 py-2 text-xs font-black sm:inline">
            یک ترسیم انتخاب شده
          </span>
        ) : (
          <span className="hidden text-[11px] text-[var(--nv-muted)] xl:inline">
            {drawingCount.toLocaleString('fa-IR')} ترسیم ذخیره‌شده
          </span>
        )}

        <ToolbarButton title="ذخیره تصویر نمودار" onClick={onScreenshot}>
          <Camera className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="نمایش تمام‌صفحه" onClick={onFullscreen}>
          <Maximize2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {showIndicators ? (
        <div className="absolute right-3 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel-raised)] p-3 shadow-[var(--nv-shadow-raised)]">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--nv-text)]">
            <Activity className="h-4 w-4 text-[var(--nv-accent)]" />
            اندیکاتورهای نمودار
          </div>
          <div className="space-y-1">
            {(Object.keys(indicatorLabels) as IndicatorKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onToggleIndicator(key)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-[var(--nv-text-soft)] transition hover:bg-[var(--nv-soft)]"
              >
                <span>{indicatorLabels[key]}</span>
                <span
                  className={`h-5 w-9 rounded-full p-0.5 transition ${
                    indicators[key]
                      ? 'bg-[var(--nv-accent)]'
                      : 'bg-[var(--nv-soft-strong)]'
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white transition ${
                      indicators[key] ? 'translate-x-0' : '-translate-x-4'
                    }`}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
