const natural = require('natural');
const { TfIdf, WordTokenizer, SentimentAnalyzer, PorterStemmer } = natural;

/**
 * ML-powered Resume Analysis Service
 * Provides advanced content analysis using natural language processing
 */
class MLResumeAnalysisService {
  constructor() {
    this.tokenizer = new WordTokenizer();
    this.analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
    this.tfidf = new TfIdf();
    
    // Industry-specific skill databases
    this.skillDatabases = {
      technology: [
        'javascript', 'python', 'java', 'react', 'node.js', 'angular', 'vue.js',
        'typescript', 'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql',
        'aws', 'azure', 'docker', 'kubernetes', 'git', 'ci/cd', 'devops',
        'machine learning', 'artificial intelligence', 'data science', 'tensorflow',
        'pytorch', 'scikit-learn', 'pandas', 'numpy', 'api', 'rest', 'graphql'
      ],
      marketing: [
        'seo', 'sem', 'social media', 'content marketing', 'email marketing',
        'google analytics', 'facebook ads', 'google ads', 'conversion optimization',
        'brand management', 'digital marketing', 'marketing automation', 'crm'
      ],
      finance: [
        'financial analysis', 'accounting', 'budgeting', 'forecasting', 'excel',
        'financial modeling', 'risk management', 'compliance', 'audit', 'taxation',
        'investment analysis', 'portfolio management', 'derivatives', 'bloomberg'
      ],
      healthcare: [
        'patient care', 'medical records', 'hipaa', 'clinical research',
        'healthcare administration', 'medical coding', 'pharmacy', 'nursing',
        'telemedicine', 'electronic health records', 'medical devices'
      ]
    };
    
    // Action verbs that indicate strong achievements
    this.strongActionVerbs = [
      'achieved', 'accomplished', 'delivered', 'implemented', 'developed',
      'created', 'designed', 'built', 'launched', 'optimized', 'improved',
      'increased', 'decreased', 'reduced', 'managed', 'led', 'directed',
      'coordinated', 'supervised', 'trained', 'mentored', 'established',
      'initiated', 'streamlined', 'automated', 'innovated', 'transformed'
    ];
    
    // Weak phrases that should be avoided
    this.weakPhrases = [
      'responsible for', 'duties included', 'worked on', 'helped with',
      'assisted in', 'participated in', 'involved in', 'familiar with'
    ];
  }

  /**
   * Perform comprehensive ML analysis on resume content
   * @param {string} resumeText - Extracted resume text
   * @param {Object} parsedData - Structured resume data
   * @param {string} targetIndustry - Target industry for analysis
   * @returns {Object} ML analysis results
   */
  analyzeResume(resumeText, parsedData, targetIndustry = 'technology') {
    const analysis = {
      sentimentAnalysis: this.analyzeSentiment(resumeText),
      skillMatching: this.analyzeSkillMatching(resumeText, targetIndustry),
      contentQuality: this.analyzeContentQuality(resumeText, parsedData),
      languageComplexity: this.analyzeLanguageComplexity(resumeText),
      achievementStrength: this.analyzeAchievementStrength(resumeText),
      keywordDensity: this.analyzeKeywordDensity(resumeText, targetIndustry),
      readabilityScore: this.calculateReadabilityScore(resumeText),
      confidenceScore: 0
    };
    
    // Calculate overall ML confidence score
    analysis.confidenceScore = this.calculateConfidenceScore(analysis);
    
    return analysis;
  }

  /**
   * Analyze sentiment and tone of resume content
   */
  analyzeSentiment(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentiments = [];
    
    sentences.forEach(sentence => {
      const tokens = this.tokenizer.tokenize(sentence.toLowerCase());
      const score = this.analyzer.getSentiment(tokens);
      sentiments.push(score);
    });
    
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    
    return {
      overallSentiment: avgSentiment,
      tone: avgSentiment > 0.1 ? 'positive' : avgSentiment < -0.1 ? 'negative' : 'neutral',
      confidence: Math.abs(avgSentiment),
      sentenceCount: sentences.length,
      recommendations: this.getSentimentRecommendations(avgSentiment)
    };
  }

