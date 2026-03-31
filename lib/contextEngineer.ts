// Context Engineering System
// Optimizes context for AI models with token budget management

import { UserContext, ModelConfig, WorkflowStep } from './schemas';

// ============================================
// CONTEXT ENGINEERING TYPES
// ============================================

interface TokenBudget {
  total: number;
  used: number;
  remaining: number;
  allocation: {
    systemPrompt: number;
    userContext: number;
    workflowSteps: number;
    examples: number;
    buffer: number;
  };
}

interface ContextPriority {
  item: string;
  content: string;
  relevance: number;
  tokenCount: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface EngineeredContext {
  optimized: string;
  tokenCount: number;
  compressionRatio: number;
  itemsIncluded: number;
  itemsExcluded: number;
  efficiency: number;
}

// ============================================
// TOKEN COUNTING
// ============================================

class TokenCounter {
  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  count(text: string): number {
    // More accurate estimation considering:
    // - Whitespace
    // - Punctuation
    // - Common words
    const words = text.split(/\s+/).length;
    const chars = text.length;
    
    // Average: ~1.3 tokens per word, or ~4 chars per token
    return Math.ceil(Math.max(words * 1.3, chars / 4));
  }

  /**
   * Count tokens in structured data
   */
  countObject(obj: any): number {
    return this.count(JSON.stringify(obj));
  }

  /**
   * Estimate tokens for array of items
   */
  countArray(items: string[]): number {
    return items.reduce((total, item) => total + this.count(item), 0);
  }
}

// ============================================
// CONTEXT PRIORITIZER
// ============================================

class ContextPrioritizer {
  /**
   * Prioritize context items by relevance to task
   */
  prioritize(
    contextItems: Array<{ item: string; content: string }>,
    task: string,
    tokenCounter: TokenCounter
  ): ContextPriority[] {
    return contextItems.map(({ item, content }) => {
      const relevance = this.calculateRelevance(item, content, task);
      const tokenCount = tokenCounter.count(content);
      const priority = this.determinePriority(relevance, tokenCount);

      return {
        item,
        content,
        relevance,
        tokenCount,
        priority
      };
    }).sort((a, b) => {
      // Sort by priority, then relevance, then token efficiency
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.relevance !== b.relevance) {
        return b.relevance - a.relevance;
      }
      return a.tokenCount - b.tokenCount; // Prefer shorter content
    });
  }

  /**
   * Calculate relevance score (0-1)
   */
  private calculateRelevance(item: string, content: string, task: string): number {
    let score = 0;

    // Keyword matching
    const taskWords = task.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    const itemWords = item.toLowerCase().split(/\s+/);

    const matchingWords = taskWords.filter(word => 
      contentWords.includes(word) || itemWords.includes(word)
    );

    score += (matchingWords.length / taskWords.length) * 0.5;

    // Item type importance
    if (item.includes('intent') || item.includes('goal')) {
      score += 0.3;
    } else if (item.includes('techStack') || item.includes('technology')) {
      score += 0.2;
    } else if (item.includes('constraint')) {
      score += 0.15;
    }

    // Content quality
    if (content.length > 100) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * Determine priority level
   */
  private determinePriority(
    relevance: number,
    tokenCount: number
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (relevance > 0.8) return 'critical';
    if (relevance > 0.6) return 'high';
    if (relevance > 0.4) return 'medium';
    return 'low';
  }
}

// ============================================
// CONTEXT COMPRESSOR
// ============================================

class ContextCompressor {
  /**
   * Compress context while preserving meaning
   */
  compress(content: string, targetTokens: number, tokenCounter: TokenCounter): string {
    const currentTokens = tokenCounter.count(content);
    
    if (currentTokens <= targetTokens) {
      return content;
    }

    const compressionRatio = targetTokens / currentTokens;

    // Apply compression techniques
    let compressed = content;

    // 1. Remove redundant whitespace
    compressed = this.removeRedundantWhitespace(compressed);

    // 2. Abbreviate common phrases
    if (compressionRatio < 0.8) {
      compressed = this.abbreviateCommonPhrases(compressed);
    }

    // 3. Remove filler words
    if (compressionRatio < 0.6) {
      compressed = this.removeFillerWords(compressed);
    }

    // 4. Truncate if still too long
    if (tokenCounter.count(compressed) > targetTokens) {
      compressed = this.truncateToTokenLimit(compressed, targetTokens, tokenCounter);
    }

    return compressed;
  }

