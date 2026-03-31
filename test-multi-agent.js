#!/usr/bin/env node

/**
 * Multi-Agent System Test Case
 * Run with: node test-multi-agent.js
 */

// Mock imports (since we're not in the full Next.js environment)
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// Simple logger for CLI testing
class CLILogger {
  constructor() {
    this.logFile = join(process.cwd(), 'logs', 'test-multi-agent.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = this.logFile.replace(/[^/\\]*$/, '');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }

  writeLog(level, message, context = {}, source = 'MultiAgent') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context,
      source,
      sessionId: 'cli-test-session'
    };

    // Write to file
    const logLine = `${timestamp} [${level}] [${source}] ${message} | Context: ${JSON.stringify(context)}\n`;
    require('fs').appendFileSync(this.logFile, logLine);

    // Also output to console
    console.log(`[${level}] ${message}`);
  }

  info(message, context, source) {
    this.writeLog('INFO', message, context, source);
  }

  debug(message, context, source) {
    this.writeLog('DEBUG', message, context, source);
  }

  warn(message, context, source) {
    this.writeLog('WARN', message, context, source);
  }

  error(message, context, source) {
    this.writeLog('ERROR', message, context, source);
  }
}

const logger = new CLILogger();
const mockSchemas = {
  AgentType: { enum: ['architect', 'instructor', 'validator', 'reviewer', 'documenter', 'supervisor'] },
  UserContext: { 
    project: 'Portfolio Website',
    techStack: 'React, TypeScript, Tailwind CSS',
    audience: 'Developers and recruiters',
    constraints: ['Must be responsive', 'SEO friendly']
  },
  Workflow: {
    id: 'test-workflow-123',
    intent: 'Build a modern portfolio website with React',
    steps: [],
    currentPhase: 'plan',
    createdAt: new Date().toISOString(),
    status: 'draft'
  }
};

// Mock ModelConfig
const mockModelConfig = {
  provider: 'openai',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 4000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0
};

// ============================================
// MOCK AGENT IMPLEMENTATIONS
// ============================================

class MockArchitectAgent {
  type = 'architect';
  
  async execute(task, context) {
    logger.info(`🏗️  ARCHITECT: Designing workflow for "${task.task}"`, { taskId: task.id }, 'ArchitectAgent');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const architecture = {
      phases: ['specify', 'plan', 'tasks', 'execute'],
      parallelizable: true,
      estimatedSteps: 5,
      recommendedAgents: ['instructor', 'validator', 'documenter'],
      complexity: 'medium',
      estimatedDuration: 2000
    };
    
    logger.info(`✅ ARCHITECT: Designed ${architecture.phases.length}-phase workflow`, 
      { phases: architecture.phases.length, parallelizable: architecture.parallelizable, steps: architecture.estimatedSteps }, 
      'ArchitectAgent');
    
    return {
      taskId: task.id,
      success: true,
      output: architecture,
      confidence: 0.95,
      executionTimeMs: 500,
      warnings: []
    };
  }
}

class MockInstructorAgent {
  type = 'instructor';
  
  async execute(task, context) {
    logger.info(`📝 INSTRUCTOR: Generating instructions for "${task.task}"`, { taskId: task.id }, 'InstructorAgent');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const instructions = this.generateInstructions(task, context);
    
    logger.info(`✅ INSTRUCTOR: Generated ${instructions.length} instruction sections`, 
      { sections: instructions.length, estimatedLength: instructions.length * 50 }, 
      'InstructorAgent');
    
    return {
      taskId: task.id,
      success: true,
      output: instructions,
      confidence: 0.92,
      executionTimeMs: 300,
      warnings: this.validateInstructions(instructions)
    };
  }
  
  generateInstructions(task, context) {
    return [
      {
        title: "Project Setup",
        content: "Initialize React project with TypeScript and Tailwind CSS",
        steps: [
          "npx create-react-app portfolio --template typescript",
          "cd portfolio",
          "npm install tailwindcss",
          "npx tailwindcss init"
        ]
      },
      {
        title: "Component Structure",
        content: "Create reusable components for portfolio sections",
        steps: [
          "Create components/Header.tsx",
          "Create components/Hero.tsx",
          "Create components/Projects.tsx",
          "Create components/Contact.tsx"
        ]
      },
      {
        title: "Styling",
        content: "Apply Tailwind CSS for responsive design",
        steps: [
          "Configure tailwind.config.js",
          "Apply utility classes to components",
          "Ensure mobile responsiveness"
        ]
      }
    ];
  }
  
