import { Mic } from 'lucide-react';
import Button from '../UI/Button';

interface VoiceListeningOverlayProps {
  levels: number[];
  onStop: () => void;
}

export default function VoiceListeningOverlay({ levels, onStop }: VoiceListeningOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Écoute vocale en cours"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onStop}
        aria-label="Fermer l'écoute"
      />

      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl p-6">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary-500/25 animate-ping" />
            <div className="relative w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <Mic className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              Je vous écoute…
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Parlez clairement, puis appuyez sur Terminer
            </p>
          </div>

          <div
            className="flex items-end justify-center gap-1.5 h-16 w-full px-2"
            aria-hidden="true"
          >
            {levels.map((level, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-primary-600 to-primary-400 dark:from-primary-500 dark:to-primary-300"
                style={{
                  height: `${Math.round(level * 100)}%`,
                  minHeight: '10%',
                  transition: 'height 75ms ease-out',
                }}
              />
            ))}
          </div>

          <Button type="button" variant="outline" onClick={onStop} className="w-full">
            Terminer
          </Button>
        </div>
      </div>
    </div>
  );
}
