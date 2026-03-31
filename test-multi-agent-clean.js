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
    // Build context-aware prompt for the responding agent
    const agentExpertise = this.getAgentExpertise(message.to);
    const contextInfo = message.context ? JSON.stringify(message.context).substring(0, 200) : 'No context';
    
    const systemPrompt = `You are ${message.to}, an expert agent with expertise in ${agentExpertise}.

You are responding to a ${message.type} from ${message.from}.

Message: "${message.content}"
Context: ${contextInfo}

Provide a helpful, specific response based on your expertise. Be concise but actionable.
Also provide 2-3 concrete suggestions for improvement.

Format your response as:
Response: [your response]
Suggestions: [suggestion 1], [suggestion 2], [suggestion 3]`;

    // Simulate AI response (in production, replace with actual API call)
    // For now, use intelligent mock responses based on agent type and message type
    const response = this.generateIntelligentResponse(message, agentExpertise);
    
    return response;
  }

  getAgentExpertise(agentName) {
    const expertise = {
      'RecipeArchitect': 'culinary design, recipe structure, ingredient analysis',
      'CookingInstructor': 'cooking techniques, step-by-step instructions, kitchen skills',
      'Nutritionist': 'nutrition science, dietary analysis, health optimization'
    };
    return expertise[agentName] || 'general problem solving';
  }

  generateIntelligentResponse(message, expertise) {
    // Extract key information from the message
    const messageContent = message.content.toLowerCase();
    
    // Generate contextual response based on message type and content
    let content = '';
    let suggestions = [];
    let confidence = 0.85;

    if (message.type === 'clarification') {
      if (messageContent.includes('dietary') || messageContent.includes('restriction')) {
        content = `Based on the recipe structure, I recommend considering common dietary restrictions like vegetarian, gluten-free, and dairy-free options. The recipe should be flexible enough to accommodate substitutions.`;
        suggestions = ['Add ingredient alternatives', 'Include allergen warnings', 'Provide substitution ratios'];
        confidence = 0.92;
      } else if (messageContent.includes('nutritional') || messageContent.includes('goals')) {
        content = `For nutritional goals, focus on balanced macronutrients (protein, carbs, fats) and micronutrient density. Consider the target audience's health objectives - weight management, muscle building, or general wellness.`;
        suggestions = ['Define calorie targets', 'Balance macro ratios', 'Highlight nutrient-dense ingredients'];
        confidence = 0.90;
      } else if (messageContent.includes('cooking') || messageContent.includes('technique')) {
        content = `The cooking technique should match the skill level of your audience. For this recipe, I suggest breaking down complex techniques into simple steps with clear timing and temperature guidance.`;
        suggestions = ['Specify equipment needed', 'Add timing for each step', 'Include visual cues for doneness'];
        confidence = 0.88;
      } else {
        content = `Let me clarify: ${messageContent.substring(0, 50)}... I recommend providing more specific details about requirements, constraints, and expected outcomes to ensure optimal results.`;
        suggestions = ['Define success criteria', 'Specify constraints', 'Clarify priorities'];
        confidence = 0.85;
      }
    } else if (message.type === 'feedback') {
      const hasRecipeContext = messageContent.includes('recipe') || messageContent.includes('ingredient');
      const hasCookingContext = messageContent.includes('cooking') || messageContent.includes('step');
      const hasNutritionContext = messageContent.includes('nutrition') || messageContent.includes('calorie');

      if (hasRecipeContext) {
        content = `Your recipe structure looks solid. I suggest enhancing it by adding more detail to ingredient categories and ensuring the cooking flow is intuitive. Consider adding prep time estimates for each phase.`;
        suggestions = ['Add ingredient quantities', 'Include prep time estimates', 'Specify cooking order'];
        confidence = 0.89;
      } else if (hasCookingContext) {
        content = `The cooking instructions are clear. To improve, add more specific timing cues and temperature guidelines. Include troubleshooting tips for common issues like overcooking or underseasoning.`;
        suggestions = ['Add precise timing', 'Include temperature ranges', 'Provide troubleshooting tips'];
        confidence = 0.87;
      } else if (hasNutritionContext) {
        content = `The nutritional analysis is comprehensive. Consider adding more context about health benefits and how this recipe fits into different dietary patterns. Include portion size recommendations.`;
        suggestions = ['Add health benefits', 'Include serving suggestions', 'Provide dietary context'];
        confidence = 0.90;
      } else {
        content = `I've reviewed your approach and it's well-structured. To enhance it further, consider adding more specific details, examples, and actionable steps that users can follow easily.`;
        suggestions = ['Add specific examples', 'Include actionable steps', 'Provide clear guidelines'];
        confidence = 0.86;
      }
    } else if (message.type === 'negotiation') {
      if (messageContent.includes('structure') || messageContent.includes('architecture')) {
        content = `I can optimize the structure by simplifying complex elements while maintaining functionality. Let's focus on a modular design that's easy to understand and extend.`;
        suggestions = ['Simplify architecture', 'Use modular design', 'Prioritize clarity'];
        confidence = 0.88;
      } else if (messageContent.includes('clarity') || messageContent.includes('timing')) {
        content = `To improve clarity and timing, I suggest breaking down steps into smaller, more manageable chunks with clear time estimates. Use visual markers and checkpoints.`;
        suggestions = ['Break into smaller steps', 'Add time estimates', 'Use visual checkpoints'];
        confidence = 0.87;
      } else if (messageContent.includes('nutrition') || messageContent.includes('health')) {
        content = `I can balance nutritional value with taste by suggesting healthier ingredient swaps that maintain flavor. Focus on whole foods and minimize processed ingredients.`;
        suggestions = ['Suggest healthy swaps', 'Maintain flavor profile', 'Use whole foods'];
        confidence = 0.89;
      } else {
        content = `I can work with your proposal. Let's find a balanced solution that meets quality standards while remaining practical and achievable. We can iterate based on feedback.`;
        suggestions = ['Find balanced approach', 'Iterate based on feedback', 'Maintain quality standards'];
        confidence = 0.85;
      }
    } else {
      content = `I understand your ${message.type}. Based on my expertise in ${expertise}, I recommend focusing on practical, actionable solutions that deliver real value.`;
      suggestions = ['Focus on practicality', 'Deliver actionable solutions', 'Ensure real value'];
      confidence = 0.83;
    }

    return {
      content,
      confidence,
      suggestions
    };
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

  async processWithCollaboration(task, context, collaborators, previousOutputs = new Map()) {
    console.log(`\n🤖 [${this.name}] Starting collaborative processing...`);
    
    // Step 1: Initial processing with context from previous agents
    let output = await this.processTask(task, context, previousOutputs);
    console.log(`📋 [${this.name}] Initial output generated`);

    // Step 2: Seek clarification if needed (parallel requests)
    if (this.needsClarification(output)) {
      console.log(`\n❓ [${this.name}] Needs clarification...`);
      
      // Request clarifications in parallel
      const clarificationPromises = collaborators.map(collaborator =>
        this.commSystem.sendMessage(
          this.name,
          collaborator,
          'clarification',
          `I need clarification on: ${this.getClarificationNeed(output)}`,
          output
        )
      );
      
      const clarifications = await Promise.all(clarificationPromises);
      
      // Incorporate all clarifications
      for (let i = 0; i < collaborators.length; i++) {
        output = this.incorporateClarification(output, clarifications[i].content, collaborators[i]);
        console.log(`✅ [${this.name}] Incorporated clarification from ${collaborators[i]}`);
      }
    }

    // Step 3: Request feedback (parallel requests)
    console.log(`\n🔄 [${this.name}] Requesting feedback...`);
    
    const feedbackPromises = collaborators.map(collaborator =>
      this.commSystem.sendMessage(
        this.name,
        collaborator,
        'feedback',
        `Please review my approach for ${task.task}`,
        output
      )
    );
    
    const feedbacks = await Promise.all(feedbackPromises);
    
    // Incorporate all feedback
    for (let i = 0; i < collaborators.length; i++) {
      output = this.incorporateFeedback(output, feedbacks[i].content, feedbacks[i].suggestions);
      console.log(`✅ [${this.name}] Incorporated feedback from ${collaborators[i]}`);
    }

    // Step 4: Negotiate improvements (parallel requests)
    if (this.canBeImproved(output)) {
      console.log(`\n🤝 [${this.name}] Negotiating improvements...`);
      
      const negotiationPromises = collaborators.map(collaborator =>
        this.commSystem.sendMessage(
          this.name,
          collaborator,
          'negotiation',
          `How can we improve: ${this.getImprovementArea(output)}?`,
          output
        )
      );
      
      const negotiations = await Promise.all(negotiationPromises);
      
      // Incorporate all negotiations
      for (let i = 0; i < collaborators.length; i++) {
        output = this.incorporateNegotiation(output, negotiations[i].content, negotiations[i].suggestions);
        console.log(`✅ [${this.name}] Incorporated negotiation from ${collaborators[i]}`);
      }
    }

    const finalQuality = this.calculateOutputQuality(output);
    console.log(`🎯 [${this.name}] Final quality: ${(finalQuality * 100).toFixed(0)}%`);

    return { ...output, confidence: finalQuality };
  }

  // Abstract methods to be implemented by each agent
  async processTask(task, context, previousOutputs) {
    return {
      initialOutput: `${this.name} processed: ${task.task}`,
      needsClarification: true,
      clarificationNeed: 'What are the specific requirements?',
      canBeImproved: true,
      improvementArea: 'overall quality',
      contextUsed: previousOutputs.size > 0
    };
  }

  needsClarification(output) {
    return output.needsClarification || false;
  }

  getClarificationNeed(output) {
    return output.clarificationNeed || 'Need more details';
  }

  incorporateClarification(output, clarification, fromAgent) {
    return {
      ...output,
      needsClarification: false,
      clarifications: [...(output.clarifications || []), { from: fromAgent, content: clarification }],
      refined: true
    };
  }

  incorporateFeedback(output, feedback, suggestions) {
    return {
      ...output,
      feedbacks: [...(output.feedbacks || []), { content: feedback, suggestions }],
      refined: true,
      improvementSuggestions: [...(output.improvementSuggestions || []), ...(suggestions || [])]
    };
  }

  canBeImproved(output) {
    return output.canBeImproved || false;
  }

  getImprovementArea(output) {
    return output.improvementArea || 'general improvement';
  }

  incorporateNegotiation(output, negotiation, suggestions) {
    return {
      ...output,
      negotiations: [...(output.negotiations || []), { content: negotiation, suggestions }],
      optimized: true,
      finalSuggestions: [...(output.finalSuggestions || []), ...(suggestions || [])]
    };
  }

  calculateOutputQuality(output) {
    let quality = 0.7;
    if (!output.needsClarification) quality += 0.05;
    if (output.contextUsed) quality += 0.05;
    if (output.clarifications && output.clarifications.length > 0) quality += 0.05;
    if (output.feedbacks && output.feedbacks.length > 0) quality += 0.05;
    if (output.negotiations && output.negotiations.length > 0) quality += 0.05;
    if (output.refined) quality += 0.05;
    if (output.optimized) quality += 0.05;
    return Math.min(quality, 0.97);
  }
}