  validateInstructions(instructions) {
    const warnings = [];
    if (instructions.length < 3) {
      warnings.push("Instructions seem incomplete");
    }
    return warnings;
  }
}

class MockValidatorAgent {
  type = 'validator';
  
  async execute(task, context) {
    console.log(`✅ VALIDATOR: Checking quality of workflow outputs`);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const validationResult = this.validateOutput(task, context);
    
    console.log(`✅ VALIDATOR: Quality check complete`);
    console.log(`   Overall quality: ${(validationResult.confidence * 100).toFixed(0)}%`);
    console.log(`   Issues found: ${validationResult.issues.length}`);
    console.log(`   Suggestions: ${validationResult.suggestions.length}`);
    
    return {
      taskId: task.id,
      success: validationResult.valid,
      output: validationResult,
      confidence: validationResult.confidence,
      executionTimeMs: 200,
      warnings: validationResult.issues
    };
  }
  
  validateOutput(task, context) {
    const issues = [];
    let confidence = 1.0;
    
    // Check if output exists
    if (!task.context?.output) {
      issues.push("No output to validate");
      confidence = 0;
    }
    
    // Check output quality
    const output = task.context?.output;
    if (output && output.length < 100) {
      issues.push("Output seems incomplete");
      confidence -= 0.2;
    }
    
    return {
      valid: issues.length === 0,
      issues,
      confidence: Math.max(confidence, 0),
      suggestions: this.generateSuggestions(issues)
    };
  }
  
  generateSuggestions(issues) {
    return issues.map(issue => {
      if (issue.includes('incomplete')) return "Add more detail to the output";
      if (issue.includes('No output')) return "Ensure previous step generates output";
      return "Review and improve quality";
    });
  }
}

class MockReviewerAgent {
  type = 'reviewer';
  
  async execute(task, context) {
    console.log(`🔍 REVIEWER: Analyzing workflow for optimizations`);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const review = this.reviewWorkflow(task, context);
    
    console.log(`✅ REVIEWER: Analysis complete`);
    console.log(`   Overall quality: ${(review.overallQuality * 100).toFixed(0)}%`);
    console.log(`   Critical issues: ${review.criticalIssues.length}`);
    console.log(`   Optimizations found: ${review.optimizations.length}`);
    
    return {
      taskId: task.id,
      success: true,
      output: review,
      confidence: 0.88,
      executionTimeMs: 400,
      warnings: review.criticalIssues
    };
  }
  
  reviewWorkflow(task, context) {
    return {
      overallQuality: 0.85,
      criticalIssues: [],
      suggestions: [
        "Consider adding error handling",
        "Add validation checkpoints",
        "Include testing instructions"
      ],
      optimizations: [
        "Steps 2 and 3 can run in parallel",
        "Reduce redundant validations",
        "Combine similar styling steps"
      ],
      performance: {
        estimatedSpeed: "Fast",
        memoryUsage: "Low",
        complexity: "Medium"
      }
    };
  }
}

class MockDocumenterAgent {
  type = 'documenter';
  
  async execute(task, context) {
    console.log(`📚 DOCUMENTER: Creating project documentation`);
    
    await new Promise(resolve => setTimeout(resolve, 350));
    
    const documentation = this.generateDocumentation(task, context);
    
    console.log(`✅ DOCUMENTER: Documentation generated`);
    console.log(`   Sections: ${Object.keys(documentation).length}`);
    console.log(`   Total length: ${JSON.stringify(documentation).length} characters`);
    
    return {
      taskId: task.id,
      success: true,
      output: documentation,
      confidence: 0.90,
      executionTimeMs: 350,
      warnings: []
    };
  }
  
  generateDocumentation(task, context) {
    return {
      readme: `# ${context.project}\n\n## Overview\nA modern portfolio website built with React and TypeScript.\n\n## Tech Stack\n${context.techStack}\n\n## Getting Started\n1. Clone the repository\n2. Install dependencies\n3. Run the application\n\n## Features\n- Responsive design\n- Modern UI\n- Performance optimized\n\n## Contributing\nPlease read CONTRIBUTING.md for details.`,
      contributing: `# Contributing to ${context.project}\n\n## How to Contribute\n1. Fork the repository\n2. Create a feature branch\n3. Make your changes\n4. Submit a pull request\n\n## Guidelines\n- Follow the existing code style\n- Add tests for new features\n- Update documentation`,
      license: `MIT License\n\nCopyright (c) 2024 ${context.project}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy...`
    };
  }
}

