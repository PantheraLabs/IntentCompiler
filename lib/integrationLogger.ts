// Integration Logger for Web Application
// Ensures all website activities also log to files

import { logger, getLogger } from './logger';

// ============================================
// WEB LOGGER CONFIGURATION
// ============================================

const webLogger = getLogger('web-app', {
  level: 1, // INFO
  enableFileLogging: true,
  enableConsoleLogging: true,
  logFilePath: 'logs/web-app.log',
  enableColors: true,
  enableTimestamps: true,
  enableContext: true
});

const multiAgentLogger = getLogger('multi-agent-web', {
  level: 1, // INFO
  enableFileLogging: true,
  enableConsoleLogging: false, // Reduce console noise in web
  logFilePath: 'logs/multi-agent-web.log',
  enableColors: false,
  enableTimestamps: true,
  enableContext: true
});

const phaseWorkflowLogger = getLogger('phase-workflow-web', {
  level: 1, // INFO
  enableFileLogging: true,
  enableConsoleLogging: false,
  logFilePath: 'logs/phase-workflow-web.log',
  enableColors: false,
  enableTimestamps: true,
  enableContext: true
});

// ============================================
// WEB-SPECIFIC LOGGING FUNCTIONS
// ============================================

/**
 * Log user interactions
 */
export function logUserInteraction(
  action: string,
  userId?: string,
  context?: Record<string, any>
): void {
  webLogger.info(`User Action: ${action}`, {
    userId,
    action,
    timestamp: new Date().toISOString(),
    ...context
  }, 'UserInteraction');
}

/**
 * Log API requests
 */
export function logApiRequest(
  method: string,
  endpoint: string,
  userId?: string,
  context?: Record<string, any>
): void {
  webLogger.info(`API Request: ${method} ${endpoint}`, {
    method,
    endpoint,
    userId,
    timestamp: new Date().toISOString(),
    ...context
  }, 'APIRequest');
}

/**
 * Log API responses
 */
export function logApiResponse(
  method: string,
  endpoint: string,
  statusCode: number,
  responseTime: number,
  userId?: string,
  context?: Record<string, any>
): void {
  const level = statusCode >= 400 ? 'error' : 'info';
  webLogger[level](`API Response: ${method} ${endpoint} - ${statusCode}`, {
    method,
    endpoint,
    statusCode,
    responseTime,
    userId,
    timestamp: new Date().toISOString(),
    ...context
  }, 'APIResponse');
}

/**
 * Log workflow compilation
 */
export function logWorkflowCompilation(
  intent: string,
  userId?: string,
  context?: Record<string, any>
): void {
  webLogger.info(`Workflow Compilation Started`, {
    intent,
    userId,
    timestamp: new Date().toISOString(),
    ...context
  }, 'WorkflowCompilation');
}

/**
 * Log workflow completion
 */
export function logWorkflowCompletion(
  workflowId: string,
  success: boolean,
  executionTime: number,
  userId?: string,
  context?: Record<string, any>
): void {
  const level = success ? 'info' : 'error';
  webLogger[level](`Workflow Compilation ${success ? 'Completed' : 'Failed'}`, {
    workflowId,
    success,
    executionTime,
    userId,
    timestamp: new Date().toISOString(),
    ...context
  }, 'WorkflowCompletion');
}

/**
 * Log multi-agent events (web version)
 */
export function logWebAgentEvent(
  agentType: string,
  event: string,
  data: any,
  userId?: string
): void {
  multiAgentLogger.info(`[${agentType.toUpperCase()}] ${event}`, {
    agentType,
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...data
  }, 'WebMultiAgent');
}

/**
 * Log phase workflow events (web version)
 */
export function logWebPhaseEvent(
  phase: string,
  event: string,
  data: any,
  userId?: string
): void {
  phaseWorkflowLogger.info(`[${phase.toUpperCase()}] ${event}`, {
    phase,
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...data
  }, 'WebPhaseWorkflow');
}

/**
 * Log errors with context
 */
export function logError(
  error: Error,
  context?: Record<string, any>,
  userId?: string
): void {
  webLogger.error(error.message, {
    stack: error.stack,
    userId,
    timestamp: new Date().toISOString(),
    ...context
  }, 'Error');
}

/**
 * Log performance metrics
 */
export function logPerformance(
  metric: string,
  value: number,
  unit: string,
  context?: Record<string, any>
): void {
  webLogger.info(`Performance: ${metric} = ${value}${unit}`, {
    metric,
    value,
    unit,
    timestamp: new Date().toISOString(),
    ...context
  }, 'Performance');
}

// ============================================
// REACT HOOK FOR LOGGING
// ============================================

/**
 * Custom hook for logging in React components
 */
export function useLogger(componentName: string) {
  return {
    log: (message: string, context?: Record<string, any>) => {
      webLogger.info(`[${componentName}] ${message}`, context, componentName);
    },
    logError: (error: Error, context?: Record<string, any>) => {
      webLogger.error(`[${componentName}] ${error.message}`, {
        stack: error.stack,
        ...context
      }, componentName);
    },
    logUserAction: (action: string, context?: Record<string, any>) => {
      logUserInteraction(action, undefined, { component: componentName, ...context });
    },
    logPerformance: (metric: string, value: number, unit: string, context?: Record<string, any>) => {
      logPerformance(metric, value, unit, { component: componentName, ...context });
    }
  };
}

// ============================================
// MIDDLEWARE HELPERS
// ============================================

/**
 * Create request logging middleware
 */
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const userId = req.user?.id || 'anonymous';
    
    // Log request
    logApiRequest(req.method, req.url, userId, {
      headers: req.headers,
      query: req.query,
      body: req.body
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const responseTime = Date.now() - startTime;
      
      logApiResponse(req.method, req.url, res.statusCode, responseTime, userId, {
        responseHeaders: res.getHeaders()
      });
      
      originalEnd.apply(this, args);
    };
    
    next();
  };
}

/**
 * Create error logging middleware
 */
export function createErrorLogger() {
  return (error: Error, req: any, res: any, next: any) => {
    const userId = req.user?.id || 'anonymous';
    
    logError(error, {
      url: req.url,
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: req.body,
      userId
    }, userId);
    
    next(error);
  };
}

// ============================================
// EXPORTS
// ============================================

export {
  webLogger,
  multiAgentLogger,
  phaseWorkflowLogger
};

export default {
  webLogger,
  multiAgentLogger,
  phaseWorkflowLogger,
  logUserInteraction,
  logApiRequest,
  logApiResponse,
  logWorkflowCompilation,
  logWorkflowCompletion,
  logWebAgentEvent,
  logWebPhaseEvent,
  logError,
  logPerformance,
  useLogger,
  createRequestLogger,
  createErrorLogger
};