// ============================================
// SPECIALIZED COMMUNICATIVE AGENTS
// ============================================

class RecipeArchitectAgent extends CommunicativeAgent {
  constructor(commSystem) {
    super('RecipeArchitect', ['culinary', 'recipe_design'], ['analyze_ingredients', 'recipe_structure'], commSystem);
  }

  async processTask(task, context, previousOutputs) {
    const intent = context.workflow?.intent || 'Build a recipe app';
    
    return {
      phases: ['ingredient_analysis', 'recipe_planning', 'cooking_instructions', 'presentation'],
      recipeStructure: {
        ingredients: { 
          categories: ['main', 'secondary', 'seasoning', 'garnish'],
          basedOnIntent: intent
        },
        cookingFlow: 'prep → cook → plate → serve',
        complexity: 'medium',
        scalability: 'Can be doubled or halved easily'
      },
      designPrinciples: [
        'User-friendly ingredient organization',
        'Clear cooking phase separation',
        'Flexible for dietary modifications'
      ],
      needsClarification: true,
      clarificationNeed: 'What dietary restrictions should I consider for this recipe?',
      canBeImproved: true,
      improvementArea: 'recipe structure optimization',
      contextUsed: previousOutputs.size > 0
    };
  }
}

class CookingInstructorAgent extends CommunicativeAgent {
  constructor(commSystem) {
    super('CookingInstructor', ['cooking_techniques'], ['recipe_instructions', 'cooking_tips'], commSystem);
  }