// ============================================
// MOCK SUPERVISOR
// ============================================

class MockSupervisorAgent {
  constructor() {
    this.agents = new Map([
      ['architect', new MockArchitectAgent()],
      ['instructor', new MockInstructorAgent()],
      ['validator', new MockValidatorAgent()],
      ['reviewer', new MockReviewerAgent()],
      ['documenter', new MockDocumenterAgent()]
    ]);
  }
  
  async createPlan(workflow, context) {
    console.log(`\n🎯 SUPERVISOR: Creating orchestration plan for workflow`);
    
    const tasks = [
      {
        id: 'task-1',
        agentType: 'architect',
        task: 'Design workflow architecture',
        context: { workflow, userContext: context },
        dependencies: [],
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'task-2',
        agentType: 'instructor',
        task: 'Generate setup instructions',
        context: { step: 'setup', userContext: context },
        dependencies: ['task-1'],
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'task-3',
        agentType: 'instructor',
        task: 'Generate component instructions',
        context: { step: 'components', userContext: context },
        dependencies: ['task-1'],
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'task-4',
        agentType: 'validator',
        task: 'Validate all instructions',
        context: { workflow, userContext: context },
        dependencies: ['task-2', 'task-3'],
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'task-5',
        agentType: 'reviewer',
        task: 'Review and optimize workflow',
        context: { workflow, userContext: context },
        dependencies: ['task-4'],
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'task-6',
        agentType: 'documenter',
        task: 'Create project documentation',
        context: { workflow, userContext: context },
        dependencies: ['task-5'],
        priority: 'low',
        status: 'pending'
      }
    ];
    
    const plan = {
      id: 'plan-123',
      workflowId: workflow.id,
      tasks,
      parallelizable: true,
      estimatedDuration: 2500,
      strategy: 'hybrid'
    };
    
    console.log(`📋 SUPERVISOR: Plan created with ${tasks.length} tasks`);
    console.log(`   Strategy: ${plan.strategy}`);
    console.log(`   Estimated duration: ${plan.estimatedDuration}ms`);
    
    return plan;
  }
  
  async executePlan(plan, context) {
    console.log(`\n🚀 SUPERVISOR: Executing orchestration plan`);
    
    const results = new Map();
    const completedTasks = new Set();
    
    // Group tasks by dependency level for hybrid execution
    const levels = this.groupByDependencyLevel(plan.tasks);
    
    console.log(`📊 SUPERVISOR: Executing ${levels.length} levels in hybrid mode`);
    
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      console.log(`\n--- Level ${i + 1}: Executing ${level.length} tasks ---`);
      
      // Execute tasks in this level in parallel
      const levelPromises = level.map(async (task) => {
        const agent = this.agents.get(task.agentType);
        if (!agent) {
          throw new Error(`No agent found for type: ${task.agentType}`);
        }
        
        const result = await agent.execute(task, context);
        results.set(task.id, result);
        
        if (result.success) {
          completedTasks.add(task.id);
        }
        
        return result;
      });
      
      await Promise.all(levelPromises);
    }
    
    return results;
  }
  
  groupByDependencyLevel(tasks) {
    const levels = [];
    const processed = new Set();
    
    while (processed.size < tasks.length) {
      const currentLevel = tasks.filter(task => 
        !processed.has(task.id) &&
        (task.dependencies || []).every(dep => processed.has(dep))
      );
      
      if (currentLevel.length === 0) break;
      
      levels.push(currentLevel);
      currentLevel.forEach(task => processed.add(task.id));
    }
    
    return levels;
  }
}

// ============================================
// MOCK AGENT ORCHESTRATOR
// ============================================

class MockAgentOrchestrator {
  constructor() {
    this.supervisor = new MockSupervisorAgent();
  }
  
