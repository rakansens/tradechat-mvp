'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * デバッグモード切り替えスイッチコンポーネント
 * 
 * デバッグモードのオン/オフを制御するUIコンポーネント
 */
interface DebugModeSwitchProps {
  isDebugMode: boolean;
  onToggle: (value: boolean) => void;
}

export function DebugModeSwitch({ isDebugMode, onToggle }: DebugModeSwitchProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="debug-mode"
        checked={isDebugMode}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="debug-mode">デバッグモード</Label>
    </div>
  );
}