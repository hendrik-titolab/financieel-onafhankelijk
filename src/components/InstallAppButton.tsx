import { useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

interface Props {
  className?: string
  label?: string
}

export function InstallAppButton({ className, label = 'Download als app' }: Props) {
  const { canInstall, hasNativePrompt, isIOS, promptInstall } = useInstallPrompt()
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  if (!canInstall) return null

  const handleClick = () => {
    if (hasNativePrompt) {
      promptInstall()
    } else if (isIOS) {
      setShowIOSHelp(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={
          className ??
          'flex items-center gap-1.5 px-3 py-1.5 text-sm text-body hover:text-ink hover:bg-warmwhite rounded-[3px] transition-colors'
        }
      >
        <Download size={14} />
        {label}
      </button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setShowIOSHelp(false)}
        >
          <div className="bg-panel rounded-[3px] border border-line max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-medium text-ink">App installeren</p>
              <button
                onClick={() => setShowIOSHelp(false)}
                className="text-muted hover:text-ink transition-colors"
                title="Sluiten"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-body mb-3">
              Op de iPad en iPhone gaat dit via Safari, niet met één klik:
            </p>
            <ol className="text-sm text-body leading-relaxed list-decimal pl-5 space-y-2">
              <li>
                Tik op het deel-icoon <Share size={13} className="inline -mt-0.5" /> onderin (of
                bovenin) Safari.
              </li>
              <li>Kies "Zet op beginscherm".</li>
              <li>Tik rechtsboven op "Voeg toe".</li>
            </ol>
            <p className="text-xs text-body mt-3">
              Werkt alleen in Safari, niet in Chrome of een andere browser op iOS.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
