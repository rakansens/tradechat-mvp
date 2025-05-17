import { IndicatorPlugin } from './types';

const indicatorRegistry: Record<string, IndicatorPlugin<any>> = {};

export function registerIndicatorPlugin(plugin: IndicatorPlugin<any>): void {
  indicatorRegistry[plugin.id] = plugin;
}

export function getIndicatorPlugin<TParams>(id: string): IndicatorPlugin<TParams> | undefined {
  return indicatorRegistry[id] as IndicatorPlugin<TParams> | undefined;
}

export function listIndicatorPlugins(): IndicatorPlugin[] {
  return Object.values(indicatorRegistry);
}
