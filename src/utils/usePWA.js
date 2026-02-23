import { useState, useEffect } from 'react'

export function usePWA() {
  const [promptInstall, setPromptInstall] = useState(null)
  const [instalada, setInstalada] = useState(false)

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setPromptInstall(e)
    })
    window.addEventListener('appinstalled', () => {
      setInstalada(true)
      setPromptInstall(null)
    })
  }, [])

  const instalar = async () => {
    if (!promptInstall) return
    promptInstall.prompt()
    const { outcome } = await promptInstall.userChoice
    if (outcome === 'accepted') setInstalada(true)
    setPromptInstall(null)
  }

  return { promptInstall, instalada, instalar }
}
