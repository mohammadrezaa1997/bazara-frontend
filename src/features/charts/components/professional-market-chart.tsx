'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { BarChart3, Loader2 } from 'lucide-react';
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type UTCTimestamp,
} from 'lightweight-charts';

import { useCandleReplay } from '../hooks/use-candle-replay';
import { useChartDrawings } from '../hooks/use-chart-drawings';
import { usePriceAlerts } from '../hooks/use-price-alerts';
import {
  buildTechnicalPoints,
  type ChartCandle,
} from '../utils/chart-indicators';
import { ChartDrawingOverlay } from './chart-drawing-overlay';
import type { ChartDrawingTool } from './chart-drawings';
import {
  ChartTopToolbar,
  DrawingRail,
  type IndicatorKey,
} from './chart-toolbar';
import { PriceAlertPanel } from './price-alert-panel';
import { ReplayControls } from './replay-controls';

export interface OfficialPriceLevel {
  price: number;
  title: string;
  color: string;
}

interface ProfessionalMarketChartProps {
  market: 'crypto' | 'iran';
  symbol: string;
  instrumentName: string;
  timeframe: string;
  candles: ChartCandle[];
  isLoading: boolean;
  chartType?: 'candlestick' | 'line';
  priceDigits?: number;
  priceSuffix?: string;
  dataNote?: string;
  officialLevels?: OfficialPriceLevel[];
}

const EMPTY_OFFICIAL_LEVELS: OfficialPriceLevel[] = [];

const toolHelp: Record<ChartDrawingTool, string> = {
  navigate: 'برای حرکت نمودار بکشید و برای زوم از چرخ ماوس استفاده کنید.',
  select: 'روی یک ترسیم کلیک کنید تا بتوانید آن را مدیریت کنید.',
  horizontal: 'روی قیمت موردنظر یک‌بار کلیک کنید.',
  vertical: 'روی زمان موردنظر یک‌بار کلیک کنید.',
  trendline: 'ابتدا نقطه شروع و سپس نقطه پایان خط روند را انتخاب کنید.',
  fibonacci: 'ابتدای موج و سپس انتهای موج را برای رسم فیبوناچی انتخاب کنید.',
  rectangle: 'دو گوشه ناحیه حمایت یا مقاومت را انتخاب کنید.',
  brush: 'دکمه ماوس را نگه دارید و مسیر دلخواه را روی نمودار بکشید.',
  text: 'روی نمودار کلیک کنید و متن یادداشت را بنویسید.',
  measure: 'دو نقطه را برای محاسبه درصد تغییر و فاصله زمانی انتخاب کنید.',
};

function asTime(value: number): UTCTimestamp {
  return value as UTCTimestamp;
}

