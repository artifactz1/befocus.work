let intervalId: NodeJS.Timeout | null = null

self.onmessage = e => {
  const { command, interval } = e.data

  if (command === 'start') {
    if (intervalId) return // Prevent multiple intervals
    intervalId = setInterval(() => {
      self.postMessage('tick')
    }, interval)
  } else if (command === 'stop') {
    clearInterval(intervalId as NodeJS.Timeout)
    intervalId = null
  }
}