  /**
   * Expand abbreviated context
   */
  expand(content: string, targetTokens: number, tokenCounter: TokenCounter): string {
    const currentTokens = tokenCounter.count(content);
    
    if (currentTokens >= targetTokens) {
      return content;
    }

    // Add more detail, examples, explanations
    let expanded = content;

    // 1. Add section headers
    expanded = this.addStructure(expanded);

    // 2. Add examples if space allows
    if (tokenCounter.count(expanded) < targetTokens * 0.8) {
      expanded = this.addExamples(expanded);
    }

    return expanded;
  }

  private removeRedundantWhitespace(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private abbreviateCommonPhrases(text: string): string {
    const abbreviations: Record<string, string> = {
      'for example': 'e.g.',
      'that is': 'i.e.',
      'and so on': 'etc.',
      'as soon as possible': 'ASAP',
      'frequently asked questions': 'FAQ'
    };

    let result = text;
    for (const [phrase, abbr] of Object.entries(abbreviations)) {
      result = result.replace(new RegExp(phrase, 'gi'), abbr);
    }
    return result;
  }

  private removeFillerWords(text: string): string {
    const fillers = ['basically', 'actually', 'literally', 'very', 'really', 'just', 'quite'];
    let result = text;
    
    fillers.forEach(filler => {
      result = result.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '');
    });

    return this.removeRedundantWhitespace(result);
  }

  private truncateToTokenLimit(text: string, limit: number, tokenCounter: TokenCounter): string {
    const words = text.split(/\s+/);
    let truncated = '';
    
    for (const word of words) {
      const test = truncated + ' ' + word;
      if (tokenCounter.count(test) > limit) {
        break;
      }
      truncated = test;
    }

    return truncated.trim() + '...';
  }

  private addStructure(text: string): string {
    // Add markdown headers if not present
    if (!text.includes('#')) {
      return `## Context\n\n${text}`;
    }
    return text;
  }

  private addExamples(text: string): string {
    // Add example section if space allows
    return text + '\n\n### Examples\n- Example 1\n- Example 2';
  }
}

// ============================================
// CONTEXT ENGINEER (Main Class)
// ============================================

export class ContextEngineer {
  private tokenCounter: TokenCounter;
  private prioritizer: ContextPrioritizer;
  private compressor: ContextCompressor;

  constructor() {
    this.tokenCounter = new TokenCounter();
    this.prioritizer = new ContextPrioritizer();
    this.compressor = new ContextCompressor();
  }

  /**
   * Engineer context for optimal AI performance
   */
  engineerContext(
    task: string,
    userContext: UserContext,
    workflowSteps: WorkflowStep[],
    modelConfig: ModelConfig
  ): EngineeredContext {
    // Calculate token budget
    const budget = this.calculateTokenBudget(modelConfig);

    // Gather all context items
    const contextItems = this.gatherContextItems(userContext, workflowSteps);

    // Prioritize items
    const prioritized = this.prioritizer.prioritize(contextItems, task, this.tokenCounter);

    // Optimize for budget
    const optimized = this.optimizeForBudget(prioritized, budget, task);

    return optimized;
  }

  /**
   * Calculate token budget allocation
   */
  private calculateTokenBudget(modelConfig: ModelConfig): TokenBudget {
    const total = modelConfig.maxTokens || 4000;
    
    // Reserve tokens for response
    const responseReserve = Math.floor(total * 0.4); // 40% for response
    const available = total - responseReserve;

    return {
      total,
      used: 0,
      remaining: available,
      allocation: {
        systemPrompt: Math.floor(available * 0.2),   // 20% for system prompt
        userContext: Math.floor(available * 0.3),     // 30% for user context
        workflowSteps: Math.floor(available * 0.3),   // 30% for workflow steps
        examples: Math.floor(available * 0.1),        // 10% for examples
        buffer: Math.floor(available * 0.1)           // 10% buffer
      }
    };
  }

