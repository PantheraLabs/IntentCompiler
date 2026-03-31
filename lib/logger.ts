// Universal Logging System
// Works for both web (Next.js) and CLI testing

import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================
// LOG TYPES
// ============================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  source?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

// ============================================
// LOGGER CONFIGURATION
// ============================================

interface LoggerConfig {
  level: LogLevel;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
  logFilePath: string;
  maxFileSize: number; // bytes
  maxFiles: number;
  enableColors: boolean;
  enableTimestamps: boolean;
  enableContext: boolean;
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  enableFileLogging: true,
  enableConsoleLogging: true,
  logFilePath: join(process.cwd(), 'logs', 'intent-compiler.log'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  enableColors: true,
  enableTimestamps: true,
  enableContext: true
};

// ============================================
// COLORS FOR CONSOLE OUTPUT
// ============================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

const LEVEL_COLORS = {
  [LogLevel.DEBUG]: COLORS.gray,
  [LogLevel.INFO]: COLORS.green,
  [LogLevel.WARN]: COLORS.yellow,
  [LogLevel.ERROR]: COLORS.red,
  [LogLevel.FATAL]: COLORS.magenta
};

const LEVEL_NAMES = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
};

// ============================================
// LOGGER CLASS
// ============================================

export class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private requestId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    // Ensure log directory exists
    if (this.config.enableFileLogging) {
      this.ensureLogDirectory();
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    const logDir = this.config.logFilePath.replace(/[^/\\]*$/, '');
    if (!existsSync(logDir)) {
      try {
        require('fs').mkdirSync(logDir, { recursive: true });
      } catch (error) {
        // If we can't create directory, disable file logging
        this.config.enableFileLogging = false;
        console.warn('Could not create log directory, file logging disabled');
      }
    }
  }

  /**
   * Check if log file needs rotation
   */
  private rotateLogFileIfNeeded(): void {
    if (!this.config.enableFileLogging) return;

    try {
      const stats = require('fs').statSync(this.config.logFilePath);
      if (stats.size > this.config.maxFileSize) {
        // Rotate files
        for (let i = this.config.maxFiles - 1; i > 0; i--) {
          const oldFile = `${this.config.logFilePath}.${i}`;
          const newFile = `${this.config.logFilePath}.${i + 1}`;
          
          if (existsSync(oldFile)) {
            if (i === this.config.maxFiles - 1) {
              // Delete the oldest file
              require('fs').unlinkSync(oldFile);
            } else {
              // Move to next number
              require('fs').renameSync(oldFile, newFile);
            }
          }
        }
        
        // Move current file to .1
        if (existsSync(this.config.logFilePath)) {
          require('fs').renameSync(this.config.logFilePath, `${this.config.logFilePath}.1`);
        }
      }
    } catch (error) {
      // If rotation fails, continue without it
      console.warn('Log rotation failed:', (error as Error).message);
    }
  }

  /**
   * Format log entry for file output
   */
  private formatForFile(entry: LogEntry): string {
    const parts: string[] = [];
    
    if (this.config.enableTimestamps) {
      parts.push(entry.timestamp);
    }
    
    parts.push(`[${LEVEL_NAMES[entry.level]}]`);
    
    if (entry.source) {
      parts.push(`[${entry.source}]`);
    }
    
    if (entry.sessionId) {
      parts.push(`[${entry.sessionId}]`);
    }
    
    if (entry.requestId) {
      parts.push(`[${entry.requestId}]`);
    }
    
    parts.push(entry.message);
    
    const logLine = parts.join(' ');
    
    // Add context if available
    if (entry.context && Object.keys(entry.context).length > 0) {
      return `${logLine} | Context: ${JSON.stringify(entry.context)}`;
    }
    
    return logLine;
  }

  /**
   * Format log entry for console output
   */
  private formatForConsole(entry: LogEntry): string {
    const parts: string[] = [];
    
    if (this.config.enableColors) {
      parts.push(LEVEL_COLORS[entry.level]);
    }
    
    if (this.config.enableTimestamps) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      parts.push(time);
    }
    
    parts.push(`[${LEVEL_NAMES[entry.level]}]`);
    
    if (entry.source) {
      parts.push(`${entry.source}`);
    }
    
    parts.push(entry.message);
    
    const logLine = parts.join(' ');
    
    if (this.config.enableColors) {
      return `${logLine}${COLORS.reset}`;
    }
    
    return logLine;
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: LogEntry): void {
    if (!this.config.enableFileLogging) return;

    try {
      this.rotateLogFileIfNeeded();
      const logLine = this.formatForFile(entry) + '\n';
      appendFileSync(this.config.logFilePath, logLine);
    } catch (error) {
      // If file writing fails, fallback to console
      console.error('Failed to write to log file:', (error as Error).message);
    }
  }

  /**
   * Write log entry to console
   */
  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsoleLogging) return;

    const logLine = this.formatForConsole(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logLine);
        break;
      case LogLevel.INFO:
        console.info(logLine);
        break;
      case LogLevel.WARN:
        console.warn(logLine);
        break;
      case LogLevel.ERROR:
        console.error(logLine);
        break;
      case LogLevel.FATAL:
        console.error(logLine);
        break;
    }
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    source?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.config.enableContext ? context : undefined,
      source,
      sessionId: this.sessionId,
      requestId: this.requestId
    };
  }

  /**
   * Log entry
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    source?: string
  ): void {
    if (level < this.config.level) return;

    const entry = this.createLogEntry(level, message, context, source);
    
    this.writeToFile(entry);
    this.writeToConsole(entry);
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.DEBUG, message, context, source);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.INFO, message, context, source);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.WARN, message, context, source);
  }

  /**
   * Error level logging
   */
  error(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.ERROR, message, context, source);
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.FATAL, message, context, source);
  }

  /**
   * Set request ID for tracking
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Clear request ID
   */
  clearRequestId(): void {
    this.requestId = undefined;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.enableFileLogging && !existsSync(this.config.logFilePath.replace(/[^/\\]*$/, ''))) {
      this.ensureLogDirectory();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// ============================================
// LOGGER FACTORY
// ============================================

class LoggerFactory {
  private static instance: Logger;
  private static instances: Map<string, Logger> = new Map();

  /**
   * Get default logger instance
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new Logger(config);
    }
    return LoggerFactory.instance;
  }

  /**
   * Get named logger instance
   */
  static getNamedLogger(name: string, config?: Partial<LoggerConfig>): Logger {
    if (!LoggerFactory.instances.has(name)) {
      const loggerConfig = { ...config };
      // Use separate log file for named loggers
      if (config?.enableFileLogging !== false) {
        loggerConfig.logFilePath = join(process.cwd(), 'logs', `${name}.log`);
      }
      LoggerFactory.instances.set(name, new Logger(loggerConfig));
    }
    return LoggerFactory.instances.get(name)!;
  }

  /**
   * Reset all instances (for testing)
   */
  static reset(): void {
    LoggerFactory.instance = null as any;
    LoggerFactory.instances.clear();
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Get default logger
 */
export const logger = LoggerFactory.getInstance();

/**
 * Get named logger
 */
export function getLogger(name: string, config?: Partial<LoggerConfig>): Logger {
  return LoggerFactory.getNamedLogger(name, config);
}

/**
 * Create logger with custom configuration
 */
export function createLogger(config: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

/**
 * Log multi-agent orchestration events
 */
export function logAgentEvent(
  agentType: string,
  event: string,
  data: any,
  logger?: Logger
): void {
  const log = logger || LoggerFactory.getNamedLogger('multi-agent');
  log.info(`[${agentType.toUpperCase()}] ${event}`, data, 'MultiAgent');
}

/**
 * Log phase workflow events
 */
export function logPhaseEvent(
  phase: string,
  event: string,
  data: any,
  logger?: Logger
): void {
  const log = logger || LoggerFactory.getNamedLogger('phase-workflow');
  log.info(`[${phase.toUpperCase()}] ${event}`, data, 'PhaseWorkflow');
}

/**
 * Log context engineering events
 */
export function logContextEvent(
  event: string,
  data: any,
  logger?: Logger
): void {
  const log = logger || LoggerFactory.getNamedLogger('context-engineer');
  log.info(`ContextEngine: ${event}`, data, 'ContextEngineer');
}

/**
 * Log validation events
 */
export function logValidationEvent(
  phase: string,
  event: string,
  data: any,
  logger?: Logger
): void {
  const log = logger || LoggerFactory.getNamedLogger('validation');
  log.info(`[${phase.toUpperCase()}] ${event}`, data, 'Validation');
}

// ============================================
// TYPESCRIPT DECLARATIONS
// ============================================

declare global {
  var logger: Logger;
}

// Add logger to global scope for easy access
if (typeof global !== 'undefined') {
  global.logger = logger;
}

export default logger;
