import { DrawingToolPlugin } from './types';

const drawingToolRegistry: Record<string, DrawingToolPlugin<any, any>> = {};

export function registerDrawingTool(plugin: DrawingToolPlugin<any, any>): void {
  drawingToolRegistry[plugin.id] = plugin;
}

export function getDrawingTool<TOptions, THandle>(id: string): DrawingToolPlugin<TOptions, THandle> | undefined {
  return drawingToolRegistry[id] as DrawingToolPlugin<TOptions, THandle> | undefined;
}

export function listDrawingTools(): DrawingToolPlugin[] {
  return Object.values(drawingToolRegistry);
}
