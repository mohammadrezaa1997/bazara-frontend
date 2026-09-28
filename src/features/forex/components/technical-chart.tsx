'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { BarChart3, Loader2 } from 'lucide-react';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';

import { useChartDrawings } from '../hooks/use-chart-drawings';
import { PriceAlertPanel } from '@/features/charts/components/price-alert-panel';
import { ReplayControls } from '@/features/charts/components/replay-controls';
import { useCandleReplay } from '@/features/charts/hooks/use-candle-replay';
import { usePriceAlerts } from '@/features/charts/hooks/use-price-alerts';
import type { ForexAnalysis, ForexCandle, ForexPair, ForexTimeframe } from '../types';
import { buildTechnicalPoints, formatForexPrice } from '../utils/indicators';
import { ChartDrawingOverlay } from './chart-drawing-overlay';
import type { ChartDrawingTool } from './chart-drawings';
import {
  ChartTopToolbar,
  DrawingRail,
  type IndicatorKey,
} from './chart-toolbar';

interface TechnicalChartProps {
  pair?: ForexPair;
  candles: ForexCandle[];
  analysis?: ForexAnalysis;
  timeframe: ForexTimeframe;
  isLoading: boolean;
}

const toolHelp: Record<ChartDrawingTool, string> = {
  navigate: 'برای حرکت نمودار بکشید و برای زوم از چرخ ماوس استفاده کنید.',
  select: 'روی یک ترسیم کلیک کنید تا بتوانید آن را قفل، مخفی یا حذف کنید.',
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

export function TechnicalChart({
  pair,
  candles,
  analysis,
  timeframe,
  isLoading,
}: TechnicalChartProps) {
  const workspaceRef = useRef<HTMLElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const overlaySvgRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { resolvedTheme } = useTheme();

  const [activeTool, setActiveTool] = useState<ChartDrawingTool>('navigate');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showPriceAlerts, setShowPriceAlerts] = useState(false);
  const [viewportRevision, setViewportRevision] = useState(0);
  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [seriesApi, setSeriesApi] = useState<ISeriesApi<'Candlestick'> | null>(
    null,
  );
  const [chartMetrics, setChartMetrics] = useState({ width: 0, mainPaneHeight: 0 });
  const [indicators, setIndicators] = useState<Record<IndicatorKey, boolean>>({
    ema20: true,
    ema50: true,
    ema200: true,
    levels: true,
    volume: true,
    rsi: true,
    macd: true,
  });

  const points = useMemo(() => buildTechnicalPoints(candles), [candles]);
  const identity = `forex:${pair?.symbol ?? 'unknown'}:${timeframe}`;
  const replay = useCandleReplay(points.length, identity);
  const visiblePoints = useMemo(
    () => points.slice(0, replay.visibleCount),
    [points, replay.visibleCount],
  );
  const latestReal = points.at(-1);
  const latestVisible = visiblePoints.at(-1);
  const storageKey = `bazara:forex:drawings:${pair?.symbol ?? 'unknown'}:${timeframe}`;
  const priceAlerts = usePriceAlerts({
    storageKey: `bazara:charts:alerts:forex:${pair?.symbol ?? 'unknown'}`,
    currentPrice: latestReal?.close,
    instrumentName: pair?.display_symbol ?? pair?.symbol ?? 'Forex',
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
  } = useChartDrawings(storageKey);

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

    const candlesSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
      priceLineVisible: true,
      lastValueVisible: true,
      priceFormat: {
        type: 'price',
        precision:
          pair?.base_currency === 'XAU' || pair?.quote_currency === 'JPY' ? 3 : 5,
        minMove:
          pair?.base_currency === 'XAU' || pair?.quote_currency === 'JPY'
            ? 0.001
            : 0.00001,
      },
    });
    candlesSeries.setData(
      visiblePoints.map((point) => ({
        time: asTime(point.time),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      })),
    );

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
    if (indicators.volume) {
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
          lastValueVisible: true,
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
      const macdPane = paneIndex;
      const histogram = chart.addSeries(
        HistogramSeries,
        {
          title: 'MACD Histogram',
          priceLineVisible: false,
          lastValueVisible: false,
          priceFormat: { type: 'price', precision: 6, minMove: 0.000001 },
        },
        macdPane,
      );
      histogram.setData(
        visiblePoints.map((point) => ({
          time: asTime(point.time),
          value: point.macdHistogram,
          color:
            point.macdHistogram >= 0
              ? 'rgba(16,185,129,.7)'
              : 'rgba(244,63,94,.7)',
        })),
      );
      const macdLine = chart.addSeries(
        LineSeries,
        {
          color: '#22d3ee',
          lineWidth: 2,
          title: 'MACD',
          priceLineVisible: false,
          lastValueVisible: false,
        },
        macdPane,
      );
      macdLine.setData(
        visiblePoints.map((point) => ({ time: asTime(point.time), value: point.macd })),
      );
      const signalLine = chart.addSeries(
        LineSeries,
        {
          color: '#f59e0b',
          lineWidth: 2,
          title: 'Signal',
          priceLineVisible: false,
          lastValueVisible: false,
        },
        macdPane,
      );
      signalLine.setData(
        visiblePoints.map((point) => ({ time: asTime(point.time), value: point.macdSignal })),
      );
      chart.panes()[macdPane]?.setHeight(110);
    }

    if (indicators.levels && analysis?.is_trade_ready && !replay.active) {
      const priceLines = [
        { value: analysis.entry_min, color: '#22d3ee', title: 'ورود کمینه' },
        { value: analysis.entry_max, color: '#06b6d4', title: 'ورود بیشینه' },
        { value: analysis.stop_loss, color: '#f43f5e', title: 'حد ضرر' },
        ...analysis.targets.map((target, index) => ({
          value: target,
          color: '#10b981',
          title: `هدف ${index + 1}`,
        })),
      ];
      for (const line of priceLines) {
        const price = Number(line.value);
        if (!Number.isFinite(price)) continue;
        candlesSeries.createPriceLine({
          price,
          color: line.color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: line.title,
        });
      }

      const latest = visiblePoints.at(-1);
      if (latest && (analysis.decision === 'buy' || analysis.decision === 'sell')) {
        createSeriesMarkers(candlesSeries, [
          {
            time: asTime(latest.time) as Time,
            position: analysis.decision === 'buy' ? 'belowBar' : 'aboveBar',
            color: analysis.decision === 'buy' ? '#10b981' : '#f43f5e',
            shape: analysis.decision === 'buy' ? 'arrowUp' : 'arrowDown',
            text: analysis.decision_display,
          },
        ]);
      }
    }

    chartRef.current = chart;
    seriesRef.current = candlesSeries;
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
      setSeriesApi(candlesSeries);
      updateViewport();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(updateViewport);
      chartRef.current = null;
      seriesRef.current = null;
      chart.remove();
    };
  }, [analysis, indicators, pair, replay.active, resolvedTheme, timeframe, visiblePoints]);

  const handleToggleIndicator = (key: IndicatorKey) => {
    setIndicators((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleFullscreen = async () => {
    const element = workspaceRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await element.requestFullscreen();
    }
  };

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
    link.download = `BAZARA-${pair?.symbol ?? 'FOREX'}-${timeframe}.png`;
    link.href = output.toDataURL('image/png');
    link.click();
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
                {pair?.display_symbol ?? '—'} · {timeframe.toUpperCase()} · آخرین قیمت{' '}
                <span dir="ltr" className="font-bold text-[var(--nv-text-soft)]">
                  {formatForexPrice(latestVisible?.close)}
                </span>
              </p>
            </div>
          </div>
          <p className="max-w-xl text-xs leading-6 text-[var(--nv-muted)]">
            {replay.active
              ? 'حالت بازپخش فعال است؛ سیگنال و سطوح تحلیل فعلی برای جلوگیری از دیدن آینده پنهان شده‌اند.'
              : toolHelp[activeTool]}
          </p>
        </div>
      </div>

      <ChartTopToolbar
        indicators={indicators}
        onToggleIndicator={handleToggleIndicator}
        selectedDrawing={selectedDrawing}
        drawingCount={drawings.length}
        allDrawingsHidden={
          drawings.length > 0 && drawings.every((drawing) => !drawing.visible)
        }
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
              دریافت کندل‌ها و محاسبه اندیکاتورها...
            </div>
          ) : null}

          {!isLoading && points.length < 2 ? (
            <div className="flex min-h-[580px] items-center justify-center text-sm text-[var(--nv-muted)]">
              داده کافی برای رسم نمودار وجود ندارد.
            </div>
          ) : (
            <div className="relative" dir="ltr">
              <div ref={chartContainerRef} className="w-full" />
              <ChartDrawingOverlay
                key={`${storageKey}:${activeTool}`}
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
          instrumentName={pair?.display_symbol ?? pair?.symbol ?? 'Forex'}
          currentPrice={latestReal?.close}
          alerts={priceAlerts.alerts}
          onAdd={priceAlerts.addAlert}
          onRemove={priceAlerts.removeAlert}
          onRearm={priceAlerts.rearmAlert}
          onClose={() => setShowPriceAlerts(false)}
          formatPrice={(value) => formatForexPrice(value)}
        />
      ) : null}
    </article>
  );
}