export function ProfessionalMarketChart({
  market,
  symbol,
  instrumentName,
  timeframe,
  candles,
  isLoading,
  chartType = 'candlestick',
  priceDigits = 2,
  priceSuffix = '',
  dataNote,
  officialLevels = EMPTY_OFFICIAL_LEVELS,
}: ProfessionalMarketChartProps) {
  const workspaceRef = useRef<HTMLElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const overlaySvgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { resolvedTheme } = useTheme();
  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [seriesApi, setSeriesApi] = useState<ISeriesApi<SeriesType> | null>(null);
  const [activeTool, setActiveTool] = useState<ChartDrawingTool>('navigate');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [viewportRevision, setViewportRevision] = useState(0);
  const [chartMetrics, setChartMetrics] = useState({ width: 0, mainPaneHeight: 0 });
  const [showPriceAlerts, setShowPriceAlerts] = useState(false);
  const [indicators, setIndicators] = useState<Record<IndicatorKey, boolean>>({
    ema20: true,
    ema50: true,
    ema200: false,
    levels: true,
    volume: true,
    rsi: true,
    macd: true,
  });

  const points = useMemo(() => buildTechnicalPoints(candles), [candles]);
  const identity = `${market}:${symbol}:${timeframe}`;
  const replay = useCandleReplay(points.length, identity);
  const visiblePoints = useMemo(
    () => points.slice(0, replay.visibleCount),
    [points, replay.visibleCount],
  );
  const latestReal = points.at(-1);
  const latestVisible = visiblePoints.at(-1);
  const drawingStorageKey = `bazara:charts:drawings:${identity}`;
  const alertStorageKey = `bazara:charts:alerts:${market}:${symbol}`;

  const formatPrice = useCallback(
    (value?: number) => {
      if (!Number.isFinite(value)) return '—';
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: priceDigits,
        maximumFractionDigits: priceDigits,
      }).format(value as number);
      return priceSuffix ? `${formatted} ${priceSuffix}` : formatted;
    },
    [priceDigits, priceSuffix],
  );

  const priceAlerts = usePriceAlerts({
    storageKey: alertStorageKey,
    currentPrice: latestReal?.close,
    instrumentName,
  });
  const {
    drawings,
    selectedId,
    selectedDrawing,
    setSelectedId,
    addDrawing,
    updateDrawing,
    undo,
    redo,
    clearAll,
    deleteSelected,
    toggleSelectedLock,
    toggleSelectedVisibility,
    toggleAllVisibility,
    canUndo,
    canRedo,
  } = useChartDrawings(drawingStorageKey);

  const handleToolChange = useCallback(
    (tool: ChartDrawingTool) => {
      setActiveTool(tool);
      if (tool !== 'select') setSelectedId(null);
    },
    [setSelectedId],
  );

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || visiblePoints.length < 2) return;
    const dark = resolvedTheme === 'dark';
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientWidth < 640 ? 600 : 720,
      layout: {
        attributionLogo: true,
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: dark ? '#94a3b8' : '#475569',
        panes: {
          separatorColor: dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.12)',
          separatorHoverColor: '#22d3ee',
          enableResize: true,
        },
      },
      grid: {
        vertLines: { color: dark ? 'rgba(148,163,184,.07)' : 'rgba(15,23,42,.06)' },
        horzLines: { color: dark ? 'rgba(148,163,184,.07)' : 'rgba(15,23,42,.06)' },
      },
      rightPriceScale: {
        borderColor: dark ? 'rgba(255,255,255,.1)' : 'rgba(15,23,42,.12)',
        scaleMargins: { top: 0.08, bottom: 0.12 },
      },
      timeScale: {
        borderColor: dark ? 'rgba(255,255,255,.1)' : 'rgba(15,23,42,.12)',
        timeVisible: timeframe !== '1day',
        secondsVisible: false,
        rightOffset: 5,
      },
      localization: { locale: 'fa-IR' },
    });

    let mainSeries: ISeriesApi<SeriesType>;
    if (chartType === 'line') {
      const series = chart.addSeries(AreaSeries, {
        lineColor: '#22d3ee',
        topColor: 'rgba(34,211,238,.28)',
        bottomColor: 'rgba(34,211,238,0)',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: priceDigits,
          minMove: 10 ** -priceDigits,
        },
      });
      series.setData(
        visiblePoints.map((point) => ({ time: asTime(point.time), value: point.close })),
      );
      mainSeries = series;
    } else {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
        priceFormat: {
          type: 'price',
          precision: priceDigits,
          minMove: 10 ** -priceDigits,
        },
      });
      series.setData(
        visiblePoints.map((point) => ({
          time: asTime(point.time),
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
        })),
      );
      mainSeries = series;
    }

    const addMovingAverage = (
      key: 'ema20' | 'ema50' | 'ema200',
      color: string,
      title: string,
    ) => {
      if (!indicators[key]) return;
      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        title,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(
        visiblePoints.map((point) => ({ time: asTime(point.time), value: point[key] })),
      );
    };
    addMovingAverage('ema20', '#22d3ee', 'EMA 20');
    addMovingAverage('ema50', '#f59e0b', 'EMA 50');
    addMovingAverage('ema200', '#a78bfa', 'EMA 200');

    let paneIndex = 1;
    if (indicators.volume && visiblePoints.some((point) => point.volume > 0)) {
      const volumeSeries = chart.addSeries(
        HistogramSeries,
        {
          title: 'Volume',
          priceLineVisible: false,
          lastValueVisible: false,
          priceFormat: { type: 'volume' },
        },
        paneIndex,
      );
      volumeSeries.setData(
        visiblePoints.map((point) => ({
          time: asTime(point.time),
          value: point.volume,
          color: point.close >= point.open ? 'rgba(16,185,129,.55)' : 'rgba(244,63,94,.55)',
        })),
      );
      chart.panes()[paneIndex]?.setHeight(90);
      paneIndex += 1;
    }

    if (indicators.rsi) {
      const rsiSeries = chart.addSeries(
        LineSeries,
        {
          color: '#38bdf8',
          lineWidth: 2,
          title: 'RSI 14',
          priceLineVisible: false,
          priceFormat: { type: 'price', precision: 1, minMove: 0.1 },
        },
        paneIndex,
      );
      rsiSeries.setData(
        visiblePoints.map((point) => ({ time: asTime(point.time), value: point.rsi14 })),
      );
      rsiSeries.createPriceLine({
        price: 70,
        color: 'rgba(244,63,94,.55)',
        lineStyle: LineStyle.Dashed,
        lineWidth: 1,
        axisLabelVisible: true,
        title: 'اشباع خرید',
      });
      rsiSeries.createPriceLine({
        price: 30,
        color: 'rgba(16,185,129,.55)',
        lineStyle: LineStyle.Dashed,
        lineWidth: 1,
        axisLabelVisible: true,
        title: 'اشباع فروش',
      });
      chart.panes()[paneIndex]?.setHeight(110);
      paneIndex += 1;
    }

    if (indicators.macd) {
      const histogram = chart.addSeries(
        HistogramSeries,
        { title: 'MACD', priceLineVisible: false, lastValueVisible: false },
        paneIndex,
      );
      histogram.setData(
        visiblePoints.map((point) => ({
          time: asTime(point.time),
          value: point.macdHistogram,
          color: point.macdHistogram >= 0 ? 'rgba(16,185,129,.7)' : 'rgba(244,63,94,.7)',
        })),
      );
      const macdLine = chart.addSeries(
        LineSeries,
        { color: '#22d3ee', lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
        paneIndex,
      );
      macdLine.setData(
        visiblePoints.map((point) => ({ time: asTime(point.time), value: point.macd })),
      );
      const signalLine = chart.addSeries(
        LineSeries,
        { color: '#f59e0b', lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
        paneIndex,
      );
      signalLine.setData(
        visiblePoints.map((point) => ({ time: asTime(point.time), value: point.macdSignal })),
      );
      chart.panes()[paneIndex]?.setHeight(110);
    }

    if (indicators.levels && !replay.active) {
      officialLevels.forEach((level) => {
        if (!Number.isFinite(level.price)) return;
        mainSeries.createPriceLine({
          price: level.price,
          color: level.color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: level.title,
        });
      });
    }

    chartRef.current = chart;
    chart.timeScale().fitContent();
    const updateViewport = () => {
      setViewportRevision((current) => current + 1);
      setChartMetrics({
        width: container.clientWidth,
        mainPaneHeight: chart.panes()[0]?.getHeight() ?? container.clientHeight,
      });
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(updateViewport);
    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientWidth < 640 ? 600 : 720,
      });
      updateViewport();
    });
    resizeObserver.observe(container);
    const frame = window.requestAnimationFrame(() => {
      setChartApi(chart);
      setSeriesApi(mainSeries);
      updateViewport();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(updateViewport);
      chartRef.current = null;
      chart.remove();
    };
  }, [
    chartType,
    indicators,
    officialLevels,
    priceDigits,
    replay.active,
    resolvedTheme,
    timeframe,
    visiblePoints,
  ]);

  const handleScreenshot = async () => {
    const chart = chartRef.current;
    if (!chart) return;
    const chartCanvas = chart.takeScreenshot(true, true);
    const output = document.createElement('canvas');
    output.width = chartCanvas.width;
    output.height = chartCanvas.height;
    const context = output.getContext('2d');
    if (!context) return;
    context.drawImage(chartCanvas, 0, 0);
    const svg = overlaySvgRef.current;
    if (svg) {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', String(chartCanvas.width));
      clone.setAttribute('height', String(chartCanvas.height));
      clone.setAttribute('viewBox', `0 0 ${svg.clientWidth} ${svg.clientHeight}`);
      const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('Drawing overlay could not be rendered.'));
          image.src = url;
        });
        context.drawImage(image, 0, 0, chartCanvas.width, chartCanvas.height);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    const link = document.createElement('a');
    link.download = `BAZARA-${symbol}-${timeframe}.png`;
    link.href = output.toDataURL('image/png');
    link.click();
  };

  const handleFullscreen = async () => {
    const element = workspaceRef.current;
    if (!element) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await element.requestFullscreen();
  };

  const handleClearAll = () => {
    if (drawings.length === 0) return;
    if (window.confirm('همه ترسیم‌های این نماد و تایم‌فریم پاک شوند؟')) {
      clearAll();
      setActiveTool('navigate');
    }
  };

  return (
    <article
      ref={workspaceRef}
      className="overflow-hidden rounded-[26px] border border-[var(--nv-border)] bg-[var(--nv-panel)] shadow-[var(--nv-shadow)] fullscreen:rounded-none fullscreen:border-0"
    >
      <div className="border-b border-[var(--nv-border)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-500">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-[var(--nv-text)]">فضای تحلیل حرفه‌ای</h2>
              <p className="mt-1 text-xs text-[var(--nv-muted)]">
                {instrumentName} · {timeframe.toUpperCase()} · آخرین قیمت{' '}
                <span dir="ltr" className="font-bold text-[var(--nv-text-soft)]">
                  {formatPrice(latestVisible?.close)}
                </span>
              </p>
            </div>
          </div>
          <p className="max-w-xl text-xs leading-6 text-[var(--nv-muted)]">
            {replay.active
              ? 'حالت بازپخش فعال است؛ سطوح تحلیل فعلی برای جلوگیری از دیدن آینده پنهان شده‌اند.'
              : toolHelp[activeTool]}
          </p>
        </div>
        {dataNote ? (
          <p className="mt-3 rounded-xl bg-[var(--nv-soft)] px-3 py-2 text-[10px] leading-5 text-[var(--nv-muted)]">
            {dataNote}
          </p>
        ) : null}
      </div>

      <ChartTopToolbar
        indicators={indicators}
        onToggleIndicator={(key) =>
          setIndicators((current) => ({ ...current, [key]: !current[key] }))
        }
        selectedDrawing={selectedDrawing}
        drawingCount={drawings.length}
        allDrawingsHidden={drawings.length > 0 && drawings.every((drawing) => !drawing.visible)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onDeleteSelected={deleteSelected}
        onToggleSelectedLock={toggleSelectedLock}
        onToggleSelectedVisibility={toggleSelectedVisibility}
        onToggleAllVisibility={toggleAllVisibility}
        onClearAll={handleClearAll}
        onFullscreen={handleFullscreen}
        onScreenshot={handleScreenshot}
        priceAlertCount={priceAlerts.activeCount}
        onOpenPriceAlerts={() => setShowPriceAlerts(true)}
        replayActive={replay.active}
        replayCanStart={replay.canStart}
        onToggleReplay={replay.active ? replay.exit : replay.start}
      />

      {replay.active ? (
        <ReplayControls
          total={points.length}
          visibleCount={replay.visibleCount}
          playing={replay.playing}
          speed={replay.speed}
          onPlayingChange={replay.setPlaying}
          onSpeedChange={replay.setSpeed}
          onStepBack={replay.stepBack}
          onStepForward={replay.stepForward}
          onSeek={replay.seek}
          onExit={replay.exit}
        />
      ) : null}

      <div className="relative lg:pl-14">
        <DrawingRail
          activeTool={activeTool}
          onToolChange={handleToolChange}
          snapEnabled={snapEnabled}
          onToggleSnap={() => setSnapEnabled((current) => !current)}
        />
        <div className="relative min-h-[600px] p-2 sm:p-4">
          {isLoading ? (
            <div className="absolute inset-0 z-40 flex items-center justify-center gap-3 bg-[var(--nv-overlay)] text-sm text-cyan-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              دریافت داده و محاسبه اندیکاتورها...
            </div>
          ) : null}
          {!isLoading && points.length < 2 ? (
            <div className="flex min-h-[580px] items-center justify-center text-sm text-[var(--nv-muted)]">
              داده واقعی کافی برای رسم نمودار وجود ندارد.
            </div>
          ) : (
            <div className="relative" dir="ltr">
              <div ref={chartContainerRef} className="w-full" />
              <ChartDrawingOverlay
                key={`${drawingStorageKey}:${activeTool}`}
                chart={chartApi}
                series={seriesApi}
                svgRef={overlaySvgRef}
                width={chartMetrics.width}
                mainPaneHeight={chartMetrics.mainPaneHeight}
                drawings={drawings}
                activeTool={activeTool}
                selectedId={selectedId}
                latestPrice={latestVisible?.close}
                snapEnabled={snapEnabled}
                snapPoints={visiblePoints}
                viewportRevision={viewportRevision}
                onAddDrawing={addDrawing}
                onUpdateDrawing={updateDrawing}
                onSelectDrawing={setSelectedId}
                onToolChange={handleToolChange}
              />
            </div>
          )}
        </div>
      </div>

      {showPriceAlerts ? (
        <PriceAlertPanel
          instrumentName={instrumentName}
          currentPrice={latestReal?.close}
          alerts={priceAlerts.alerts}
          onAdd={priceAlerts.addAlert}
          onRemove={priceAlerts.removeAlert}
          onRearm={priceAlerts.rearmAlert}
          onClose={() => setShowPriceAlerts(false)}
          formatPrice={formatPrice}
        />
      ) : null}
    </article>
  );
}