  async orchestrate(workflow, context) {
    console.log(`\n🎭 MULTI-AGENT ORCHESTRATION STARTED`);
    console.log(`====================================`);
    
    const startTime = Date.now();
    
    // Create orchestration plan
    const plan = await this.supervisor.createPlan(workflow, context);
    
    // Execute plan
    const results = await this.supervisor.executePlan(plan, context);
    
    // Check overall success
    const success = Array.from(results.values()).every(r => r.success);
    const totalExecutionTime = Date.now() - startTime;
    
    console.log(`\n🎉 MULTI-AGENT ORCHESTRATION COMPLETE`);
    console.log(`====================================`);
    console.log(`✅ Success: ${success}`);
    console.log(`⏱️  Total time: ${totalExecutionTime}ms`);
    console.log(`📊 Results: ${results.size} tasks completed`);
    
    // Show summary of all agent results
    console.log(`\n📋 AGENT RESULTS SUMMARY:`);
    for (const [taskId, result] of results) {
      console.log(`   ${taskId}: ${result.success ? '✅' : '❌'} (${result.executionTimeMs}ms, confidence: ${(result.confidence * 100).toFixed(0)}%)`);
    }
    
    return {
      plan,
      results,
      success,
      totalExecutionTime
    };
  }
}

// ============================================
// TEST EXECUTION
// ============================================

