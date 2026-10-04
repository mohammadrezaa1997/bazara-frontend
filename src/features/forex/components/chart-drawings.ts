export type ChartDrawingTool =
  | 'navigate'
  | 'select'
  | 'horizontal'
  | 'vertical'
  | 'trendline'
  | 'fibonacci'
  | 'rectangle'
  | 'brush'
  | 'text'
  | 'measure';

export interface ChartDrawingPoint {
  time: number;
  price: number;
}

interface DrawingBase {
  id: string;
  color: string;
  visible: boolean;
  locked: boolean;
  createdAt: number;
}

export interface HorizontalDrawing extends DrawingBase {
  type: 'horizontal';
  price: number;
  role: 'support' | 'resistance';
}

export interface VerticalDrawing extends DrawingBase {
  type: 'vertical';
  time: number;
}

export interface TwoPointDrawing extends DrawingBase {
  type: 'trendline' | 'fibonacci' | 'rectangle' | 'measure';
  start: ChartDrawingPoint;
  end: ChartDrawingPoint;
}

export interface BrushDrawing extends DrawingBase {
  type: 'brush';
  points: ChartDrawingPoint[];
}

export interface TextDrawing extends DrawingBase {
  type: 'text';
  point: ChartDrawingPoint;
  text: string;
}

export type ChartDrawing =
  | HorizontalDrawing
  | VerticalDrawing
  | TwoPointDrawing
  | BrushDrawing
  | TextDrawing;

export const fibonacciLevels = [
  { ratio: 0, label: '0%', color: '#94a3b8' },
  { ratio: 0.236, label: '23.6%', color: '#38bdf8' },
  { ratio: 0.382, label: '38.2%', color: '#22d3ee' },
  { ratio: 0.5, label: '50%', color: '#f59e0b' },
  { ratio: 0.618, label: '61.8%', color: '#a78bfa' },
  { ratio: 0.786, label: '78.6%', color: '#f472b6' },
  { ratio: 1, label: '100%', color: '#94a3b8' },
] as const;

export const drawingColors: Record<ChartDrawingTool, string> = {
  navigate: '#94a3b8',
  select: '#22d3ee',
  horizontal: '#22d3ee',
  vertical: '#f59e0b',
  trendline: '#a78bfa',
  fibonacci: '#f59e0b',
  rectangle: '#06b6d4',
  brush: '#e879f9',
  text: '#38bdf8',
  measure: '#10b981',
};

export function createDrawingId() {
  return `drawing-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isFinitePoint(value: unknown): value is ChartDrawingPoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as Record<string, unknown>;
  return Number.isFinite(point.time) && Number.isFinite(point.price);
}

function normalizeDrawing(value: unknown): ChartDrawing | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const id = typeof item.id === 'string' ? item.id : createDrawingId();
  const base = {
    id,
    color: typeof item.color === 'string' ? item.color : '#22d3ee',
    visible: item.visible !== false,
    locked: item.locked === true,
    createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
  };

  if (item.type === 'horizontal' && Number.isFinite(item.price)) {
    return {
      ...base,
      type: 'horizontal',
      price: Number(item.price),
      role: item.role === 'resistance' ? 'resistance' : 'support',
    };
  }

  if (item.type === 'vertical' && Number.isFinite(item.time)) {
    return { ...base, type: 'vertical', time: Number(item.time) };
  }

  if (
    (item.type === 'trendline' ||
      item.type === 'fibonacci' ||
      item.type === 'rectangle' ||
      item.type === 'measure') &&
    isFinitePoint(item.start) &&
    isFinitePoint(item.end)
  ) {
    return { ...base, type: item.type, start: item.start, end: item.end };
  }

  if (
    item.type === 'brush' &&
    Array.isArray(item.points) &&
    item.points.every(isFinitePoint)
  ) {
    return { ...base, type: 'brush', points: item.points };
  }

  if (
    item.type === 'text' &&
    isFinitePoint(item.point) &&
    typeof item.text === 'string'
  ) {
    return { ...base, type: 'text', point: item.point, text: item.text };
  }

  return null;
}

export function readDrawings(storageKey: string): ChartDrawing[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeDrawing)
      .filter((drawing): drawing is ChartDrawing => drawing !== null);
  } catch {
    return [];
  }
}

export function writeDrawings(storageKey: string, drawings: ChartDrawing[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(drawings));
}