  /**
   * Analyze skill matching against industry requirements
   */
  analyzeSkillMatching(text, industry) {
    const lowerText = text.toLowerCase();
    const industrySkills = this.skillDatabases[industry] || this.skillDatabases.technology;
    
    const foundSkills = [];
    const missingSkills = [];
    
    industrySkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });
    
    const matchPercentage = (foundSkills.length / industrySkills.length) * 100;
    
    return {
      matchPercentage: Math.round(matchPercentage),
      foundSkills,
      missingSkills: missingSkills.slice(0, 10), // Top 10 missing skills
      skillGaps: this.identifySkillGaps(foundSkills, industry),
      recommendations: this.getSkillRecommendations(foundSkills, missingSkills, industry)
    };
  }

  /**
   * Analyze overall content quality using various metrics
   */
  analyzeContentQuality(text, parsedData) {
    const metrics = {
      wordCount: text.split(/\s+/).length,
      uniqueWords: new Set(text.toLowerCase().split(/\s+/)).size,
      averageWordsPerSentence: this.calculateAverageWordsPerSentence(text),
      quantifiableAchievements: this.countQuantifiableAchievements(text),
      actionVerbUsage: this.analyzeActionVerbUsage(text),
      weakPhraseUsage: this.analyzeWeakPhraseUsage(text)
    };
    
    const qualityScore = this.calculateContentQualityScore(metrics);
    
    return {
      ...metrics,
      qualityScore,
      recommendations: this.getContentQualityRecommendations(metrics)
    };
  }

  /**
   * Analyze language complexity and readability
   */
  analyzeLanguageComplexity(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = this.calculateAverageSyllables(words);
    
    // Flesch Reading Ease Score
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    return {
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
      fleschScore: Math.round(fleschScore),
      readabilityLevel: this.getReadabilityLevel(fleschScore),
      recommendations: this.getComplexityRecommendations(fleschScore, avgWordsPerSentence)
    };
  }

  /**
   * Analyze strength of achievements and accomplishments
   */
  analyzeAchievementStrength(text) {
    const achievements = this.extractAchievements(text);
    const strongAchievements = achievements.filter(a => this.isStrongAchievement(a));
    
    return {
      totalAchievements: achievements.length,
      strongAchievements: strongAchievements.length,
      strengthRatio: achievements.length > 0 ? strongAchievements.length / achievements.length : 0,
      quantifiedAchievements: achievements.filter(a => this.hasQuantification(a)).length,
      recommendations: this.getAchievementRecommendations(achievements, strongAchievements)
    };
  }

  /**
   * Analyze keyword density for SEO and ATS optimization
   */
  analyzeKeywordDensity(text, industry) {
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    const keywordCounts = {};
    
    const industrySkills = this.skillDatabases[industry] || this.skillDatabases.technology;
    
    industrySkills.forEach(skill => {
      const skillWords = skill.toLowerCase().split(/\s+/);
      let count = 0;
      
      if (skillWords.length === 1) {
        count = words.filter(word => word === skillWords[0]).length;
      } else {
        // Multi-word skills
        const skillPhrase = skill.toLowerCase();
        const matches = text.toLowerCase().match(new RegExp(skillPhrase, 'g'));
        count = matches ? matches.length : 0;
      }
      
      if (count > 0) {
        keywordCounts[skill] = {
          count,
          density: (count / totalWords) * 100
        };
      }
    });
    
    return {
      keywordCounts,
      totalKeywords: Object.keys(keywordCounts).length,
      averageDensity: Object.values(keywordCounts).reduce((sum, kw) => sum + kw.density, 0) / Object.keys(keywordCounts).length || 0,
      recommendations: this.getKeywordRecommendations(keywordCounts)
    };
  }

  /**
   * Calculate overall readability score
   */
  calculateReadabilityScore(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);
    
    // Flesch-Kincaid Grade Level
    const gradeLevel = 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;
    
    return {
      gradeLevel: Math.max(0, Math.round(gradeLevel * 10) / 10),
      isOptimal: gradeLevel >= 8 && gradeLevel <= 12,
      recommendation: gradeLevel < 8 ? 'Consider using more sophisticated language' : 
                     gradeLevel > 12 ? 'Simplify language for better readability' : 
                     'Readability level is optimal'
    };
  }

  /**
   * Calculate overall ML confidence score
   */
  calculateConfidenceScore(analysis) {
    const weights = {
      sentimentAnalysis: 0.15,
      skillMatching: 0.25,
      contentQuality: 0.25,
      languageComplexity: 0.15,
      achievementStrength: 0.20
    };
    
    let totalScore = 0;
    
    // Sentiment score (0-100)
    totalScore += (Math.abs(analysis.sentimentAnalysis.overallSentiment) * 50 + 50) * weights.sentimentAnalysis;
    
    // Skill matching score
    totalScore += analysis.skillMatching.matchPercentage * weights.skillMatching;
    
    // Content quality score
    totalScore += analysis.contentQuality.qualityScore * weights.contentQuality;
    
    // Language complexity score (optimal range)
    const complexityScore = analysis.languageComplexity.fleschScore >= 30 && analysis.languageComplexity.fleschScore <= 70 ? 100 : 50;
    totalScore += complexityScore * weights.languageComplexity;
    
    // Achievement strength score
    totalScore += (analysis.achievementStrength.strengthRatio * 100) * weights.achievementStrength;
    
    return Math.round(totalScore);
  }

  // Helper methods
  getSentimentRecommendations(sentiment) {
    if (sentiment < -0.1) {
      return ['Use more positive language', 'Focus on achievements rather than responsibilities', 'Avoid negative words'];
    } else if (sentiment > 0.3) {
      return ['Maintain professional tone', 'Balance enthusiasm with professionalism'];
    }
    return ['Consider adding more dynamic action words', 'Highlight positive outcomes'];
  }

  getSkillRecommendations(foundSkills, missingSkills, industry) {
    const recommendations = [];
    
    if (foundSkills.length < 5) {
      recommendations.push('Add more relevant technical skills');
    }
    
    if (missingSkills.length > 0) {
      recommendations.push(`Consider adding: ${missingSkills.slice(0, 3).join(', ')}`);
    }
    
    return recommendations;
  }

  calculateContentQualityScore(metrics) {
    let score = 0;
    
    // Word count (optimal: 400-800 words)
    if (metrics.wordCount >= 400 && metrics.wordCount <= 800) score += 25;
    else if (metrics.wordCount >= 300) score += 15;
    
    // Quantifiable achievements
    score += Math.min(metrics.quantifiableAchievements * 10, 25);
    
    // Action verb usage
    score += Math.min(metrics.actionVerbUsage.strongVerbs * 5, 25);
    
    // Weak phrase penalty
    score -= metrics.weakPhraseUsage.count * 2;
    
    return Math.max(0, Math.min(100, score));
  }

  countQuantifiableAchievements(text) {
    const numberPattern = /\b\d+([.,]\d+)*\s*(%|percent|million|thousand|k|m|billion)\b/gi;
    const matches = text.match(numberPattern);
    return matches ? matches.length : 0;
  }

  analyzeActionVerbUsage(text) {
    const lowerText = text.toLowerCase();
    const strongVerbs = this.strongActionVerbs.filter(verb => lowerText.includes(verb));
    
    return {
      strongVerbs: strongVerbs.length,
      foundVerbs: strongVerbs,
      recommendations: strongVerbs.length < 5 ? ['Use more strong action verbs'] : []
    };
  }

  analyzeWeakPhraseUsage(text) {
    const lowerText = text.toLowerCase();
    const foundWeakPhrases = this.weakPhrases.filter(phrase => lowerText.includes(phrase));
    
    return {
      count: foundWeakPhrases.length,
      foundPhrases: foundWeakPhrases,
      recommendations: foundWeakPhrases.length > 0 ? ['Replace weak phrases with strong action verbs'] : []
    };
  }

  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  calculateAverageSyllables(words) {
    const totalSyllables = words.reduce((total, word) => total + this.countSyllables(word), 0);
    return totalSyllables / words.length;
  }

  getReadabilityLevel(fleschScore) {
    if (fleschScore >= 90) return 'Very Easy';
    if (fleschScore >= 80) return 'Easy';
    if (fleschScore >= 70) return 'Fairly Easy';
    if (fleschScore >= 60) return 'Standard';
    if (fleschScore >= 50) return 'Fairly Difficult';
    if (fleschScore >= 30) return 'Difficult';
    return 'Very Difficult';
  }

  extractAchievements(text) {
    // Simple achievement extraction based on bullet points and action verbs
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const achievements = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        achievements.push(trimmed);
      } else {
        // Check if line starts with action verb
        const firstWord = trimmed.split(' ')[0].toLowerCase();
        if (this.strongActionVerbs.includes(firstWord)) {
          achievements.push(trimmed);
        }
      }
    });
    
    return achievements;
  }

  isStrongAchievement(achievement) {
    const lowerAchievement = achievement.toLowerCase();
    return this.strongActionVerbs.some(verb => lowerAchievement.includes(verb)) &&
           this.hasQuantification(achievement);
  }

  hasQuantification(text) {
    const numberPattern = /\b\d+([.,]\d+)*\s*(%|percent|million|thousand|k|m|billion|dollars?|\$)\b/gi;
    return numberPattern.test(text);
  }

  identifySkillGaps(foundSkills, industry) {
    // Identify critical missing skills based on industry
    const criticalSkills = {
      technology: ['javascript', 'python', 'react', 'node.js', 'sql', 'git'],
      marketing: ['google analytics', 'seo', 'social media', 'content marketing'],
      finance: ['excel', 'financial analysis', 'accounting', 'budgeting'],
      healthcare: ['patient care', 'medical records', 'hipaa']
    };
    
    const critical = criticalSkills[industry] || criticalSkills.technology;
    return critical.filter(skill => !foundSkills.some(found => found.toLowerCase().includes(skill.toLowerCase())));
  }

  getContentQualityRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.wordCount < 300) {
      recommendations.push('Expand content - aim for 400-800 words');
    } else if (metrics.wordCount > 1000) {
      recommendations.push('Consider condensing content for better readability');
    }
    
    if (metrics.quantifiableAchievements < 3) {
      recommendations.push('Add more quantifiable achievements with numbers and percentages');
    }
    
    if (metrics.actionVerbUsage.strongVerbs < 5) {
      recommendations.push('Use more strong action verbs to describe accomplishments');
    }
    
    if (metrics.weakPhraseUsage.count > 0) {
      recommendations.push('Replace weak phrases like "responsible for" with strong action verbs');
    }
    
    return recommendations;
  }

  getComplexityRecommendations(fleschScore, avgWordsPerSentence) {
    const recommendations = [];
    
    if (fleschScore < 30) {
      recommendations.push('Simplify language and use shorter sentences');
    } else if (fleschScore > 80) {
      recommendations.push('Consider using more sophisticated vocabulary');
    }
    
    if (avgWordsPerSentence > 25) {
      recommendations.push('Break down long sentences for better readability');
    } else if (avgWordsPerSentence < 10) {
      recommendations.push('Consider combining short sentences for better flow');
    }
    
    return recommendations;
  }

  getAchievementRecommendations(achievements, strongAchievements) {
    const recommendations = [];
    
    if (achievements.length < 5) {
      recommendations.push('Add more specific achievements and accomplishments');
    }
    
    if (strongAchievements.length < achievements.length * 0.5) {
      recommendations.push('Strengthen achievements with action verbs and quantifiable results');
    }
    
    return recommendations;
  }

  getKeywordRecommendations(keywordCounts) {
    const recommendations = [];
    const totalKeywords = Object.keys(keywordCounts).length;
    
    if (totalKeywords < 5) {
      recommendations.push('Include more industry-relevant keywords');
    }
    
    const highDensityKeywords = Object.entries(keywordCounts)
      .filter(([_, data]) => data.density > 3)
      .map(([keyword, _]) => keyword);
    
    if (highDensityKeywords.length > 0) {
      recommendations.push(`Reduce keyword density for: ${highDensityKeywords.join(', ')}`);
    }
    
    return recommendations;
  }

  calculateAverageWordsPerSentence(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    return sentences.length > 0 ? words.length / sentences.length : 0;
  }
}

module.exports = MLResumeAnalysisService;