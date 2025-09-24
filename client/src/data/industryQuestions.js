/**
 * Comprehensive Industry-Specific Question Database
 * Contains extensive question sets for different roles with multiple difficulty levels
 */

export const INDUSTRY_QUESTION_BANK = {
  frontend: {
    easy: [
      {
        id: 'fe_easy_1',
        type: 'mcq',
        question: 'What does HTML stand for?',
        options: [
          'Hyper Text Markup Language',
          'High Tech Modern Language',
          'Home Tool Markup Language',
          'Hyperlink and Text Markup Language'
        ],
        correct: 0,
        explanation: 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.',
        category: 'HTML Basics'
      },
      {
        id: 'fe_easy_2',
        type: 'mcq',
        question: 'Which CSS property is used to change the text color?',
        options: ['font-color', 'text-color', 'color', 'foreground-color'],
        correct: 2,
        explanation: 'The "color" property in CSS is used to set the color of text.',
        category: 'CSS Basics'
      },
      {
        id: 'fe_easy_3',
        type: 'mcq',
        question: 'What is the correct way to create a function in JavaScript?',
        options: [
          'function = myFunction() {}',
          'function myFunction() {}',
          'create myFunction() {}',
          'def myFunction() {}'
        ],
        correct: 1,
        explanation: 'The correct syntax for creating a function in JavaScript is "function functionName() {}".',
        category: 'JavaScript Basics'
      }
    ],
    medium: [
      {
        id: 'fe_medium_1',
        type: 'mcq',
        question: 'What is the purpose of React.memo()?',
        options: [
          'To memoize component state',
          'To prevent unnecessary re-renders of functional components',
          'To cache API responses',
          'To optimize bundle size'
        ],
        correct: 1,
        explanation: 'React.memo() is a higher-order component that prevents unnecessary re-renders by memoizing the component result.',
        category: 'React Performance'
      },
      {
        id: 'fe_medium_2',
        type: 'mcq',
        question: 'Which hook is used for side effects in React?',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correct: 1,
        explanation: 'useEffect is used for performing side effects in functional components, such as data fetching, subscriptions, or DOM manipulation.',
        category: 'React Hooks'
      },
      {
        id: 'fe_medium_3',
        type: 'mcq',
        question: 'What is the difference between "==" and "===" in JavaScript?',
        options: [
          'No difference',
          '== checks type, === checks value',
          '=== checks both type and value, == only checks value',
          '== is deprecated'
        ],
        correct: 2,
        explanation: '=== (strict equality) checks both type and value, while == (loose equality) performs type coercion before comparison.',
        category: 'JavaScript Fundamentals'
      }
    ],
    hard: [
      {
        id: 'fe_hard_1',
        type: 'coding',
        question: 'Implement a custom hook that debounces a value',
        template: 'import { useState, useEffect } from "react";\n\nfunction useDebounce(value, delay) {\n  // Your implementation here\n}\n\nexport default useDebounce;',
        solution: 'import { useState, useEffect } from "react";\n\nfunction useDebounce(value, delay) {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n\n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n\n    return () => {\n      clearTimeout(handler);\n    };\n  }, [value, delay]);\n\n  return debouncedValue;\n}\n\nexport default useDebounce;',
        testCases: [
          { input: { value: 'test', delay: 300 }, expected: 'debounced test after 300ms' }
        ],
        category: 'Custom Hooks'
      },
      {
        id: 'fe_hard_2',
        type: 'mcq',
        question: 'What is the purpose of the "key" prop in React lists?',
        options: [
          'To style list items',
          'To help React identify which items have changed, added, or removed',
          'To sort the list items',
          'To make list items clickable'
        ],
        correct: 1,
        explanation: 'The "key" prop helps React identify which items have changed, are added, or are removed, enabling efficient re-rendering of lists.',
        category: 'React Performance'
      }
    ]
  },
  
  backend: {
    easy: [
      {
        id: 'be_easy_1',
        type: 'mcq',
        question: 'What does API stand for?',
        options: [
          'Application Programming Interface',
          'Advanced Programming Interface',
          'Application Process Interface',
          'Automated Programming Interface'
        ],
        correct: 0,
        explanation: 'API stands for Application Programming Interface, which defines how different software components should interact.',
        category: 'API Basics'
      },
      {
        id: 'be_easy_2',
        type: 'mcq',
        question: 'Which HTTP method is used to retrieve data?',
        options: ['POST', 'GET', 'PUT', 'DELETE'],
        correct: 1,
        explanation: 'GET is the HTTP method used to retrieve data from a server.',
        category: 'HTTP Methods'
      },
      {
        id: 'be_easy_3',
        type: 'mcq',
        question: 'What is the default port for HTTP?',
        options: ['443', '8080', '80', '3000'],
        correct: 2,
        explanation: 'Port 80 is the default port for HTTP traffic.',
        category: 'Networking'
      }
    ],
    medium: [
      {
        id: 'be_medium_1',
        type: 'mcq',
        question: 'Which HTTP status code indicates a successful POST request that created a resource?',
        options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'],
        correct: 1,
        explanation: '201 Created indicates that the request was successful and a new resource was created.',
        category: 'HTTP Status Codes'
      },
      {
        id: 'be_medium_2',
        type: 'mcq',
        question: 'What is the purpose of middleware in Express.js?',
        options: [
          'To handle database connections',
          'To execute code during the request-response cycle',
          'To manage user authentication only',
          'To compress files'
        ],
        correct: 1,
        explanation: 'Middleware functions execute during the request-response cycle and can modify request/response objects or end the cycle.',
        category: 'Express.js'
      },
      {
        id: 'be_medium_3',
        type: 'mcq',
        question: 'What is the difference between SQL and NoSQL databases?',
        options: [
          'SQL is faster than NoSQL',
          'SQL uses structured data with schemas, NoSQL is more flexible',
          'NoSQL is only for small applications',
          'There is no difference'
        ],
        correct: 1,
        explanation: 'SQL databases use structured data with predefined schemas, while NoSQL databases offer more flexibility in data structure.',
        category: 'Databases'
      }
    ],
    hard: [
      {
        id: 'be_hard_1',
        type: 'system-design',
        question: 'Design a URL shortener service like bit.ly. Consider scalability, performance, and reliability.',
        requirements: [
          'Handle 100M URLs per day',
          'Read-heavy system (100:1 read/write ratio)',
          'Custom aliases support',
          'Analytics and click tracking',
          'High availability (99.9% uptime)'
        ],
        category: 'System Design',
        keyPoints: [
          'Database design (URL mapping)',
          'Caching strategy (Redis/Memcached)',
          'Load balancing',
          'Rate limiting',
          'Analytics pipeline'
        ]
      },
      {
        id: 'be_hard_2',
        type: 'coding',
        question: 'Implement a rate limiter using the token bucket algorithm',
        template: 'class TokenBucket {\n  constructor(capacity, refillRate) {\n    // Your implementation here\n  }\n\n  consume(tokens = 1) {\n    // Your implementation here\n  }\n\n  refill() {\n    // Your implementation here\n  }\n}',
        solution: 'class TokenBucket {\n  constructor(capacity, refillRate) {\n    this.capacity = capacity;\n    this.tokens = capacity;\n    this.refillRate = refillRate;\n    this.lastRefill = Date.now();\n  }\n\n  consume(tokens = 1) {\n    this.refill();\n    if (this.tokens >= tokens) {\n      this.tokens -= tokens;\n      return true;\n    }\n    return false;\n  }\n\n  refill() {\n    const now = Date.now();\n    const tokensToAdd = Math.floor((now - this.lastRefill) / 1000 * this.refillRate);\n    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);\n    this.lastRefill = now;\n  }\n}',
        category: 'Algorithms'
      }
    ]
  },
  
  fullstack: {
    easy: [
      {
        id: 'fs_easy_1',
        type: 'mcq',
        question: 'What is the purpose of version control systems like Git?',
        options: [
          'To compress files',
          'To track changes in code over time',
          'To run applications',
          'To design user interfaces'
        ],
        correct: 1,
        explanation: 'Version control systems track changes in code over time, allowing collaboration and history management.',
        category: 'Version Control'
      },
      {
        id: 'fs_easy_2',
        type: 'mcq',
        question: 'What does MVC stand for?',
        options: [
          'Model View Controller',
          'Multiple View Components',
          'Modern Visual Components',
          'Managed View Container'
        ],
        correct: 0,
        explanation: 'MVC stands for Model View Controller, a software architectural pattern.',
        category: 'Architecture Patterns'
      }
    ],
    medium: [
      {
        id: 'fs_medium_1',
        type: 'mcq',
        question: 'What is the main advantage of Server-Side Rendering (SSR)?',
        options: [
          'Faster client-side navigation',
          'Better SEO and initial page load performance',
          'Reduced server load',
          'Easier state management'
        ],
        correct: 1,
        explanation: 'SSR improves SEO by providing fully rendered HTML to search engines and improves initial page load performance.',
        category: 'Web Architecture'
      },
      {
        id: 'fs_medium_2',
        type: 'mcq',
        question: 'What is the purpose of JWT (JSON Web Tokens)?',
        options: [
          'To store large amounts of data',
          'To securely transmit information between parties',
          'To compress JSON data',
          'To validate HTML forms'
        ],
        correct: 1,
        explanation: 'JWT is used to securely transmit information between parties as a JSON object, commonly for authentication.',
        category: 'Authentication'
      }
    ],
    hard: [
      {
        id: 'fs_hard_1',
        type: 'system-design',
        question: 'Design a real-time chat application that can handle 1 million concurrent users.',
        requirements: [
          'Real-time messaging',
          'Group chats and private messages',
          'Message history and search',
          'File sharing capabilities',
          'Mobile and web support'
        ],
        category: 'System Design',
        keyPoints: [
          'WebSocket connections',
          'Message queuing (Redis/RabbitMQ)',
          'Database sharding',
          'CDN for file storage',
          'Load balancing strategies'
        ]
      }
    ]
  },
  
  devops: {
    easy: [
      {
        id: 'do_easy_1',
        type: 'mcq',
        question: 'What does CI/CD stand for?',
        options: [
          'Continuous Integration/Continuous Deployment',
          'Code Integration/Code Deployment',
          'Container Integration/Container Deployment',
          'Continuous Installation/Continuous Development'
        ],
        correct: 0,
        explanation: 'CI/CD stands for Continuous Integration/Continuous Deployment, practices that automate software delivery.',
        category: 'CI/CD Basics'
      },
      {
        id: 'do_easy_2',
        type: 'mcq',
        question: 'What is the primary purpose of Docker containers?',
        options: [
          'Virtual machine replacement',
          'Application packaging and isolation',
          'Network security',
          'Database management'
        ],
        correct: 1,
        explanation: 'Docker containers package applications with their dependencies for consistent deployment across environments.',
        category: 'Containerization'
      }
    ],
    medium: [
      {
        id: 'do_medium_1',
        type: 'mcq',
        question: 'What is the difference between Docker and Kubernetes?',
        options: [
          'Docker is for development, Kubernetes for production',
          'Docker containerizes applications, Kubernetes orchestrates containers',
          'Kubernetes is faster than Docker',
          'They serve the same purpose'
        ],
        correct: 1,
        explanation: 'Docker is a containerization platform, while Kubernetes is a container orchestration system that manages Docker containers.',
        category: 'Container Orchestration'
      },
      {
        id: 'do_medium_2',
        type: 'mcq',
        question: 'What is Infrastructure as Code (IaC)?',
        options: [
          'Writing code for applications',
          'Managing infrastructure through code and automation',
          'Coding on cloud platforms',
          'Infrastructure monitoring tools'
        ],
        correct: 1,
        explanation: 'IaC is the practice of managing and provisioning infrastructure through code rather than manual processes.',
        category: 'Infrastructure Management'
      }
    ],
    hard: [
      {
        id: 'do_hard_1',
        type: 'system-design',
        question: 'Design a CI/CD pipeline for a microservices architecture with automated testing, security scanning, and blue-green deployment.',
        requirements: [
          'Automated testing at multiple levels',
          'Security vulnerability scanning',
          'Blue-green deployment strategy',
          'Rollback capabilities',
          'Multi-environment support (dev, staging, prod)'
        ],
        category: 'CI/CD Design',
        keyPoints: [
          'Pipeline stages and gates',
          'Testing strategies',
          'Security integration',
          'Deployment automation',
          'Monitoring and alerting'
        ]
      }
    ]
  },
  
  datascience: {
    easy: [
      {
        id: 'ds_easy_1',
        type: 'mcq',
        question: 'What is the difference between supervised and unsupervised learning?',
        options: [
          'Supervised uses labeled data, unsupervised uses unlabeled data',
          'Supervised is faster than unsupervised',
          'Unsupervised is more accurate',
          'There is no difference'
        ],
        correct: 0,
        explanation: 'Supervised learning uses labeled training data, while unsupervised learning finds patterns in unlabeled data.',
        category: 'Machine Learning Basics'
      },
      {
        id: 'ds_easy_2',
        type: 'mcq',
        question: 'What is a DataFrame in pandas?',
        options: [
          'A type of chart',
          'A 2-dimensional labeled data structure',
          'A machine learning algorithm',
          'A database connection'
        ],
        correct: 1,
        explanation: 'A DataFrame is a 2-dimensional labeled data structure with columns of potentially different types.',
        category: 'Data Manipulation'
      }
    ],
    medium: [
      {
        id: 'ds_medium_1',
        type: 'mcq',
        question: 'What is the purpose of cross-validation in machine learning?',
        options: [
          'To increase model accuracy',
          'To assess model performance and prevent overfitting',
          'To reduce training time',
          'To clean the dataset'
        ],
        correct: 1,
        explanation: 'Cross-validation helps assess how well a model generalizes to unseen data and prevents overfitting.',
        category: 'Model Validation'
      },
      {
        id: 'ds_medium_2',
        type: 'mcq',
        question: 'What is the bias-variance tradeoff?',
        options: [
          'A method to clean data',
          'The tradeoff between model complexity and generalization',
          'A type of neural network',
          'A statistical test'
        ],
        correct: 1,
        explanation: 'The bias-variance tradeoff describes the relationship between model complexity, underfitting (high bias), and overfitting (high variance).',
        category: 'Model Theory'
      }
    ],
    hard: [
      {
        id: 'ds_hard_1',
        type: 'coding',
        question: 'Implement a simple linear regression from scratch using gradient descent',
        template: 'import numpy as np\n\nclass LinearRegression:\n    def __init__(self, learning_rate=0.01, n_iterations=1000):\n        # Your implementation here\n        pass\n    \n    def fit(self, X, y):\n        # Your implementation here\n        pass\n    \n    def predict(self, X):\n        # Your implementation here\n        pass',
        solution: 'import numpy as np\n\nclass LinearRegression:\n    def __init__(self, learning_rate=0.01, n_iterations=1000):\n        self.learning_rate = learning_rate\n        self.n_iterations = n_iterations\n        self.weights = None\n        self.bias = None\n    \n    def fit(self, X, y):\n        n_samples, n_features = X.shape\n        self.weights = np.zeros(n_features)\n        self.bias = 0\n        \n        for i in range(self.n_iterations):\n            y_predicted = np.dot(X, self.weights) + self.bias\n            \n            dw = (1 / n_samples) * np.dot(X.T, (y_predicted - y))\n            db = (1 / n_samples) * np.sum(y_predicted - y)\n            \n            self.weights -= self.learning_rate * dw\n            self.bias -= self.learning_rate * db\n    \n    def predict(self, X):\n        return np.dot(X, self.weights) + self.bias',
        category: 'Machine Learning Implementation'
      }
    ]
  },
  
  mobile: {
    easy: [
      {
        id: 'mb_easy_1',
        type: 'mcq',
        question: 'What is React Native?',
        options: [
          'A web framework',
          'A mobile app development framework',
          'A database system',
          'A testing tool'
        ],
        correct: 1,
        explanation: 'React Native is a framework for building mobile applications using React and JavaScript.',
        category: 'Mobile Frameworks'
      },
      {
        id: 'mb_easy_2',
        type: 'mcq',
        question: 'What are the two main mobile platforms?',
        options: [
          'Windows and Linux',
          'iOS and Android',
          'React and Vue',
          'Swift and Kotlin'
        ],
        correct: 1,
        explanation: 'iOS and Android are the two dominant mobile operating systems.',
        category: 'Mobile Platforms'
      }
    ],
    medium: [
      {
        id: 'mb_medium_1',
        type: 'mcq',
        question: 'What is the main advantage of React Native over native development?',
        options: [
          'Better performance',
          'Code reusability across platforms',
          'Access to all native APIs',
          'Smaller app size'
        ],
        correct: 1,
        explanation: 'React Native allows developers to write code once and deploy to both iOS and Android platforms.',
        category: 'Cross-Platform Development'
      },
      {
        id: 'mb_medium_2',
        type: 'mcq',
        question: 'What is the purpose of AsyncStorage in React Native?',
        options: [
          'To handle network requests',
          'To store data locally on the device',
          'To manage component state',
          'To handle navigation'
        ],
        correct: 1,
        explanation: 'AsyncStorage is used for persistent, local storage of data on mobile devices.',
        category: 'Data Storage'
      }
    ],
    hard: [
      {
        id: 'mb_hard_1',
        type: 'system-design',
        question: 'Design a mobile app architecture for a social media platform with offline capabilities.',
        requirements: [
          'Offline-first approach',
          'Real-time messaging',
          'Image and video sharing',
          'Push notifications',
          'Cross-platform compatibility'
        ],
        category: 'Mobile Architecture',
        keyPoints: [
          'Local database (SQLite/Realm)',
          'Sync strategies',
          'Caching mechanisms',
          'Background processing',
          'Performance optimization'
        ]
      }
    ]
  }
};