  /**
   * Gather all context items
   */
  private gatherContextItems(
    userContext: UserContext,
    workflowSteps: WorkflowStep[]
  ): Array<{ item: string; content: string }> {
    const items: Array<{ item: string; content: string }> = [];

    // User context items
    if (userContext.project) {
      items.push({ item: 'project', content: userContext.project });
    }
    if (userContext.techStack) {
      items.push({ item: 'techStack', content: userContext.techStack });
    }
    if (userContext.audience) {
      items.push({ item: 'audience', content: userContext.audience });
    }
    if (userContext.style) {
      items.push({ item: 'style', content: userContext.style });
    }
    if (userContext.constraints.length > 0) {
      items.push({ item: 'constraints', content: userContext.constraints.join(', ') });
    }

    // Workflow steps
    workflowSteps.forEach((step, index) => {
      items.push({
        item: `step_${index + 1}`,
        content: `${step.role}: ${step.description}`
      });
    });

    return items;
  }

  /**
   * Optimize context to fit within budget
   */
  private optimizeForBudget(
    prioritized: ContextPriority[],
    budget: TokenBudget,
    task: string
  ): EngineeredContext {
    let optimizedContent = '';
    let totalTokens = 0;
    let itemsIncluded = 0;
    let itemsExcluded = 0;

    // Add task first (always included)
    optimizedContent += `## Task\n${task}\n\n`;
    totalTokens += this.tokenCounter.count(task);

    // Add context items by priority
    for (const item of prioritized) {
      const itemTokens = item.tokenCount;
      
      if (totalTokens + itemTokens <= budget.allocation.userContext + budget.allocation.workflowSteps) {
        // Include full item
        optimizedContent += `### ${item.item}\n${item.content}\n\n`;
        totalTokens += itemTokens;
        itemsIncluded++;
      } else if (item.priority === 'critical' || item.priority === 'high') {
        // Compress critical/high priority items to fit
        const availableTokens = budget.remaining - totalTokens;
        if (availableTokens > 50) {
          const compressed = this.compressor.compress(
            item.content,
            availableTokens,
            this.tokenCounter
          );
          optimizedContent += `### ${item.item}\n${compressed}\n\n`;
          totalTokens += this.tokenCounter.count(compressed);
          itemsIncluded++;
        } else {
          itemsExcluded++;
        }
      } else {
        itemsExcluded++;
      }
    }

    const originalTokens = prioritized.reduce((sum, item) => sum + item.tokenCount, 0);
    const compressionRatio = totalTokens / originalTokens;
    const efficiency = itemsIncluded / (itemsIncluded + itemsExcluded);

    return {
      optimized: optimizedContent.trim(),
      tokenCount: totalTokens,
      compressionRatio,
      itemsIncluded,
      itemsExcluded,
      efficiency
    };
  }

  /**
   * Estimate token usage for a workflow
   */
  estimateTokenUsage(
    userContext: UserContext,
    workflowSteps: WorkflowStep[],
    modelConfig: ModelConfig
  ): {
    estimated: number;
    budget: number;
    withinBudget: boolean;
    utilizationPercentage: number;
  } {
    const contextItems = this.gatherContextItems(userContext, workflowSteps);
    const estimated = contextItems.reduce(
      (sum, item) => sum + this.tokenCounter.count(item.content),
      0
    );
    const budget = modelConfig.maxTokens || 4000;
    const withinBudget = estimated <= budget * 0.6; // 60% threshold
    const utilizationPercentage = (estimated / budget) * 100;

    return {
      estimated,
      budget,
      withinBudget,
      utilizationPercentage
    };
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(
    engineeredContext: EngineeredContext
  ): string[] {
    const suggestions: string[] = [];

    if (engineeredContext.compressionRatio < 0.5) {
      suggestions.push('High compression ratio - consider simplifying context');
    }

    if (engineeredContext.efficiency < 0.7) {
      suggestions.push('Low efficiency - many items excluded, consider increasing token budget');
    }

    if (engineeredContext.itemsExcluded > engineeredContext.itemsIncluded) {
      suggestions.push('More items excluded than included - prioritize critical information');
    }

    if (engineeredContext.tokenCount < 100) {
      suggestions.push('Very low token usage - consider adding more context for better results');
    }

    return suggestions;
  }
}

// Export singleton instance
export const contextEngineer = new ContextEngineer();
