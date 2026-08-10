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
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors'
        }
      >
        <Download size={14} />
        {label}
      </button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setShowIOSHelp(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold text-slate-800">App installeren</p>
              <button
                onClick={() => setShowIOSHelp(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Sluiten"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Op de iPad en iPhone gaat dit via Safari, niet met één klik:
            </p>
            <ol className="text-sm text-slate-600 leading-relaxed list-decimal pl-5 space-y-2">
              <li>
                Tik op het deel-icoon <Share size={13} className="inline -mt-0.5" /> onderin (of
                bovenin) Safari.
              </li>
              <li>Kies "Zet op beginscherm".</li>
              <li>Tik rechtsboven op "Voeg toe".</li>
            </ol>
            <p className="text-xs text-slate-400 mt-3">
              Werkt alleen in Safari, niet in Chrome of een andere browser op iOS.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