  async processTask(task, context, previousOutputs) {
    // Use RecipeArchitect's output if available
    let recipeContext = '';
    if (previousOutputs.has('RecipeArchitect')) {
      const recipeOutput = previousOutputs.get('RecipeArchitect');
      recipeContext = `Based on recipe structure: ${recipeOutput.recipeStructure?.cookingFlow || 'standard flow'}`;
    }
    
    return {
      cookingSteps: [
        '1. Prepare all ingredients according to recipe categories (main, secondary, seasoning)',
        '2. Follow prep → cook → plate → serve workflow',
        '3. Apply appropriate cooking techniques for each ingredient type',
        '4. Monitor timing and temperature throughout',
        '5. Plate and serve with garnish'
      ],
      skillLevel: 'intermediate',
      prepTime: '15 minutes',
      cookTime: '30 minutes',
      totalTime: '45 minutes',
      techniques: ['Chopping', 'Sautéing', 'Seasoning', 'Plating'],
      equipmentNeeded: ['Cutting board', 'Chef knife', 'Sauté pan', 'Spatula'],
      contextNote: recipeContext || 'No prior context',
      needsClarification: false,
      canBeImproved: true,
      improvementArea: 'cooking step clarity and timing',
      contextUsed: previousOutputs.size > 0
    };
  }
}

