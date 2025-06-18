import React from 'react'

// Command parser configuration
type CommandType = 'work' | 'break' | 'sessions' | 'number'

interface CommandConfig {
  type: CommandType
  patterns: RegExp[]
  min: number
  max: number
  unit?: string
}

interface ParsedCommand {
  type: CommandType
  value: number
  isValid: boolean
}

// Centralized command configuration
const COMMAND_CONFIGS: CommandConfig[] = [
  {
    type: 'work',
    patterns: [
      /^set work duration to (\d+)(?: minutes?)?$/i,
      /^work (\d+)$/i,
      /^w (\d+)$/i
    ],
    min: 1,
    max: 120,
    unit: 'minutes'
  },
  {
    type: 'break',
    patterns: [
      /^set break duration to (\d+)(?: minutes?)?$/i,
      /^break (\d+)$/i,
      /^b (\d+)$/i
    ],
    min: 1,
    max: 60,
    unit: 'minutes'
  },
  {
    type: 'sessions',
    patterns: [
      /^set sessions to (\d+)$/i,
      /^sessions (\d+)$/i,
      /^s (\d+)$/i
    ],
    min: 1,
    max: 20
  },
  {
    type: 'number',
    patterns: [/^(\d+)$/],
    min: 1,
    max: 120
  }
]

// Single parser function that handles all command types
export function parseCommand(input: string): ParsedCommand[] {
  const trimmedInput = input.trim()
  const results: ParsedCommand[] = []

  for (const config of COMMAND_CONFIGS) {
    for (const pattern of config.patterns) {
      const match = trimmedInput.match(pattern)
      if (match?.[1]) {
        const value = Number.parseInt(match[1])
        const isValid = value >= config.min && value <= config.max

        results.push({
          type: config.type,
          value,
          isValid
        })

        // Stop at first match for non-number commands
        if (config.type !== 'number') {
          return results
        }
      }
    }
  }

  return results
}

// Alternative: Class-based approach for more complex scenarios
export class CommandParser {
  private configs = COMMAND_CONFIGS

  parse(input: string): ParsedCommand[] {
    return parseCommand(input)
  }

  // Get specific command type
  getWorkDuration(input: string): number | null {
    const results = this.parse(input)
    const workCmd = results.find(r => r.type === 'work' && r.isValid)
    return workCmd?.value ?? null
  }

  getBreakDuration(input: string): number | null {
    const results = this.parse(input)
    const breakCmd = results.find(r => r.type === 'break' && r.isValid)
    return breakCmd?.value ?? null
  }

  getSessions(input: string): number | null {
    const results = this.parse(input)
    const sessionsCmd = results.find(r => r.type === 'sessions' && r.isValid)
    return sessionsCmd?.value ?? null
  }

  getNumberOnly(input: string): number | null {
    const results = this.parse(input)
    // Only return number if no other specific commands matched
    const hasSpecificCommand = results.some(r => r.type !== 'number' && r.isValid)
    if (hasSpecificCommand) return null

    const numberCmd = results.find(r => r.type === 'number' && r.isValid)
    return numberCmd?.value ?? null
  }
}

// Usage in your component:
export function useCommandParser() {
  const parser = new CommandParser()

  return {
    parseCommand: (input: string) => {
      const results = parser.parse(input)

      return {
        workDuration: parser.getWorkDuration(input),
        breakDuration: parser.getBreakDuration(input),
        sessions: parser.getSessions(input),
        numberOnly: parser.getNumberOnly(input),
        allResults: results
      }
    }
  }
}

// Even simpler hook-based approach
export function useParsedCommands(searchValue: string) {
  return React.useMemo(() => {
    const results = parseCommand(searchValue)

    // Check if we have any specific command matches
    const specificCommands = results.filter(r => r.type !== 'number' && r.isValid)
    const hasSpecificCommand = specificCommands.length > 0

    return {
      workDuration: results.find(r => r.type === 'work' && r.isValid)?.value ?? null,
      breakDuration: results.find(r => r.type === 'break' && r.isValid)?.value ?? null,
      sessions: results.find(r => r.type === 'sessions' && r.isValid)?.value ?? null,
      numberOnly: hasSpecificCommand ? null : results.find(r => r.type === 'number' && r.isValid)?.value ?? null,
      allResults: results
    }
  }, [searchValue])
}