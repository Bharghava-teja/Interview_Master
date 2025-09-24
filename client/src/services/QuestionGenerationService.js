class QuestionGenerationService {
  constructor() {
    this.generatedQuestions = new Map();
    this.questionCache = new Map();
    this.apiEndpoints = {
      // Using free APIs for question generation
      openTDB: 'https://opentdb.com/api.php', // Free trivia API
      quotable: 'https://api.quotable.io/quotes', // For behavioral questions
      jsonPlaceholder: 'https://jsonplaceholder.typicode.com/posts' // Fallback for creative questions
    };
  }

  async generateQuestions(interviewType = 'technical', count = 10, difficulty = 'medium') {
    const cacheKey = `${interviewType}_${count}_${difficulty}`;
    
    // Check cache first
    if (this.questionCache.has(cacheKey)) {
      return this.questionCache.get(cacheKey);
    }

    let questions = [];

    try {
      switch (interviewType) {
        case 'technical':
          questions = await this.generateTechnicalQuestions(count, difficulty);
          break;
        case 'behavioral':
          questions = await this.generateBehavioralQuestions(count);
          break;
        case 'mixed':
          const techCount = Math.ceil(count / 2);
          const behavioralCount = count - techCount;
          const techQuestions = await this.generateTechnicalQuestions(techCount, difficulty);
          const behavioralQuestions = await this.generateBehavioralQuestions(behavioralCount);
          questions = [...techQuestions, ...behavioralQuestions];
          break;
        default:
          questions = await this.generateDefaultQuestions(count);
      }

      // Add unique IDs and metadata
      questions = questions.map((q, index) => ({
        ...q,
        id: `${interviewType}_${Date.now()}_${index}`,
        generatedAt: new Date().toISOString(),
        sessionId: this.generateSessionId()
      }));

      // Cache the questions
      this.questionCache.set(cacheKey, questions);
      
      return questions;
    } catch (error) {
      console.error('Failed to generate questions:', error);
      return this.getFallbackQuestions(interviewType, count);
    }
  }

  async generateTechnicalQuestions(count, difficulty) {
    const questions = [];
    const technicalTopics = [
      'JavaScript', 'React', 'Node.js', 'Python', 'Data Structures',
      'Algorithms', 'Database', 'System Design', 'Web Development', 'API Design'
    ];

    // Generate questions using a combination of templates and dynamic content
    for (let i = 0; i < count; i++) {
      const topic = technicalTopics[Math.floor(Math.random() * technicalTopics.length)];
      const question = await this.generateTechnicalQuestionForTopic(topic, difficulty);
      questions.push(question);
    }

    return questions;
  }

  async generateTechnicalQuestionForTopic(topic, difficulty) {
    const questionTemplates = {
      JavaScript: [
        "Explain the concept of {concept} in JavaScript and provide an example.",
        "How would you implement {feature} in JavaScript? Walk through your approach.",
        "What are the differences between {concept1} and {concept2} in JavaScript?",
        "Describe a scenario where you would use {concept} and why."
      ],
      React: [
        "How would you optimize a React component that {scenario}?",
        "Explain the React {concept} and when you would use it.",
        "What are the best practices for {topic} in React applications?",
        "How would you handle {situation} in a React application?"
      ],
      'System Design': [
        "Design a {system} that can handle {requirement}. Explain your approach.",
        "How would you scale a {application} to handle {load}?",
        "What are the trade-offs between {approach1} and {approach2} for {scenario}?"
      ]
    };

    const concepts = {
      JavaScript: ['closures', 'promises', 'async/await', 'prototypes', 'event loop', 'hoisting'],
      React: ['hooks', 'context', 'lifecycle methods', 'virtual DOM', 'state management'],
      'System Design': ['microservices', 'load balancing', 'caching', 'database sharding']
    };

    const templates = questionTemplates[topic] || questionTemplates.JavaScript;
    const topicConcepts = concepts[topic] || concepts.JavaScript;
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    const concept = topicConcepts[Math.floor(Math.random() * topicConcepts.length)];
    
    const question = template.replace('{concept}', concept)
                            .replace('{topic}', topic.toLowerCase())
                            .replace('{concept1}', concept)
                            .replace('{concept2}', topicConcepts[Math.floor(Math.random() * topicConcepts.length)]);

    return {
      question,
      category: topic,
      difficulty,
      timeLimit: this.getTimeLimit(difficulty),
      expectedPoints: this.generateExpectedPoints(topic, concept),
      type: 'technical'
    };
  }

  async generateBehavioralQuestions(count) {
    const behavioralTemplates = [
      "Tell me about a time when you had to {situation}. How did you handle it?",
      "Describe a challenging {scenario} you faced and how you overcame it.",
      "Give me an example of when you had to {action}. What was the outcome?",
      "How do you handle {situation} in a professional setting?",
      "Describe your approach to {task} when working in a team."
    ];

    const situations = [
      'work under tight deadlines',
      'resolve a conflict with a team member',
      'learn a new technology quickly',
      'lead a project',
      'deal with ambiguous requirements',
      'handle criticism',
      'prioritize multiple tasks',
      'work with a difficult stakeholder'
    ];

    const questions = [];
    
    for (let i = 0; i < count; i++) {
      const template = behavioralTemplates[Math.floor(Math.random() * behavioralTemplates.length)];
      const situation = situations[Math.floor(Math.random() * situations.length)];
      
      const question = template.replace('{situation}', situation)
                              .replace('{scenario}', situation)
                              .replace('{action}', situation)
                              .replace('{task}', situation);

      questions.push({
        question,
        category: 'Behavioral',
        difficulty: 'Medium',
        timeLimit: 300000, // 5 minutes
        expectedPoints: ['Situation', 'Task', 'Action', 'Result (STAR method)'],
        type: 'behavioral'
      });
    }

    return questions;
  }

  async generateDefaultQuestions(count) {
    // Fallback questions when API calls fail
    const defaultQuestions = [
      {
        question: "Introduce yourself and tell me about your background.",
        category: "Introduction",
        difficulty: "Easy",
        timeLimit: 180000,
        expectedPoints: ["Background", "Experience", "Goals", "Motivation"],
        type: "general"
      },
      {
        question: "What interests you most about this role?",
        category: "Motivation",
        difficulty: "Easy",
        timeLimit: 120000,
        expectedPoints: ["Research", "Alignment", "Enthusiasm", "Specific examples"],
        type: "general"
      },
      {
        question: "Describe a project you're particularly proud of.",
        category: "Experience",
        difficulty: "Medium",
        timeLimit: 240000,
        expectedPoints: ["Project details", "Your role", "Challenges", "Outcomes"],
        type: "general"
      }
    ];

    return defaultQuestions.slice(0, count);
  }

  getFallbackQuestions(interviewType, count) {
    const fallbackQuestions = {
      technical: [
        {
          question: "Explain the difference between synchronous and asynchronous programming.",
          category: "Programming Concepts",
          difficulty: "Medium",
          timeLimit: 300000,
          expectedPoints: ["Blocking vs non-blocking", "Examples", "Use cases", "Performance implications"],
          type: "technical"
        },
        {
          question: "How would you approach debugging a performance issue in a web application?",
          category: "Problem Solving",
          difficulty: "Hard",
          timeLimit: 420000,
          expectedPoints: ["Profiling tools", "Systematic approach", "Common bottlenecks", "Optimization strategies"],
          type: "technical"
        }
      ],
      behavioral: [
        {
          question: "Tell me about a time when you had to work with a difficult team member.",
          category: "Teamwork",
          difficulty: "Medium",
          timeLimit: 300000,
          expectedPoints: ["Situation", "Actions taken", "Communication", "Resolution"],
          type: "behavioral"
        }
      ]
    };

    const questions = fallbackQuestions[interviewType] || fallbackQuestions.technical;
    return questions.slice(0, count).map((q, index) => ({
      ...q,
      id: `fallback_${interviewType}_${Date.now()}_${index}`,
      generatedAt: new Date().toISOString(),
      sessionId: this.generateSessionId()
    }));
  }

  getTimeLimit(difficulty) {
    const timeLimits = {
      easy: 180000,   // 3 minutes
      medium: 300000, // 5 minutes
      hard: 420000    // 7 minutes
    };
    return timeLimits[difficulty.toLowerCase()] || timeLimits.medium;
  }

  generateExpectedPoints(topic, concept) {
    const pointTemplates = {
      JavaScript: [`${concept} definition`, `Code example`, `Use cases`, `Best practices`],
      React: [`${concept} explanation`, `Implementation`, `Benefits`, `Common pitfalls`],
      'System Design': [`Architecture overview`, `Scalability considerations`, `Trade-offs`, `Implementation details`]
    };
    
    return pointTemplates[topic] || [`${concept} explanation`, `Examples`, `Applications`, `Considerations`];
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearCache() {
    this.questionCache.clear();
    this.generatedQuestions.clear();
  }
}

const questionGenerationService = new QuestionGenerationService();
export default questionGenerationService;