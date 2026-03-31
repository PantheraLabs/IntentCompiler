import type { UserContext } from './types';

// Intelligent Question-Asking System
export class IntelligentQuestioner {
  
  // Analyze what information is missing and generate questions
  static analyzeAndAskQuestions(intent: string, context: UserContext): {
    needsQuestions: boolean;
    questions: Question[];
    confidence: number;
  } {
    const questions: Question[] = [];
    let confidence = 1.0;
    
    // Check for missing critical information
    const missingInfo = this.detectMissingInfo(intent, context);
    
    // Generate questions for each missing piece
    for (const missing of missingInfo) {
      const question = this.generateQuestion(missing, intent, context);
      if (question) {
        questions.push(question);
        confidence -= 0.15; // Reduce confidence for each missing piece
      }
    }
    
    return {
      needsQuestions: questions.length > 0,
      questions,
      confidence: Math.max(confidence, 0.4)
    };
  }
  
  // Detect what information is missing
  private static detectMissingInfo(intent: string, context: UserContext): MissingInfo[] {
    const missing: MissingInfo[] = [];
    
    // Project name analysis
    if (!context.project || context.project.length < 3) {
      missing.push({
        type: 'project_name',
        severity: 'high',
        canInfer: this.canInferProjectName(intent),
        inferred: this.canInferProjectName(intent) ? this.inferProjectName(intent) : undefined
      });
    }
    
    // Tech stack analysis
    if (!context.techStack || context.techStack.length < 5) {
      missing.push({
        type: 'tech_stack',
        severity: 'high',
        canInfer: this.canInferTechStack(intent),
        inferred: this.canInferTechStack(intent) ? this.inferTechStack(intent) : undefined
      });
    }
    
    // Audience analysis
    if (!context.audience || context.audience.length < 3) {
      missing.push({
        type: 'audience',
        severity: 'medium',
        canInfer: this.canInferAudience(intent),
        inferred: this.canInferAudience(intent) ? this.inferAudience(intent) : undefined
      });
    }
    
    // Project type/complexity analysis
    if (!this.hasProjectType(intent, context)) {
      missing.push({
        type: 'project_type',
        severity: 'medium',
        canInfer: true,
        inferred: this.inferProjectType(intent)
      });
    }
    
    // Specific requirements analysis
    if (this.needsMoreSpecifics(intent)) {
      missing.push({
        type: 'specific_requirements',
        severity: 'low',
        canInfer: false,
        inferred: undefined
      });
    }
    
    return missing;
  }
  
  // Generate intelligent questions based on missing info
  private static generateQuestion(missing: MissingInfo, intent: string, context: UserContext): Question | null {
    switch (missing.type) {
      case 'project_name':
        return this.generateProjectNameQuestion(missing, intent);
        
      case 'tech_stack':
        return this.generateTechStackQuestion(missing, intent);
        
      case 'audience':
        return this.generateAudienceQuestion(missing, intent);
        
      case 'project_type':
        return this.generateProjectTypeQuestion(missing, intent);
        
      case 'specific_requirements':
        return this.generateSpecificsQuestion(intent);
        
      default:
        return null;
    }
  }
  
  // Question generators
  private static generateProjectNameQuestion(missing: MissingInfo, intent: string): Question {
    if (missing.canInfer && missing.inferred) {
      return {
        id: 'project_name',
        type: 'confirmation',
        question: `I think your project is called "${missing.inferred}". Is this correct?`,
        options: [
          { value: missing.inferred, label: `Yes, it's "${missing.inferred}"` },
          { value: 'other', label: 'No, I\'ll provide a different name' }
        ],
        required: true,
        followUp: {
          other: 'What would you like to name your project?'
        }
      };
    }
    
    return {
      id: 'project_name',
      type: 'input',
      question: 'What would you like to name your project?',
      placeholder: 'e.g., Digital Portfolio, Task Manager, E-commerce Platform',
      required: true
    };
  }
  