async function runMultiAgentTest() {
  // Welcome message
  console.log(`\n🤖 IntentCompiler - Multi-Agent System Test`);
  console.log(`=====================================\n`);
  console.log(`This test will demonstrate the 5 specialized agents working together:`);
  console.log(`🏗️  Architect Agent - Designs workflow structure`);
  console.log(`📝 Instructor Agent - Generates instructions`);
  console.log(`✅ Validator Agent - Validates quality`);
  console.log(`🔍 Reviewer Agent - Reviews and optimizes`);
  console.log(`📚 Documenter Agent - Creates documentation\n`);
  
  logger.info(`🧪 MULTI-AGENT SYSTEM TEST STARTED`, { sessionId: 'cli-test-session' }, 'MultiAgentTest');
  
  // Get user input for intent
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Ask for intent
  const intent = await new Promise((resolve) => {
    rl.question('🎯 Enter your intent (e.g., "Build a portfolio website with React"): ', (answer) => {
      resolve(answer.trim());
    });
  });

  // Ask for project name
  const project = await new Promise((resolve) => {
    rl.question('📝 Project name (optional, press Enter to skip): ', (answer) => {
      resolve(answer.trim() || 'Untitled Project');
    });
  });

  // Ask for tech stack
  const techStack = await new Promise((resolve) => {
    rl.question('⚙️  Tech stack (optional, press Enter for default): ', (answer) => {
      resolve(answer.trim() || 'React, TypeScript, Tailwind CSS');
    });
  });

  // Ask for audience
  const audience = await new Promise((resolve) => {
    rl.question('👥 Target audience (optional, press Enter for default): ', (answer) => {
      resolve(answer.trim() || 'General users');
    });
  });

  // Ask for constraints
  const constraints = await new Promise((resolve) => {
    rl.question('⚠️  Constraints (optional, press Enter to skip): ', (answer) => {
      const answerTrimmed = answer.trim();
      resolve(answerTrimmed ? answerTrimmed.split(',').map(c => c.trim()) : []);
    });
  });

  rl.close();

  // Create test data from user input
  const workflow = {
    ...mockSchemas.Workflow,
    intent: intent || 'Build a simple web application'
  };

  const context = {
    project: project,
    techStack: techStack,
    audience: audience,
    constraints: constraints
  };

  const modelConfig = mockModelConfig;
  
  logger.info(`📝 User Input:`, {
    intent: workflow.intent,
    project: context.project,
    techStack: context.techStack,
    audience: context.audience,
    constraints: context.constraints
  }, 'MultiAgentTest');
  
  // Initialize orchestrator
  const orchestrator = new MockAgentOrchestrator();
  
  try {
    // Run orchestration
    const result = await orchestrator.orchestrate(workflow, context);
    
    // Log overall result
    logger.info(`🎯 ORCHESTRATION COMPLETE`, {
      success: result.success,
      totalExecutionTime: result.totalExecutionTime,
      tasksCompleted: result.results.size
    }, 'MultiAgentTest');
    
    // Show detailed results
    logger.info(`📊 DETAILED RESULTS:`);
    
    for (const [taskId, taskResult] of result.results) {
      const task = result.plan.tasks.find(t => t.id === taskId);
      
      logger.info(`${task.agentType.toUpperCase()} Agent Result:`, {
        task: task.task,
        success: taskResult.success,
        confidence: taskResult.confidence,
        executionTimeMs: taskResult.executionTimeMs,
        warnings: taskResult.warnings
      }, 'MultiAgentTest');
      
      // Show sample output for each agent type
      if (taskResult.success && taskResult.output) {
        switch (task.agentType) {
          case 'architect':
            logger.info(`Architecture details:`, {
              phases: taskResult.output.phases.length,
              parallelizable: taskResult.output.parallelizable,
              steps: taskResult.output.estimatedSteps
            }, 'MultiAgentTest');
            break;
          case 'instructor':
            logger.info(`Instruction details:`, {
              sections: taskResult.output.length,
              estimatedLength: taskResult.output.length * 50
            }, 'MultiAgentTest');
            break;
          case 'validator':
            logger.info(`Validation details:`, {
              quality: (taskResult.output.confidence * 100).toFixed(0) + '%',
              issues: taskResult.output.issues.length,
              suggestions: taskResult.output.suggestions.length
            }, 'MultiAgentTest');
            break;
          case 'reviewer':
            logger.info(`Review details:`, {
              quality: (taskResult.output.overallQuality * 100).toFixed(0) + '%',
              optimizations: taskResult.output.optimizations.length,
              criticalIssues: taskResult.output.criticalIssues.length
            }, 'MultiAgentTest');
            break;
          case 'documenter':
            logger.info(`Documentation details:`, {
              files: Object.keys(taskResult.output).length,
              readmeLength: taskResult.output.readme.length
            }, 'MultiAgentTest');
            break;
        }
      }
    }
    
    logger.info(`🏆 TEST RESULT: ${result.success ? 'PASSED' : 'FAILED'}`, {
      success: result.success,
      totalTasks: result.results.size,
      successfulTasks: Array.from(result.results.values()).filter(r => r.success).length
    }, 'MultiAgentTest');
    
    // Show summary of generated content
    console.log(`\n📋 GENERATED CONTENT SUMMARY:`);
    console.log(`===========================`);
    
    for (const [taskId, taskResult] of result.results) {
      const task = result.plan.tasks.find(t => t.id === taskId);
      if (taskResult.success && taskResult.output) {
        console.log(`\n${task.agentType.toUpperCase()} Agent Generated:`);
        
        switch (task.agentType) {
          case 'architect':
            console.log(`   Workflow: ${taskResult.output.phases.join(' → ')}`);
            console.log(`   Strategy: ${taskResult.output.parallelizable ? 'Parallel execution' : 'Sequential'}`);
            console.log(`   Steps: ${taskResult.output.estimatedSteps} estimated`);
            break;
          case 'instructor':
            console.log(`   Instructions for: ${task.task}`);
            taskResult.output.forEach((section, index) => {
              console.log(`   ${index + 1}. ${section.title}`);
              console.log(`      ${section.content}`);
              if (section.steps && section.steps.length > 0) {
                section.steps.forEach((step, stepIndex) => {
                  console.log(`      ${stepIndex + 1}) ${step}`);
                });
              }
            });
            break;
          case 'validator':
            console.log(`   Quality Score: ${(taskResult.output.confidence * 100).toFixed(0)}%`);
            console.log(`   Issues: ${taskResult.output.issues.length}`);
            console.log(`   Suggestions: ${taskResult.output.suggestions.join(', ')}`);
            break;
          case 'reviewer':
            console.log(`   Overall Quality: ${(taskResult.output.overallQuality * 100).toFixed(0)}%`);
            console.log(`   Optimizations: ${taskResult.output.optimizations.join(', ')}`);
            console.log(`   Performance: ${taskResult.output.performance.estimatedSpeed}`);
            break;
          case 'documenter':
            console.log(`   Files Generated: ${Object.keys(taskResult.output).join(', ')}`);
            console.log(`   README Preview: ${taskResult.output.readme.split('\n')[0]}`);
            break;
        }
      }
    }
    
    console.log(`\n📁 Logs saved to: logs/test-multi-agent.log`);
    console.log(`🎯 Test completed in ${result.totalExecutionTime}ms`);
    
  } catch (error) {
    logger.error(`❌ Test failed:`, { error: error.message, stack: error.stack }, 'MultiAgentTest');
    console.error(`❌ Test failed:`, error.message);
  }
}

// ============================================
// RUN TEST
// ============================================

if (require.main === module) {
  runMultiAgentTest().catch(console.error);
}

module.exports = {
  MockAgentOrchestrator,
  runMultiAgentTest
};
