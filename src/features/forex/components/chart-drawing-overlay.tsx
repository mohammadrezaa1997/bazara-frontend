'use client';

import { useState, type PointerEvent, type ReactNode, type RefObject } from 'react';
import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

import { formatForexPrice, type TechnicalPoint } from '../utils/indicators';
import {
  createDrawingId,
  drawingColors,
  fibonacciLevels,
  type BrushDrawing,
  type ChartDrawing,
  type ChartDrawingPoint,
  type ChartDrawingTool,
  type HorizontalDrawing,
  type TextDrawing,
  type TwoPointDrawing,
  type VerticalDrawing,
} from './chart-drawings';

interface ChartDrawingOverlayProps {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  svgRef: RefObject<SVGSVGElement | null>;
  width: number;
  mainPaneHeight: number;
  drawings: ChartDrawing[];
  activeTool: ChartDrawingTool;
  selectedId: string | null;
  latestPrice?: number;
  snapEnabled: boolean;
  snapPoints: TechnicalPoint[];
  viewportRevision: number;
  onAddDrawing: (drawing: ChartDrawing) => void;
  onUpdateDrawing: (drawing: ChartDrawing) => void;
  onSelectDrawing: (id: string | null) => void;
  onToolChange: (tool: ChartDrawingTool) => void;
}

interface ScreenPoint {
  x: number;
  y: number;
}

function toolUsesTwoPoints(tool: ChartDrawingTool) {
  return (
    tool === 'trendline' ||
    tool === 'fibonacci' ||
    tool === 'rectangle' ||
    tool === 'measure'
  );
}

function formatDuration(seconds: number) {
  const absolute = Math.abs(seconds);
  if (absolute >= 86_400) return `${Math.round(absolute / 86_400)} روز`;
  if (absolute >= 3_600) return `${Math.round(absolute / 3_600)} ساعت`;
  return `${Math.max(1, Math.round(absolute / 60))} دقیقه`;
}