  private static generateTechStackQuestion(missing: MissingInfo, intent: string): Question {
    if (missing.canInfer && missing.inferred) {
      return {
        id: 'tech_stack',
        type: 'confirmation',
        question: `Based on your intent, I recommend using: ${missing.inferred}. Does this work for you?`,
        options: [
          { value: missing.inferred, label: `Yes, ${missing.inferred} sounds good` },
          { value: 'frontend_only', label: 'I just need frontend' },
          { value: 'backend_only', label: 'I just need backend' },
          { value: 'other', label: 'I have different requirements' }
        ],
        required: true,
        followUp: {
          frontend_only: 'Which frontend technologies do you prefer?',
          backend_only: 'Which backend technologies do you prefer?',
          other: 'What technologies would you like to use?'
        }
      };
    }
    
    return {
      id: 'tech_stack',
      type: 'multiselect',
      question: 'What technologies would you like to use?',
      options: [
        { value: 'React', label: 'React (Frontend)' },
        { value: 'Vue', label: 'Vue (Frontend)' },
        { value: 'Angular', label: 'Angular (Frontend)' },
        { value: 'Node.js', label: 'Node.js (Backend)' },
        { value: 'Python', label: 'Python (Backend)' },
        { value: 'PostgreSQL', label: 'PostgreSQL (Database)' },
        { value: 'MongoDB', label: 'MongoDB (Database)' }
      ],
      required: true,
      minSelections: 2
    };
  }
  
  private static generateAudienceQuestion(missing: MissingInfo, intent: string): Question {
    if (missing.canInfer && missing.inferred) {
      return {
        id: 'audience',
        type: 'confirmation',
        question: `I think you're building this for: ${missing.inferred}. Is this right?`,
        options: [
          { value: missing.inferred, label: `Yes, for ${missing.inferred}` },
          { value: 'other', label: 'No, different audience' }
        ],
        required: true,
        followUp: {
          other: 'Who is the target audience for your project?'
        }
      };
    }
    
    return {
      id: 'audience',
      type: 'select',
      question: 'Who is the target audience for your project?',
      options: [
        { value: 'End Users', label: 'General End Users' },
        { value: 'Developers', label: 'Other Developers' },
        { value: 'Business Users', label: 'Business/Corporate Users' },
        { value: 'Students', label: 'Students/Educational' },
        { value: 'Internal Team', label: 'Internal Team Members' }
      ],
      required: true
    };
  }
  
  private static generateProjectTypeQuestion(missing: MissingInfo, intent: string): Question {
    const inferred = missing.inferred || 'Web Application';
    return {
      id: 'project_type',
      type: 'confirmation',
      question: `I see this as a "${inferred}" project. Does this sound right?`,
      options: [
        { value: inferred, label: `Yes, ${inferred} project` },
        { value: 'other', label: 'No, different type' }
      ],
      required: true,
      followUp: {
        other: 'What type of project is this?'
      }
    };
  }
  
  private static generateSpecificsQuestion(intent: string): Question {
    return {
      id: 'specific_requirements',
      type: 'textarea',
      question: 'Are there any specific features, requirements, or constraints I should know about?',
      placeholder: 'e.g., Must be mobile-friendly, need user authentication, integrate with payment system...',
      required: false
    };
  }
  
  // Inference methods
  private static canInferProjectName(intent: string): boolean {
    const patterns = [
      /build\s+(?:a\s+)?(.+?)(?:\s+app|\s+website|\s+platform|\s+system)/i,
      /create\s+(?:a\s+)?(.+?)(?:\s+app|\s+website|\s+platform|\s+system)/i,
      /develop\s+(?:a\s+)?(.+?)(?:\s+app|\s+website|\s+platform|\s+system)/i
    ];
    
    return patterns.some(pattern => pattern.test(intent));
  }
  