class NutritionistAgent extends CommunicativeAgent {
  constructor(commSystem) {
    super('Nutritionist', ['nutrition', 'dietary_analysis'], ['nutritional_analysis', 'dietary_recommendations'], commSystem);
  }

  async processTask(task, context, previousOutputs) {
    // Use previous agents' outputs if available
    let nutritionContext = '';
    if (previousOutputs.has('RecipeArchitect')) {
      const recipeOutput = previousOutputs.get('RecipeArchitect');
      nutritionContext += `Recipe complexity: ${recipeOutput.recipeStructure?.complexity}. `;
    }
    if (previousOutputs.has('CookingInstructor')) {
      const cookingOutput = previousOutputs.get('CookingInstructor');
      nutritionContext += `Cooking methods: ${cookingOutput.techniques?.join(', ')}. `;
    }
    
    return {
      nutritionAnalysis: {
        perServing: {
          calories: '350-400 kcal',
          protein: '22-25g',
          carbohydrates: '35-40g',
          fat: '12-15g',
          fiber: '5-7g'
        },
        micronutrients: {
          vitaminA: '15% DV',
          vitaminC: '25% DV',
          iron: '10% DV',
          calcium: '8% DV'
        }
      },
      dietaryRecommendations: [
        'Balance with vegetables for added fiber',
        'Control portions to maintain calorie goals',
        'Consider whole grain alternatives for complex carbs',
        'Add leafy greens for micronutrient boost'
      ],
      healthBenefits: [
        'Good protein source for muscle maintenance',
        'Balanced macronutrients for sustained energy',
        'Moderate calorie content suitable for most diets'
      ],
      dietaryCompatibility: {
        vegetarian: 'Can be modified',
        vegan: 'Requires substitutions',
        glutenFree: 'Check ingredient labels',
        dairyFree: 'Possible with alternatives'
      },
      contextNote: nutritionContext || 'No prior context',
      needsClarification: true,
      clarificationNeed: 'What are the specific nutritional goals or restrictions?',
      canBeImproved: true,
      improvementArea: 'nutritional detail and health benefits',
      contextUsed: previousOutputs.size > 0
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
    const previousOutputs = new Map();
    let totalCollaborations = 0;

    // Detect domain
    const domain = this.detectDomain(workflow.intent);
    console.log(`🎯 Detected domain: ${domain}`);
    console.log(`👥 Agents participating: ${Array.from(this.agents.keys()).join(', ')}`);

    // Execute agents with collaboration (sequential with context passing)
    for (const [agentName, agent] of this.agents) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`--- ${agentName} Turn ---`);
      console.log(`Context from previous agents: ${previousOutputs.size} agent(s)`);
      
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

      // Pass previous outputs for context awareness
      const output = await agent.processWithCollaboration(
        task, 
        { workflow, userContext }, 
        collaborators,
        previousOutputs
      );
      
      outputs.set(agentName, output);
      previousOutputs.set(agentName, output); // Add to context for next agents
      totalCollaborations += collaborators.length * 3; // 3 types of collaboration per collaborator

      console.log(`✅ ${agentName} completed with ${(output.confidence * 100).toFixed(0)}% confidence`);
      console.log(`   Context used: ${output.contextUsed ? 'Yes' : 'No'}`);
      console.log(`   Clarifications: ${output.clarifications?.length || 0}`);
      console.log(`   Feedbacks: ${output.feedbacks?.length || 0}`);
      console.log(`   Negotiations: ${output.negotiations?.length || 0}`);
    }

