import type App from '../app/index.js'
import { IN_BROWSER } from '../utils.js'
import { ConsoleLog } from '../app/messages.gen.js'

const printError: (e: Error) => string =
  IN_BROWSER && 'InstallTrigger' in window // detect Firefox
    ? (e: Error): string => e.message + '\n' + e.stack
    : (e: Error): string => e.stack || e.message

function printString(arg: any): string {
  if (arg === undefined) {
    return 'undefined'
  }
  if (arg === null) {
    return 'null'
  }
  if (arg instanceof Error) {
    return printError(arg)
  }
  if (Array.isArray(arg)) {
    return `Array(${arg.length})`
  }
  // Limit string conversion to avoid huge strings
  const str = String(arg)
  return str.length > 100 ? str.substring(0, 100) + '...' : str
}

function printFloat(arg: any): string {
  if (typeof arg !== 'number') return 'NaN'
  return arg.toString()
}

function printInt(arg: any): string {
  if (typeof arg !== 'number') return 'NaN'
  return Math.floor(arg).toString()
}

function printObject(arg: any): string {
  if (arg === undefined) {
    return 'undefined'
  }
  if (arg === null) {
    return 'null'
  }
  if (arg instanceof Error) {
    return printError(arg)
  }
  if (Array.isArray(arg)) {
    const length = arg.length
    // Limit to 10 elements max to avoid huge arrays
    const values = arg.slice(0, 10).map(v => {
      const str = printString(v)
      // Limit each element to 50 chars
      return str.length > 50 ? str.substring(0, 50) + '...' : str
    }).join(', ')
    const suffix = length > 10 ? ', ...' : ''
    return `Array(${length})[${values}${suffix}]`
  }
  if (typeof arg === 'object') {
    const res: string[] = []
    let i = 0
    // Limit to 10 properties max
    for (const k in arg) {
      if (++i === 10) {
        res.push('...')
        break
      }
      const v = arg[k]
      const val = printString(v)
      // Limit each value to 50 chars
      const limitedVal = val.length > 50 ? val.substring(0, 50) + '...' : val
      res.push(k + ': ' + limitedVal)
    }
    return '{' + res.join(', ') + '}'
  }
  // Limit toString result
  const str = arg.toString()
  return str.length > 100 ? str.substring(0, 100) + '...' : str
}

function printf(args: any[]): string {
  if (typeof args[0] === 'string') {
    args.unshift(
      args.shift().replace(/%(o|s|f|d|i)/g, (s: string, t: string): string => {
        const arg = args.shift()
        if (arg === undefined) return s
        switch (t) {
          case 'o':
            return printObject(arg)
          case 's':
            return printString(arg)
          case 'f':
            return printFloat(arg)
          case 'd':
          case 'i':
            return printInt(arg)
          default:
            return s
        }
      }),
    )
  }
  return args.map(printObject).join(' ')
}

// Optimized version that stops at maxLength to avoid processing huge messages
function printfLimited(args: any[], maxLength: number): string {
  if (args.length === 0) return ''
  
  let result = ''
  
  // Handle string formatting if first arg is a string with % placeholders
  if (typeof args[0] === 'string' && args[0].includes('%')) {
    const formatStr = args.shift()
    let formatted = formatStr.replace(/%(o|s|f|d|i)/g, (s: string, t: string): string => {
      if (result.length >= maxLength) return '' // Stop if we're at limit
      const arg = args.shift()
      if (arg === undefined) return s
      let replacement = ''
      switch (t) {
        case 'o':
          replacement = printObject(arg)
          break
        case 's':
          replacement = printString(arg)
          break
        case 'f':
          replacement = printFloat(arg)
          break
        case 'd':
        case 'i':
          replacement = printInt(arg)
          break
        default:
          return s
      }
      // Truncate replacement if needed
      if (result.length + replacement.length > maxLength) {
        return replacement.substring(0, maxLength - result.length)
      }
      return replacement
    })
    
    // Truncate formatted string if needed
    if (formatted.length > maxLength) {
      return formatted.substring(0, maxLength)
    }
    result = formatted
  }
  
  // Process remaining args
  for (let i = 0; i < args.length; i++) {
    if (result.length >= maxLength) break
    
    const separator = result.length > 0 ? ' ' : ''
    const printed = printObject(args[i])
    
    // Check if adding this arg would exceed limit
    if (result.length + separator.length + printed.length > maxLength) {
      const remaining = maxLength - result.length - separator.length
      if (remaining > 0) {
        result += separator + printed.substring(0, remaining)
      }
      break
    }
    
    result += separator + printed
  }
  
  return result
}