  private static inferProjectName(intent: string): string {
    const patterns = [
      /build\s+(?:a\s+)?(.+?)(?:\s+app|\s+website|\s+platform|\s+system)/i,
      /create\s+(?:a\s+)?(.+?)(?:\s+app|\s+website|\s+platform|\s+system)/i,
      /develop\s+(?:a\s+)?(.+?)(?:\s+app|\s+website|\s+platform|\s+system)/i
    ];
    
    for (const pattern of patterns) {
      const match = intent.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Untitled Project';
  }
  
  private static canInferTechStack(intent: string): boolean {
    const techKeywords = /\b(react|vue|angular|node|python|django|flask|express|mongodb|postgresql|mysql)\b/i;
    return techKeywords.test(intent);
  }
  
  private static inferTechStack(intent: string): string {
    const techMap: Record<string, string> = {
      'react': 'React, TypeScript, Node.js, PostgreSQL',
      'vue': 'Vue.js, JavaScript, Node.js, MongoDB',
      'angular': 'Angular, TypeScript, Node.js, PostgreSQL',
      'python': 'Python, Django, PostgreSQL, Redis',
      'node': 'Node.js, Express, MongoDB, React'
    };
    
    for (const [tech, stack] of Object.entries(techMap)) {
      if (intent.toLowerCase().includes(tech)) {
        return stack;
      }
    }
    
    return 'React, TypeScript, Node.js, PostgreSQL'; // Default modern stack
  }
  
  private static canInferAudience(intent: string): boolean {
    const audienceKeywords = /\b(portfolio|resume|blog|ecommerce|business|corporate|internal|team|developer|api)\b/i;
    return audienceKeywords.test(intent);
  }
  
  private static inferAudience(intent: string): string {
    const audienceMap: Record<string, string> = {
      'portfolio': 'End Users (potential employers, clients)',
      'resume': 'End Users (recruiters, hiring managers)',
      'blog': 'End Users (readers, subscribers)',
      'ecommerce': 'End Users (customers, shoppers)',
      'business': 'Business Users',
      'corporate': 'Business Users',
      'internal': 'Internal Team',
      'team': 'Internal Team',
      'developer': 'Developers',
      'api': 'Developers'
    };
    
    for (const [keyword, audience] of Object.entries(audienceMap)) {
      if (intent.toLowerCase().includes(keyword)) {
        return audience;
      }
    }
    
    return 'End Users'; // Default
  }
  
  private static hasProjectType(intent: string, context: UserContext): boolean {
    const typeKeywords = /\b(web|mobile|desktop|api|backend|frontend|full-stack)\b/i;
    return typeKeywords.test(intent) || context.project?.length > 5;
  }
  
  private static inferProjectType(intent: string): string {
    if (/\b(web|website|frontend)\b/i.test(intent)) return 'Web Application';
    if (/\b(mobile|ios|android)\b/i.test(intent)) return 'Mobile Application';
    if (/\b(api|backend)\b/i.test(intent)) return 'API/Backend Service';
    if (/\b(full-stack|complete)\b/i.test(intent)) return 'Full-Stack Application';
    if (/\b(desktop|electron)\b/i.test(intent)) return 'Desktop Application';
    
    return 'Web Application'; // Default
  }
  
  private static needsMoreSpecifics(intent: string): boolean {
    // If intent is very short or generic, ask for more specifics
    return intent.length < 30 || /\b(app|website|platform|system)\b/i.test(intent);
  }
}

// Export types
export interface Question {
  id: string;
  type: 'input' | 'select' | 'multiselect' | 'textarea' | 'confirmation';
  question: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  minSelections?: number;
  followUp?: { [key: string]: string };
}

export interface MissingInfo {
  type: 'project_name' | 'tech_stack' | 'audience' | 'project_type' | 'specific_requirements';
  severity: 'high' | 'medium' | 'low';
  canInfer: boolean;
  inferred?: string;
}