    const totalTime = Date.now() - startTime;
    const avgQuality = Array.from(outputs.values()).reduce((sum, output) => sum + output.confidence, 0) / outputs.size;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 COLLABORATIVE WORKFLOW COMPLETED`);
    console.log(`${'='.repeat(60)}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    console.log(`🤝 Total collaborations: ${totalCollaborations}`);
    console.log(`📊 Average quality: ${(avgQuality * 100).toFixed(0)}%`);
    console.log(`📁 Logs saved to: logs/test-multi-agent.log`);

    // Show final outputs with details
    console.log(`\n📋 FINAL AGENT OUTPUTS:`);
    console.log(`${'='.repeat(60)}`);
    
    for (const [agentName, output] of outputs) {
      console.log(`\n🤖 ${agentName}:`);
      console.log(`   ✅ Confidence: ${(output.confidence * 100).toFixed(0)}%`);
      console.log(`   🔄 Context used: ${output.contextUsed ? 'Yes' : 'No'}`);
      console.log(`   💡 Improvement suggestions: ${output.improvementSuggestions?.length || 0}`);
      
      // Show key output details
      if (agentName === 'RecipeArchitect') {
        console.log(`   📝 Phases: ${output.phases?.join(' → ')}`);
        console.log(`   🏗️  Complexity: ${output.recipeStructure?.complexity}`);
      } else if (agentName === 'CookingInstructor') {
        console.log(`   📝 Steps: ${output.cookingSteps?.length || 0} instructions`);
        console.log(`   ⏱️  Total time: ${output.totalTime}`);
      } else if (agentName === 'Nutritionist') {
        console.log(`   🥗 Calories: ${output.nutritionAnalysis?.perServing?.calories}`);
        console.log(`   💪 Protein: ${output.nutritionAnalysis?.perServing?.protein}`);
      }
    }

    // Show communication summary
    console.log(`\n💬 COMMUNICATION SUMMARY:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📨 Total messages exchanged: ${this.commSystem.messages.length}`);
    console.log(`📡 Active channels: ${this.commSystem.channels.size}`);
    console.log(`🔗 Context-aware agents: ${Array.from(outputs.values()).filter(o => o.contextUsed).length}/${outputs.size}`);

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