// Helper function to get questions for a specific role and difficulty
export const getQuestionsByRole = (role, difficulty = null, count = null) => {
  const roleQuestions = INDUSTRY_QUESTION_BANK[role];
  if (!roleQuestions) return [];
  
  let questions = [];
  
  if (difficulty) {
    questions = roleQuestions[difficulty] || [];
  } else {
    // Mix questions from all difficulties
    questions = [
      ...(roleQuestions.easy || []),
      ...(roleQuestions.medium || []),
      ...(roleQuestions.hard || [])
    ];
  }
  
  // Shuffle questions
  questions = questions.sort(() => Math.random() - 0.5);
  
  // Return specified count or all questions
  return count ? questions.slice(0, count) : questions;
};

// Helper function to get mixed difficulty questions for a role
export const getMixedQuestions = (role, easyCount = 5, mediumCount = 10, hardCount = 5) => {
  const roleQuestions = INDUSTRY_QUESTION_BANK[role];
  if (!roleQuestions) return [];
  
  const easy = (roleQuestions.easy || []).sort(() => Math.random() - 0.5).slice(0, easyCount);
  const medium = (roleQuestions.medium || []).sort(() => Math.random() - 0.5).slice(0, mediumCount);
  const hard = (roleQuestions.hard || []).sort(() => Math.random() - 0.5).slice(0, hardCount);
  
  return [...easy, ...medium, ...hard].sort(() => Math.random() - 0.5);
};

// Helper function to get question statistics
export const getQuestionStats = (role) => {
  const roleQuestions = INDUSTRY_QUESTION_BANK[role];
  if (!roleQuestions) return { total: 0, easy: 0, medium: 0, hard: 0 };
  
  const easy = (roleQuestions.easy || []).length;
  const medium = (roleQuestions.medium || []).length;
  const hard = (roleQuestions.hard || []).length;
  
  return {
    total: easy + medium + hard,
    easy,
    medium,
    hard
  };
};

export default INDUSTRY_QUESTION_BANK;