export interface Options {
  consoleMethods: Array<string> | null
  consoleThrottling: number
  consoleMaxLength: number // Max characters per log
}

const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'assert']

export default function (app: App, opts: Partial<Options>): void {
  const options: Options = Object.assign(
    {
      consoleMethods,
      consoleThrottling: 30,
      consoleMaxLength: 500, // Limit logs to 500 chars
    },
    opts,
  )

  if (!Array.isArray(options.consoleMethods) || options.consoleMethods.length === 0) {
    return
  }

  // Track last log to detect duplicates
  let lastLogLevel = ''
  let lastLogMessage = ''
  let duplicateCount = 0

  const flushLastLog = (): void => {
    if (lastLogMessage) {
      let messageToSend = lastLogMessage
      // Add count tag only if there were duplicates
      if (duplicateCount > 1) {
        messageToSend = `<nl>${duplicateCount}</nl>${lastLogMessage}`
      }
      app.send(ConsoleLog(lastLogLevel, messageToSend))
      lastLogLevel = ''
      lastLogMessage = ''
      duplicateCount = 0
    }
  }

  const sendConsoleLog = app.safe((level: string, args: unknown[]): void => {
    // Use optimized printf that stops at maxLength (avoids processing huge messages)
    let message = printfLimited(args, options.consoleMaxLength)
    
    // Add truncation indicator if we hit the limit
    if (message.length === options.consoleMaxLength && args.join('').length > options.consoleMaxLength) {
      message = message.substring(0, options.consoleMaxLength - 15) + '...[truncated]'
    }

    // Check if this is a duplicate of the last log
    if (level === lastLogLevel && message === lastLogMessage) {
      duplicateCount++
      return // Don't send duplicate, just increment counter
    }

    // Flush the previous log (with count if duplicates existed)
    flushLastLog()

    // Store current log (will be sent on next different log or flush)
    lastLogLevel = level
    lastLogMessage = message
    duplicateCount = 1 // Start counting (1 = first occurrence)
  })

  // Flush any pending log on session end
  app.attachStopCallback(() => {
    flushLastLog()
  })

  let n = 0
  const reset = (): void => {
    n = 0
    // Flush pending log before reset
    flushLastLog()
  }
  app.attachStartCallback(reset)
  app.ticker.attach(reset, 33, false)

  const patchConsole = (console: Console, ctx: typeof globalThis) => {
    const handler = {
      apply: function (target: Console['log'], thisArg: typeof this, argumentsList: unknown[]) {
        Reflect.apply(target, ctx, argumentsList)
        n = n + 1
        if (n > options.consoleThrottling) {
          return
        } else {
          sendConsoleLog(target.name, argumentsList)
        }
      },
    }

    options.consoleMethods!.forEach((method) => {
      if (consoleMethods.indexOf(method) === -1) {
        app.debug.error(`Sonarly: unsupported console method "${method}"`)
        return
      }
      const fn = (ctx.console as any)[method]
      // is there any way to preserve the original console trace?
      ;(console as any)[method] = new Proxy(fn, handler)
    })
  }

  const patchContext = app.safe((context: typeof globalThis) =>
    patchConsole(context.console, context),
  )

  patchContext(window)
  app.observer.attachContextCallback(patchContext)
}
