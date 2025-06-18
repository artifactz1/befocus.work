import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useSaveUserSettings } from '~/hooks/useSession'
import { signOut, useSession } from '~/lib/auth.client'
import { useTimerStore } from '~/store/useTimerStore'

// Hook for keyboard shortcuts
export function useCommandMenuKeyboard(setOpen: React.Dispatch<React.SetStateAction<boolean>>) {

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open: boolean) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setOpen])
}

// Hook for theme management
export function useThemeActions() {
  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  const toggleTheme = React.useCallback(() => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }, [isDarkMode, setTheme])

  return {
    isDarkMode,
    toggleTheme
  }
}

// Hook for authentication actions
export function useAuthActions() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }, [router])

  const handleSignIn = React.useCallback(() => {
    router.push('/sign-in')
  }, [router])

  return {
    session,
    isPending,
    handleSignOut,
    handleSignIn
  }
}

// Hook for timer actions
export function useTimerActions() {
  const {
    isRunning,
    resetCurrentTime,
    skipToPrevSession,
    skipToNextSession,
    toggleTimer,
    updateSettings,
    reset,
    workDuration,
    breakDuration,
    sessions
  } = useTimerStore()

  return {
    isRunning,
    resetCurrentTime,
    skipToPrevSession,
    skipToNextSession,
    toggleTimer,
    updateSettings,
    reset,
    workDuration,
    breakDuration,
    sessions
  }
}

// Hook for autocomplete suggestions
export function useAutocompleteSuggestions(input: string) {
  return React.useMemo(() => {
    const trimmedInput = input.trim().toLowerCase()
    const suggestions: {
      id: string
      type: string
      text: string
      description: string
      keywords: string[]
    }[] = []

    // If input is empty, don't show suggestions
    if (trimmedInput.length === 0) {
      return suggestions
    }

    // Define suggestion templates
    const suggestionTemplates = [
      {
        id: 'work-duration-autocomplete',
        text: 'set work duration to ',
        description: 'Suggestion',
        keywords: ['set', 'work'],
        fullText: 'set work duration to'
      },
      {
        id: 'break-duration-autocomplete',
        text: 'set break duration to ',
        description: 'Suggestion',
        keywords: ['set', 'break'],
        fullText: 'set break duration to'
      },
      {
        id: 'sessions-autocomplete',
        text: 'set sessions to ',
        description: 'Suggestion',
        keywords: ['set', 'session', 'sessions'],
        fullText: 'set sessions to'
      },
    ]

    // Check each template
    for (const template of suggestionTemplates) {
      // Don't show suggestion if input exactly matches the suggestion text
      if (trimmedInput === template.text.trim()) {
        continue
      }

      const shouldShow =
        // Exact prefix match (original behavior)
        template.fullText.startsWith(trimmedInput) ||
        // Contains relevant keywords
        template.keywords.some(keyword => trimmedInput.includes(keyword)) ||
        // Partial match after "set "
        (trimmedInput.startsWith('set ') &&
          template.keywords.some(keyword =>
            keyword.startsWith(trimmedInput.replace('set ', '').trim())
          ))

      if (shouldShow) {
        suggestions.push({
          id: template.id,
          type: 'autocomplete',
          text: template.text,
          keywords: template.keywords,
          description: template.description
        })
      }
    }

    return suggestions
  }, [input])
}

// Hook for settings updates
export function useSettingsUpdate() {
  const { updateSettings, reset, workDuration, breakDuration, sessions } = useTimerStore()
  const { mutateAsync: saveSettings, isPending: isSaving } = useSaveUserSettings()

  const handleSaveSettings = React.useCallback(async (workTime: number, breakTime: number, sessionCount: number) => {
    try {
      await saveSettings({
        workDuration: workTime,
        breakDuration: breakTime,
        numberOfSessions: sessionCount,
      })
      // Update timer store with new settings
      updateSettings('workDuration', workTime)
      updateSettings('breakDuration', breakTime)
      updateSettings('sessions', sessionCount)
      reset()
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }, [saveSettings, updateSettings, reset])

  const confirmUpdate = React.useCallback(async (
    type: 'work' | 'break' | 'sessions',
    value: number
  ) => {
    const currentWorkTime = workDuration
    const currentBreakTime = breakDuration
    const currentSessions = sessions

    let newWorkTime = currentWorkTime
    let newBreakTime = currentBreakTime
    let newSessions = currentSessions

    // Update the appropriate setting
    switch (type) {
      case 'work':
        newWorkTime = value * 60 // Convert to seconds
        break
      case 'break':
        newBreakTime = value * 60 // Convert to seconds
        break
      case 'sessions':
        newSessions = value
        break
    }

    await handleSaveSettings(newWorkTime, newBreakTime, newSessions)
  }, [workDuration, breakDuration, sessions, handleSaveSettings])

  return {
    isSaving,
    confirmUpdate
  }
}

// Main hook that combines everything for settings management
export function useSettingsDialog() {
  const [alertOpen, setAlertOpen] = React.useState(false)
  const [pendingUpdate, setPendingUpdate] = React.useState<{
    type: 'work' | 'break' | 'sessions'
    value: number
    label: string
  } | null>(null)

  const { resetCurrentTime } = useTimerStore()
  const { isSaving, confirmUpdate } = useSettingsUpdate()

  const handleSettingUpdate = React.useCallback((
    type: 'work' | 'break' | 'sessions',
    value: number,
    label: string
  ) => {
    setPendingUpdate({ type, value, label })
    setAlertOpen(true)
  }, [])

  const confirmSettingUpdate = React.useCallback(async () => {
    if (!pendingUpdate) return

    await confirmUpdate(pendingUpdate.type, pendingUpdate.value)

    resetCurrentTime()
    setAlertOpen(false)
    setPendingUpdate(null)
  }, [pendingUpdate, confirmUpdate, resetCurrentTime])

  const cancelSettingUpdate = React.useCallback(() => {
    setAlertOpen(false)
    setPendingUpdate(null)
  }, [])

  return {
    alertOpen,
    setAlertOpen,
    pendingUpdate,
    isSaving,
    handleSettingUpdate,
    confirmSettingUpdate,
    cancelSettingUpdate
  }
}

// Generic command handler hook
export function useCommandHandler(setOpen: (open: boolean) => void) {
  const handleCommand = React.useCallback((action: () => void) => {
    action()
    setOpen(false)
  }, [setOpen])

  return { handleCommand }
}