export function ChartDrawingOverlay({
  chart,
  series,
  svgRef,
  width,
  mainPaneHeight,
  drawings,
  activeTool,
  selectedId,
  latestPrice,
  snapEnabled,
  snapPoints,
  viewportRevision,
  onAddDrawing,
  onUpdateDrawing,
  onSelectDrawing,
  onToolChange,
}: ChartDrawingOverlayProps) {
  const [anchor, setAnchor] = useState<ChartDrawingPoint | null>(null);
  const [hoverPoint, setHoverPoint] = useState<ChartDrawingPoint | null>(null);
  const [brushPoints, setBrushPoints] = useState<ChartDrawingPoint[]>([]);
  const [endpointDrag, setEndpointDrag] = useState<{
    drawingId: string;
    endpoint: 'start' | 'end';
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<TwoPointDrawing | null>(null);

  const toScreenPoint = (point: ChartDrawingPoint): ScreenPoint | null => {
    if (!chart || !series) return null;
    const x = chart.timeScale().timeToCoordinate(point.time as UTCTimestamp);
    const y = series.priceToCoordinate(point.price);
    if (x === null || y === null) return null;
    return { x, y };
  };

  const fromPointerEvent = (
    event: PointerEvent<SVGSVGElement>,
  ): ChartDrawingPoint | null => {
    if (!chart || !series) return null;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (y < 0 || y > mainPaneHeight) return null;
    const time = chart.timeScale().coordinateToTime(x);
    const price = series.coordinateToPrice(y);
    if (typeof time !== 'number' || price === null || !Number.isFinite(price)) {
      return null;
    }
    if (snapEnabled && snapPoints.length > 0) {
      const nearest = snapPoints.reduce((best, item) =>
        Math.abs(item.time - time) < Math.abs(best.time - time) ? item : best,
      );
      const candidates = [nearest.open, nearest.high, nearest.low, nearest.close]
        .flatMap((candidatePrice) => {
          const candidateY = series.priceToCoordinate(candidatePrice);
          return candidateY === null
            ? []
            : [{ price: candidatePrice, y: Number(candidateY) }];
        })
        .sort((first, second) => Math.abs(first.y - y) - Math.abs(second.y - y));
      const closest = candidates[0];
      if (closest && Math.abs(closest.y - y) <= 14) {
        return { time: nearest.time, price: closest.price };
      }
    }

    return { time, price };
  };

  const completeDrawing = (drawing: ChartDrawing) => {
    onAddDrawing(drawing);
    onSelectDrawing(drawing.id);
    setAnchor(null);
    setHoverPoint(null);
    setBrushPoints([]);
    onToolChange('select');
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) return;

    if (activeTool === 'select') {
      onSelectDrawing(null);
      return;
    }
    if (activeTool === 'navigate') return;

    const point = fromPointerEvent(event);
    if (!point) return;

    if (activeTool === 'brush') {
      event.currentTarget.setPointerCapture(event.pointerId);
      setBrushPoints([point]);
      return;
    }

    if (activeTool === 'horizontal') {
      const drawing: HorizontalDrawing = {
        id: createDrawingId(),
        type: 'horizontal',
        price: point.price,
        role: point.price <= (latestPrice ?? point.price) ? 'support' : 'resistance',
        color:
          point.price <= (latestPrice ?? point.price) ? '#10b981' : '#f43f5e',
        visible: true,
        locked: false,
        createdAt: Date.now(),
      };
      completeDrawing(drawing);
      return;
    }

    if (activeTool === 'vertical') {
      const drawing: VerticalDrawing = {
        id: createDrawingId(),
        type: 'vertical',
        time: point.time,
        color: drawingColors.vertical,
        visible: true,
        locked: false,
        createdAt: Date.now(),
      };
      completeDrawing(drawing);
      return;
    }

    if (activeTool === 'text') {
      const text = window.prompt('متن یادداشت روی نمودار را وارد کنید:')?.trim();
      if (!text) return;
      const drawing: TextDrawing = {
        id: createDrawingId(),
        type: 'text',
        point,
        text,
        color: drawingColors.text,
        visible: true,
        locked: false,
        createdAt: Date.now(),
      };
      completeDrawing(drawing);
      return;
    }

    if (toolUsesTwoPoints(activeTool)) {
      if (!anchor) {
        setAnchor(point);
        setHoverPoint(point);
        return;
      }

      const drawing: TwoPointDrawing = {
        id: createDrawingId(),
        type: activeTool,
        start: anchor,
        end: point,
        color: drawingColors[activeTool],
        visible: true,
        locked: false,
        createdAt: Date.now(),
      };
      completeDrawing(drawing);
    }
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const point = fromPointerEvent(event);
    if (!point) return;

    if (endpointDrag && dragPreview) {
      setDragPreview((current) =>
        current
          ? {
              ...current,
              [endpointDrag.endpoint]: point,
            }
          : current,
      );
      return;
    }

    if (brushPoints.length > 0) {
      setBrushPoints((current) => {
        if (current.length >= 300) return current;
        const last = current.at(-1);
        if (last && last.time === point.time && Math.abs(last.price - point.price) < 1e-9) {
          return current;
        }
        return [...current, point];
      });
      return;
    }

    if (anchor) setHoverPoint(point);
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (dragPreview) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const finalPoint = fromPointerEvent(event);
      const finalDrawing =
        finalPoint && endpointDrag
          ? { ...dragPreview, [endpointDrag.endpoint]: finalPoint }
          : dragPreview;
      onUpdateDrawing(finalDrawing);
      setEndpointDrag(null);
      setDragPreview(null);
      return;
    }

    if (brushPoints.length < 2) {
      setBrushPoints([]);
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const drawing: BrushDrawing = {
      id: createDrawingId(),
      type: 'brush',
      points: brushPoints,
      color: drawingColors.brush,
      visible: true,
      locked: false,
      createdAt: Date.now(),
    };
    completeDrawing(drawing);
  };

  const selectShape = (event: PointerEvent<SVGGElement>, drawing: ChartDrawing) => {
    if (activeTool !== 'select') return;
    event.stopPropagation();
    event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
    onSelectDrawing(drawing.id);
  };

  const startEndpointDrag = (
    event: PointerEvent<SVGCircleElement>,
    drawing: TwoPointDrawing,
    endpoint: 'start' | 'end',
  ) => {
    if (activeTool !== 'select' || drawing.locked) return;
    event.stopPropagation();
    onSelectDrawing(drawing.id);
    setEndpointDrag({ drawingId: drawing.id, endpoint });
    setDragPreview(drawing);
  };

  const renderTwoPointShape = (
    drawing: TwoPointDrawing,
    start: ScreenPoint,
    end: ScreenPoint,
    selected: boolean,
  ): ReactNode => {
    const strokeWidth = selected ? 3 : 2;

    if (drawing.type === 'rectangle') {
      return (
        <>
          <rect
            x={Math.min(start.x, end.x)}
            y={Math.min(start.y, end.y)}
            width={Math.abs(end.x - start.x)}
            height={Math.abs(end.y - start.y)}
            fill="rgba(6,182,212,.12)"
            stroke={drawing.color}
            strokeWidth={strokeWidth}
            strokeDasharray={selected ? '6 4' : undefined}
            rx={4}
          />
        </>
      );
    }

    if (drawing.type === 'fibonacci') {
      return (
        <>
          {fibonacciLevels.map((level) => {
            const price =
              drawing.end.price -
              (drawing.end.price - drawing.start.price) * level.ratio;
            const levelY = series?.priceToCoordinate(price);
            if (levelY === null || levelY === undefined) return null;
            const startX = Math.min(start.x, end.x);
            const endX = Math.max(start.x, end.x);
            return (
              <g key={level.ratio}>
                <line
                  x1={startX}
                  y1={levelY}
                  x2={endX}
                  y2={levelY}
                  stroke={level.color}
                  strokeWidth={level.ratio === 0.5 || level.ratio === 0.618 ? 2 : 1}
                  strokeDasharray="6 4"
                />
                <text
                  x={endX + 5}
                  y={levelY - 3}
                  fill={level.color}
                  fontSize="10"
                  fontWeight="700"
                >
                  {level.label} · {formatForexPrice(price)}
                </text>
              </g>
            );
          })}
        </>
      );
    }

    if (drawing.type === 'measure') {
      const delta = drawing.end.price - drawing.start.price;
      const percent = drawing.start.price
        ? (delta / drawing.start.price) * 100
        : 0;
      return (
        <>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={percent >= 0 ? '#10b981' : '#f43f5e'}
            strokeWidth={strokeWidth}
            strokeDasharray="5 4"
          />
          <text
            x={(start.x + end.x) / 2}
            y={(start.y + end.y) / 2 - 10}
            textAnchor="middle"
            fill={percent >= 0 ? '#10b981' : '#f43f5e'}
            fontSize="11"
            fontWeight="800"
            paintOrder="stroke"
            stroke="rgba(7,10,15,.85)"
            strokeWidth="4"
          >
            {percent >= 0 ? '+' : ''}{percent.toFixed(2)}% · {formatDuration(drawing.end.time - drawing.start.time)}
          </text>
        </>
      );
    }

    return (
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={drawing.color}
        strokeWidth={strokeWidth}
        strokeDasharray={selected ? '6 4' : undefined}
      />
    );
  };

  const renderDrawing = (drawing: ChartDrawing, draft = false): ReactNode => {
    if (!drawing.visible && !draft) return null;
    const selected = !draft && drawing.id === selectedId;
    const common = {
      opacity: draft ? 0.65 : 1,
      style: {
        cursor: activeTool === 'select' ? 'pointer' : 'default',
        pointerEvents:
          activeTool === 'select' ? ('all' as const) : ('none' as const),
      },
      onPointerDown: (event: PointerEvent<SVGGElement>) => selectShape(event, drawing),
    };

    if (drawing.type === 'horizontal') {
      const y = series?.priceToCoordinate(drawing.price);
      if (y === null || y === undefined) return null;
      return (
        <g key={drawing.id} {...common}>
          <line x1={0} y1={y} x2={width} y2={y} stroke="transparent" strokeWidth="12" />
          <line
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke={drawing.color}
            strokeWidth={selected ? 3 : 2}
            strokeDasharray="7 5"
          />
          <text x={8} y={y - 5} fill={drawing.color} fontSize="10" fontWeight="700">
            {drawing.role === 'support' ? 'حمایت' : 'مقاومت'} · {formatForexPrice(drawing.price)}
          </text>
        </g>
      );
    }

    if (drawing.type === 'vertical') {
      const x = chart?.timeScale().timeToCoordinate(drawing.time as UTCTimestamp);
      if (x === null || x === undefined) return null;
      return (
        <g key={drawing.id} {...common}>
          <line x1={x} y1={0} x2={x} y2={mainPaneHeight} stroke="transparent" strokeWidth="12" />
          <line
            x1={x}
            y1={0}
            x2={x}
            y2={mainPaneHeight}
            stroke={drawing.color}
            strokeWidth={selected ? 3 : 1.5}
            strokeDasharray="6 5"
          />
        </g>
      );
    }

    if (drawing.type === 'text') {
      const point = toScreenPoint(drawing.point);
      if (!point) return null;
      return (
        <g key={drawing.id} {...common}>
          <rect
            x={point.x - 5}
            y={point.y - 21}
            width={Math.max(75, drawing.text.length * 8)}
            height={27}
            rx={7}
            fill="rgba(15,23,42,.82)"
            stroke={selected ? '#22d3ee' : 'rgba(148,163,184,.35)'}
          />
          <text
            x={point.x + 4}
            y={point.y - 4}
            fill={drawing.color}
            fontSize="11"
            fontWeight="700"
            direction="rtl"
          >
            {drawing.text}
          </text>
        </g>
      );
    }

    if (drawing.type === 'brush') {
      const screenPoints = drawing.points
        .map(toScreenPoint)
        .filter((point): point is ScreenPoint => point !== null);
      if (screenPoints.length < 2) return null;
      const value = screenPoints.map((point) => `${point.x},${point.y}`).join(' ');
      return (
        <g key={drawing.id} {...common}>
          <polyline points={value} fill="none" stroke="transparent" strokeWidth="12" />
          <polyline
            points={value}
            fill="none"
            stroke={drawing.color}
            strokeWidth={selected ? 4 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    const start = toScreenPoint(drawing.start);
    const end = toScreenPoint(drawing.end);
    if (!start || !end) return null;
    return (
      <g key={drawing.id} {...common}>
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke="transparent"
          strokeWidth="14"
        />
        {renderTwoPointShape(drawing, start, end, selected)}
        {selected ? (
          <>
            <circle
              cx={start.x}
              cy={start.y}
              r="6"
              fill="#22d3ee"
              stroke="white"
              strokeWidth="1.5"
              className={drawing.locked ? 'cursor-not-allowed' : 'cursor-grab'}
              onPointerDown={(event) => startEndpointDrag(event, drawing, 'start')}
            />
            <circle
              cx={end.x}
              cy={end.y}
              r="6"
              fill="#22d3ee"
              stroke="white"
              strokeWidth="1.5"
              className={drawing.locked ? 'cursor-not-allowed' : 'cursor-grab'}
              onPointerDown={(event) => startEndpointDrag(event, drawing, 'end')}
            />
          </>
        ) : null}
      </g>
    );
  };

  let draftDrawing: ChartDrawing | null = null;
  if (anchor && hoverPoint && toolUsesTwoPoints(activeTool)) {
    draftDrawing = {
      id: 'draft',
      type: activeTool,
      start: anchor,
      end: hoverPoint,
      color: drawingColors[activeTool],
      visible: true,
      locked: false,
      createdAt: 0,
    };
  } else if (brushPoints.length > 1) {
    draftDrawing = {
      id: 'draft-brush',
      type: 'brush',
      points: brushPoints,
      color: drawingColors.brush,
      visible: true,
      locked: false,
      createdAt: 0,
    };
  }

  const overlayEnabled = activeTool !== 'navigate';

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 z-20 h-full w-full ${
        overlayEnabled ? 'pointer-events-auto' : 'pointer-events-none'
      } ${activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        setBrushPoints([]);
        setEndpointDrag(null);
        setDragPreview(null);
      }}
      aria-label="لایه ترسیم‌های نمودار"
      data-viewport-revision={viewportRevision}
    >
      {drawings.map((drawing) =>
        renderDrawing(
          dragPreview?.id === drawing.id ? dragPreview : drawing,
        ),
      )}
      {draftDrawing ? renderDrawing(draftDrawing, true) : null}
    </svg>
  );
}
