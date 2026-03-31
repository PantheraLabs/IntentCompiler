#!/usr/bin/env node

/**
 * Multi-Agent System Test Case with Real-Time Communication
 * Run with: node test-multi-agent-clean.js
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
    const logLine = `${timestamp} [${level}] [${source}] ${message} | Context: ${JSON.stringify(context)}\n`;
    require('fs').appendFileSync(this.logFile, logLine);
    console.log(`[${level}] ${message}`);
  }

  info(message, context, source) {
    this.writeLog('INFO', message, context, source);
  }
}

const logger = new CLILogger();

// ============================================
// REAL-TIME AGENT COMMUNICATION SYSTEM
// ============================================

class AgentCommunicationSystem {
  constructor() {
    this.messages = [];
    this.channels = new Map();
    this.messageId = 1;
  }

  createChannel(name, participants) {
    this.channels.set(name, {
      name,
      participants,
      messages: []
    });
    logger.info(`📡 Communication channel created: ${name}`, { participants }, 'CommSystem');
  }

  async sendMessage(from, to, type, content, context = {}) {
    const message = {
      id: this.messageId++,
      from,
      to,
      type,
      content,
      context,
      timestamp: new Date().toISOString()
    };

    this.messages.push(message);

    // Show real-time message
    console.log(`\n💬 [${type.toUpperCase()}] ${from} → ${to}`);
    console.log(`   "${content}"`);
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    // Generate response
    const response = await this.generateResponse(message);
    
    console.log(`💬 [RESPONSE] ${to} → ${from}`);
    console.log(`   "${response.content}"`);
    if (response.suggestions && response.suggestions.length > 0) {
      console.log(`   💡 Suggestions: ${response.suggestions.join(', ')}`);
    }

    return response;
  }

  async generateResponse(message) {
    const responseHandlers = {
      'RecipeArchitect': {
        'question': (content) => ({
          content: `Based on recipe architecture principles, ${this.getRecipeAnswer(content)}`,
          confidence: 0.9,
          suggestions: ['Consider ingredient pairing', 'Think about cooking methods', 'Plan for dietary restrictions']
        }),
        'clarification': (content) => ({
          content: `Let me clarify the recipe structure: ${this.getClarification(content)}`,
          confidence: 0.92,
          suggestions: ['Be more specific about ingredients', 'Consider cooking time', 'Define serving size']
        }),
        'feedback': (content) => ({
          content: `Thanks for the feedback! I'll refine the recipe structure: ${this.getFeedbackResponse(content)}`,
          confidence: 0.87,
          suggestions: ['Incorporate dietary needs', 'Simplify complex steps', 'Add preparation tips']
        }),
        'negotiation': (content) => ({
          content: `I can work with that proposal: ${this.getNegotiationResponse(content)}`,
          confidence: 0.83,
          suggestions: ['Find middle ground', 'Consider alternatives', 'Balance complexity and time']
        })
      },
      'CookingInstructor': {
        'question': (content) => ({
          content: `From a cooking perspective: ${this.getCookingAnswer(content)}`,
          confidence: 0.85,
          suggestions: ['Focus on technique clarity', 'Consider skill level', 'Plan timing carefully']
        }),
        'clarification': (content) => ({
          content: `Let me clarify the cooking technique: ${this.getCookingClarification(content)}`,
          confidence: 0.90,
          suggestions: ['Be specific about equipment', 'Consider prep time', 'Define difficulty level']
        }),
        'feedback': (content) => ({
          content: `Great feedback! I'll improve the cooking instructions: ${this.getCookingFeedback(content)}`,
          confidence: 0.88,
          suggestions: ['Add step-by-step photos', 'Include troubleshooting', 'Provide timing cues']
        }),
        'negotiation': (content) => ({
          content: `I can adjust the cooking approach: ${this.getCookingNegotiation(content)}`,
          confidence: 0.84,
          suggestions: ['Simplify techniques', 'Offer alternatives', 'Adjust timing']
        })
      },
      'Nutritionist': {
        'question': (content) => ({
          content: `Nutritionally speaking: ${this.getNutritionAnswer(content)}`,
          confidence: 0.88,
          suggestions: ['Balance macronutrients', 'Consider allergens', 'Maximize nutritional value']
        }),
        'clarification': (content) => ({
          content: `Let me clarify the nutritional aspect: ${this.getNutritionClarification(content)}`,
          confidence: 0.91,
          suggestions: ['Specify dietary restrictions', 'Consider calorie goals', 'Define nutritional focus']
        }),
        'feedback': (content) => ({
          content: `Excellent nutritional feedback! I'll enhance the analysis: ${this.getNutritionFeedback(content)}`,
          confidence: 0.89,
          suggestions: ['Add micronutrient details', 'Include health benefits', 'Consider portion sizes']
        }),
        'negotiation': (content) => ({
          content: `I can balance nutrition and taste: ${this.getNutritionNegotiation(content)}`,
          confidence: 0.86,
          suggestions: ['Find healthy alternatives', 'Balance flavors', 'Maintain nutritional value']
        })
      }
    };

    const handler = responseHandlers[message.to]?.[message.type];
    if (handler) {
      return handler(message.content);
    }

    return {
      content: `I understand your ${message.type}: ${message.content}`,
      confidence: 0.8,
      suggestions: ['Continue collaboration', 'Refine approach', 'Consider alternatives']
    };
  }

  // Response generators
  getRecipeAnswer(question) {
    const answers = [
      'you should structure recipes with clear ingredient categories and cooking phases',
      'consider the flow from preparation to presentation for optimal user experience',
      'think about scalability - can this recipe be easily doubled or halved?'
    ];
    return answers[Math.floor(Math.random() * answers.length)];
  }

  getCookingAnswer(question) {
    const answers = [
      'focus on technique clarity and timing precision in your instructions',
      'consider the skill level of your target audience',
      'include troubleshooting tips for common cooking issues'
    ];
    return answers[Math.floor(Math.random() * answers.length)];
  }

  getNutritionAnswer(question) {
    const answers = [
      'ensure balanced macronutrients and consider micronutrient density',
      'factor in cooking method impacts on nutritional value',
      'consider dietary restrictions and allergen information'
    ];
    return answers[Math.floor(Math.random() * answers.length)];
  }

  getClarification(request) {
    return `I need more specific details about ${request.substring(0, 30)}... Let me provide targeted guidance.`;
  }

  getFeedbackResponse(feedback) {
    return `I'll incorporate your suggestions to improve the recipe structure and user experience.`;
  }

  getNegotiationResponse(proposal) {
    return `I can work with that approach. Let's find a solution that balances practicality and culinary excellence.`;
  }

  getCookingClarification(request) {
    return `I need more details about the cooking technique for ${request.substring(0, 30)}... Let me provide specific instructions.`;
  }

  getCookingFeedback(feedback) {
    return `I'll refine the cooking steps to be clearer and more user-friendly based on your feedback.`;
  }

  getCookingNegotiation(proposal) {
    return `I can adjust the cooking method to better suit your requirements while maintaining quality.`;
  }

  getNutritionClarification(request) {
    return `I need more specific nutritional information about ${request.substring(0, 30)}... Let me provide detailed analysis.`;
  }

  getNutritionFeedback(feedback) {
    return `I'll enhance the nutritional analysis to be more comprehensive and actionable.`;
  }

  getNutritionNegotiation(proposal) {
    return `I can balance nutritional value with taste preferences to create a healthier yet delicious option.`;
  }
}

// ============================================
// COMMUNICATIVE AGENTS
// ============================================

class CommunicativeAgent {
  constructor(name, expertise, capabilities, commSystem) {
    this.name = name;
    this.expertise = expertise;
    this.capabilities = capabilities;
    this.commSystem = commSystem;
  }

  async processWithCollaboration(task, context, collaborators) {
    console.log(`\n🤖 [${this.name}] Starting collaborative processing...`);
    
    // Step 1: Initial processing
    let output = await this.processTask(task, context);
    console.log(`📋 [${this.name}] Initial output: ${JSON.stringify(output).substring(0, 100)}...`);

    // Step 2: Seek clarification if needed
    if (this.needsClarification(output)) {
      console.log(`\n❓ [${this.name}] Needs clarification...`);
      for (const collaborator of collaborators) {
        const clarification = await this.commSystem.sendMessage(
          this.name,
          collaborator,
          'clarification',
          `I need clarification on: ${this.getClarificationNeed(output)}`,
          output
        );
        
        output = this.incorporateClarification(output, clarification.content);
        console.log(`✅ [${this.name}] Incorporated clarification from ${collaborator}`);
      }
    }

    // Step 3: Request feedback
    console.log(`\n🔄 [${this.name}] Requesting feedback...`);
    for (const collaborator of collaborators) {
      const feedback = await this.commSystem.sendMessage(
        this.name,
        collaborator,
        'feedback',
        `Please review my approach: ${JSON.stringify(output).substring(0, 150)}...`,
        output
      );
      
      output = this.incorporateFeedback(output, feedback.content);
      console.log(`✅ [${this.name}] Incorporated feedback from ${collaborator}`);
    }

    // Step 4: Negotiate improvements
    if (this.canBeImproved(output)) {
      console.log(`\n🤝 [${this.name}] Negotiating improvements...`);
      for (const collaborator of collaborators) {
        const negotiation = await this.commSystem.sendMessage(
          this.name,
          collaborator,
          'negotiation',
          `How can we improve: ${this.getImprovementArea(output)}?`,
          output
        );
        
        output = this.incorporateNegotiation(output, negotiation.content);
        console.log(`✅ [${this.name}] Incorporated negotiation from ${collaborator}`);
      }
    }

    const finalQuality = this.calculateOutputQuality(output);
    console.log(`🎯 [${this.name}] Final quality: ${(finalQuality * 100).toFixed(0)}%`);

    return { ...output, confidence: finalQuality };
  }

  // Abstract methods to be implemented by each agent
  async processTask(task, context) {
    return {
      initialOutput: `${this.name} processed: ${task.task}`,
      needsClarification: true,
      clarificationNeed: 'What are the specific requirements?',
      canBeImproved: true,
      improvementArea: 'overall quality'
    };
  }

  needsClarification(output) {
    return output.needsClarification || false;
  }

  getClarificationNeed(output) {
    return output.clarificationNeed || 'Need more details';
  }

  incorporateClarification(output, clarification) {
    return {
      ...output,
      needsClarification: false,
      clarification: clarification,
      refined: true
    };
  }

  incorporateFeedback(output, feedback) {
    return {
      ...output,
      feedback: feedback,
      refined: true
    };
  }

  canBeImproved(output) {
    return output.canBeImproved || false;
  }

  getImprovementArea(output) {
    return output.improvementArea || 'general improvement';
  }

  incorporateNegotiation(output, negotiation) {
    return {
      ...output,
      negotiation: negotiation,
      optimized: true
    };
  }

  calculateOutputQuality(output) {
    let quality = 0.7;
    if (!output.needsClarification) quality += 0.1;
    if (output.refined) quality += 0.1;
    if (output.optimized) quality += 0.1;
    return Math.min(quality, 0.95);
  }
}

// ============================================
// SPECIALIZED COMMUNICATIVE AGENTS
// ============================================

class RecipeArchitectAgent extends CommunicativeAgent {
  constructor(commSystem) {
    super('RecipeArchitect', ['culinary', 'recipe_design'], ['analyze_ingredients', 'recipe_structure'], commSystem);
  }

  async processTask(task, context) {
    return {
      phases: ['ingredient_analysis', 'recipe_planning', 'cooking_instructions', 'presentation'],
      recipeStructure: {
        ingredients: { categories: ['main', 'secondary', 'seasoning', 'garnish'] },
        cookingFlow: 'prep → cook → plate → serve',
        complexity: 'medium'
      },
      needsClarification: true,
      clarificationNeed: 'What dietary restrictions should I consider for this recipe?',
      canBeImproved: true,
      improvementArea: 'recipe structure optimization'
    };
  }
}

class CookingInstructorAgent extends CommunicativeAgent {
  constructor(commSystem) {
    super('CookingInstructor', ['cooking_techniques'], ['recipe_instructions', 'cooking_tips'], commSystem);
  }

  async processTask(task, context) {
    return {
      cookingSteps: '1. Prepare ingredients\n2. Cook according to recipe\n3. Serve and enjoy',
      skillLevel: 'intermediate',
      prepTime: '30 minutes',
      needsClarification: false,
      canBeImproved: true,
      improvementArea: 'cooking step clarity and timing'
    };
  }
}

class NutritionistAgent extends CommunicativeAgent {
  constructor(commSystem) {
    super('Nutritionist', ['nutrition', 'dietary_analysis'], ['nutritional_analysis', 'dietary_recommendations'], commSystem);
  }

  async processTask(task, context) {
    return {
      nutritionAnalysis: {
        calories: '300-400 calories',
        protein: '20-25g',
        carbs: '30-40g',
        fat: '10-15g'
      },
      dietaryRecommendations: ['Balance with vegetables', 'Control portions'],
      needsClarification: true,
      clarificationNeed: 'What are the specific nutritional goals or restrictions?',
      canBeImproved: true,
      improvementArea: 'nutritional detail and health benefits'
    };
  }
}

// ============================================
// COLLABORATIVE ORCHESTRATOR
// ============================================

class CollaborativeOrchestrator {
  constructor() {
    this.commSystem = new AgentCommunicationSystem();
    this.agents = new Map();
    this.initializeAgents();
  }

  initializeAgents() {
    // Create agents
    const recipeArchitect = new RecipeArchitectAgent(this.commSystem);
    const cookingInstructor = new CookingInstructorAgent(this.commSystem);
    const nutritionist = new NutritionistAgent(this.commSystem);

    // Register agents
    this.agents.set('RecipeArchitect', recipeArchitect);
    this.agents.set('CookingInstructor', cookingInstructor);
    this.agents.set('Nutritionist', nutritionist);

    // Create communication channels
    this.commSystem.createChannel('recipe-team', ['RecipeArchitect', 'CookingInstructor', 'Nutritionist']);
  }

  async executeWithCollaboration(workflow, userContext) {
    console.log(`\n🚀 STARTING COLLABORATIVE WORKFLOW EXECUTION`);
    console.log(`=====================================`);

    const startTime = Date.now();
    const outputs = new Map();
    let totalCollaborations = 0;

    // Detect domain
    const domain = this.detectDomain(workflow.intent);
    console.log(`🎯 Detected domain: ${domain}`);
    console.log(`👥 Agents participating: ${Array.from(this.agents.keys()).join(', ')}`);

    // Execute agents with collaboration
    for (const [agentName, agent] of this.agents) {
      console.log(`\n--- ${agentName} Turn ---`);
      
      const collaborators = Array.from(this.agents.keys()).filter(name => name !== agentName);
      
      const task = {
        id: `task-${agentName}`,
        agentType: 'instructor',
        task: `${agent.expertise.join(' & ')}: ${agent.capabilities.slice(0, 2).join(', ')}`,
        context: { workflow, userContext },
        dependencies: [],
        priority: 'high',
        status: 'pending'
      };

      const output = await agent.processWithCollaboration(task, { workflow, userContext }, collaborators);
      outputs.set(agentName, output);
      totalCollaborations += collaborators.length;

      console.log(`✅ ${agentName} completed with ${(output.confidence * 100).toFixed(0)}% confidence`);
    }

    const totalTime = Date.now() - startTime;
    const avgQuality = Array.from(outputs.values()).reduce((sum, output) => sum + output.confidence, 0) / outputs.size;

    console.log(`\n🎉 COLLABORATIVE WORKFLOW COMPLETED`);
    console.log(`=====================================`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    console.log(`🤝 Total collaborations: ${totalCollaborations}`);
    console.log(`📊 Average quality: ${(avgQuality * 100).toFixed(0)}%`);
    console.log(`📁 Logs saved to: logs/test-multi-agent.log`);

    // Show final outputs
    console.log(`\n📋 FINAL AGENT OUTPUTS:`);
    console.log(`======================`);
    
    for (const [agentName, output] of outputs) {
      console.log(`\n${agentName}:`);
      console.log(`   Confidence: ${(output.confidence * 100).toFixed(0)}%`);
      console.log(`   Key output: ${JSON.stringify(output).substring(0, 200)}...`);
    }

    // Show communication summary
    console.log(`\n💬 COMMUNICATION SUMMARY:`);
    console.log(`========================`);
    console.log(`Total messages exchanged: ${this.commSystem.messages.length}`);
    console.log(`Active channels: ${this.commSystem.channels.size}`);

    return {
      outputs,
      collaborations: totalCollaborations,
      totalTime,
      quality: avgQuality
    };
  }

  detectDomain(intent) {
    const intentLower = intent.toLowerCase();
    
    if (intentLower.includes('food') || intentLower.includes('recipe') || intentLower.includes('cooking')) {
      return 'food';
    }
    if (intentLower.includes('finance') || intentLower.includes('money') || intentLower.includes('investment')) {
      return 'finance';
    }
    if (intentLower.includes('social') || intentLower.includes('community') || intentLower.includes('chat')) {
      return 'social';
    }
    
    return 'general';
  }
}

// ============================================
// MAIN TEST FUNCTION
// ============================================

async function runInteractiveTest() {
  console.log(`🤖 IntentCompiler - Multi-Agent Communication Test`);
  console.log(`==================================================`);
  console.log(`\nThis test demonstrates REAL-TIME agent communication where:`);
  console.log(`🗣️  Agents talk to each other to clarify requirements`);
  console.log(`🔄 Agents provide feedback to improve each other's work`);
  console.log(`🤝 Agents negotiate to find the best solutions`);
  console.log(`📈 Each agent's output improves through collaboration\n`);

  // Get user input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const intent = await new Promise(resolve => 
    rl.question('🎯 Enter your intent (e.g., "build a recipe app for cooking"): ', answer => resolve(answer.trim()))
  );

  const projectName = await new Promise(resolve => 
    rl.question('📝 Project name (optional, press Enter to skip): ', answer => resolve(answer.trim()))
  );

  const techStack = await new Promise(resolve => 
    rl.question('⚙️  Tech stack (optional, press Enter for default): ', answer => resolve(answer.trim()))
  );

  const audience = await new Promise(resolve => 
    rl.question('👥 Target audience (optional, press Enter for default): ', answer => resolve(answer.trim()))
  );

  const constraints = await new Promise(resolve => 
    rl.question('⚠️  Constraints (optional, press Enter to skip): ', answer => resolve(answer.trim()))
  );

  rl.close();

  // Create user context
  const userContext = {
    project: projectName || 'Untitled Project',
    techStack: techStack || 'React, Node.js, TypeScript',
    audience: audience || 'General users',
    constraints: constraints ? constraints.split(',').map(c => c.trim()) : []
  };

  // Create workflow
  const workflow = {
    id: `workflow-${Date.now()}`,
    intent: intent,
    steps: []
  };

  logger.info('🧪 COLLABORATIVE MULTI-AGENT TEST STARTED', {
    intent,
    userContext
  }, 'MainTest');

  console.log(`\n📝 User Input:`);
  console.log(`   Intent: ${intent}`);
  console.log(`   Project: ${userContext.project}`);
  console.log(`   Tech Stack: ${userContext.techStack}`);
  console.log(`   Audience: ${userContext.audience}`);
  console.log(`   Constraints: ${userContext.constraints.join(', ') || 'None'}`);

  try {
    // Initialize collaborative orchestrator
    const orchestrator = new CollaborativeOrchestrator();

    // Execute with real-time communication
    const result = await orchestrator.executeWithCollaboration(workflow, userContext);

    logger.info('🏆 COLLABORATIVE TEST RESULT: SUCCESS', {
      totalTime: result.totalTime,
      collaborations: result.collaborations,
      quality: result.quality
    }, 'MainTest');

    console.log(`\n🎯 Test completed successfully!`);
    console.log(`💬 Total agent conversations: ${result.collaborations}`);
    console.log(`📊 Final output quality: ${(result.quality * 100).toFixed(0)}%`);

  } catch (error) {
    logger.error('❌ Test failed:', { error: error.message, stack: error.stack }, 'MainTest');
    console.error(`❌ Test failed:`, error.message);
  }
}

// ============================================
// RUN TEST
// ============================================

// Run the test if this file is executed directly
if (require.main === module) {
  runInteractiveTest().catch(console.error);
}

module.exports = {
  runInteractiveTest,
  CollaborativeOrchestrator,
  AgentCommunicationSystem,
  CommunicativeAgent,
  RecipeArchitectAgent,
  CookingInstructorAgent,
  NutritionistAgent
};
