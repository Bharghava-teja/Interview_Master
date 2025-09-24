import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, BarChart3, Info, Target, TrendingUp, Shield, Brain, Zap, Activity } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ToastNotification } from './ToastNotification';

const ResumeEvaluation = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const handleFileSelect = useCallback((selectedFile) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(selectedFile.type)) {
      showToast('Please upload a PDF, Word document, or text file', 'error');
      return;
    }

    if (selectedFile.size > maxSize) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    setFile(selectedFile);
    setEvaluation(null);
  }, [showToast]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const token = localStorage.getItem('token');
      
      // Use test endpoint if no token available
      const endpoint = token ? '/api/v1/resumes/upload' : '/api/v1/resumes/test-upload';
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'This resume has already been uploaded');
        }
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setEvaluation(result.data);
      showToast('Resume analyzed successfully!', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.message || 'Failed to analyze resume. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const ScoreCard = ({ title, score, description, tooltip, icon: Icon }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    return (
      <Card className={`p-4 ${getScoreBgColor(score)} relative transition-all hover:shadow-lg`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-gray-600" />}
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <div 
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              {showTooltip && tooltip && (
                <div className="absolute z-10 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg -top-2 left-6 transform -translate-y-full">
                  <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  {tooltip}
                </div>
              )}
            </div>
          </div>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
        </div>
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Evaluation</h1>
        <p className="text-gray-600">Get AI-powered feedback on your resume with detailed analysis and improvement suggestions</p>
      </div>

      {/* File Upload Section */}
      <Card className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {file ? (
            <div className="space-y-4">
              <FileText className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <p className="text-lg font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={uploadAndAnalyze}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  {uploading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  {uploading ? 'Analyzing...' : 'Analyze Resume'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setEvaluation(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">Upload your resume</p>
                <p className="text-sm text-gray-500">Drag and drop or click to select</p>
                <p className="text-xs text-gray-400 mt-2">Supports PDF, DOC, DOCX, TXT (max 5MB)</p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Evaluation Results */}
      {evaluation && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">ATS Compatibility Score</h2>
              <div className="relative inline-block">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke={(evaluation?.evaluation?.overallScore || 0) >= 80 ? '#10b981' : (evaluation?.evaluation?.overallScore || 0) >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${((evaluation?.evaluation?.overallScore || 0) / 100) * 314} 314`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreColor(evaluation?.evaluation?.overallScore || 0)}`}>
                    {evaluation?.evaluation?.overallScore || 0}%
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-lg font-semibold text-gray-800">{evaluation?.evaluation?.category || 'Analysis Pending'}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {(evaluation?.evaluation?.overallScore || 0) >= 80 ? 'Excellent! Your resume is highly optimized for ATS systems.' :
                   (evaluation?.evaluation?.overallScore || 0) >= 60 ? 'Good foundation with room for improvement.' :
                   'Significant improvements needed for better ATS compatibility.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Score Breakdown */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Score Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ScoreCard
                title="ATS Compatibility"
                score={evaluation?.evaluation?.atsCompatibility?.score || 0}
                description="How well your resume works with applicant tracking systems"
                icon={Shield}
                tooltip="ATS systems scan for specific formatting, keywords, and structure. This score reflects how easily an ATS can parse and rank your resume."
              />
              <ScoreCard
                title="Content Quality"
                score={evaluation?.evaluation?.content?.score || 0}
                description="Quality and relevance of your resume content"
                icon={FileText}
                tooltip="Evaluates the relevance, clarity, and impact of your work experience, achievements, and overall content quality."
              />
              <ScoreCard
                title="Skills Match"
                score={evaluation?.evaluation?.skills?.score || 0}
                description="How well your skills align with industry standards"
                icon={Target}
                tooltip="Analyzes how well your listed skills match current industry demands and job market trends."
              />
              <ScoreCard
                title="Formatting"
                score={evaluation?.evaluation?.formatting?.score || 0}
                description="Visual appeal and structure of your resume"
                icon={TrendingUp}
                tooltip="Assesses the visual hierarchy, readability, and professional appearance of your resume layout."
              />
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {(evaluation?.evaluation?.feedback?.strengths || []).map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Areas for Improvement */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {(evaluation?.evaluation?.feedback?.improvements || []).map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Action Items */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(evaluation?.evaluation?.feedback?.actionItems || []).map((action, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">{action.category}</h4>
                  <p className="text-sm text-blue-700 mb-2">{action.description}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    action.priority === 'high' ? 'bg-red-100 text-red-800' :
                    action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {action.priority} priority
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* ML Analysis */}
          {evaluation?.feedback?.mlAnalysis && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI-Powered Analysis
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ML Confidence Score */}
                <div className="text-center">
                  <div className="relative inline-block mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="30" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                      <circle
                        cx="40" cy="40" r="30"
                        stroke="#8b5cf6"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${((evaluation?.feedback?.mlAnalysis?.confidenceScore || 0) / 100) * 188} 188`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-600">
                        {evaluation?.feedback?.mlAnalysis?.confidenceScore || 0}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">ML Confidence</p>
                  <p className="text-xs text-gray-500">AI analysis reliability</p>
                </div>

                {/* Sentiment Analysis */}
                <div className="text-center">
                  <div className="mb-3">
                    <Activity className={`h-8 w-8 mx-auto ${
                      evaluation?.feedback?.mlAnalysis?.sentimentAnalysis?.tone === 'positive' ? 'text-green-500' :
                      evaluation?.feedback?.mlAnalysis?.sentimentAnalysis?.tone === 'negative' ? 'text-red-500' :
                      'text-yellow-500'
                    }`} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 capitalize">
                    {evaluation?.feedback?.mlAnalysis?.sentimentAnalysis?.tone || 'neutral'} Tone
                  </p>
                  <p className="text-xs text-gray-500">
                    {evaluation?.feedback?.mlAnalysis?.sentimentAnalysis?.confidence || 0}% confidence
                  </p>
                </div>

                {/* Skill Matching */}
                <div className="text-center">
                  <div className="mb-3">
                    <Target className="h-8 w-8 mx-auto text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {evaluation?.feedback?.mlAnalysis?.skillMatching?.matchPercentage || 0}% Skill Match
                  </p>
                  <p className="text-xs text-gray-500">Industry alignment</p>
                </div>
              </div>

              {/* ML Insights */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Content Quality Insights */}
                <div className="p-4 bg-white rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Content Quality
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quality Score:</span>
                      <span className="font-medium">{evaluation?.feedback?.mlAnalysis?.contentQuality?.qualityScore || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Word Count:</span>
                      <span className="font-medium">{evaluation?.feedback?.mlAnalysis?.contentQuality?.wordCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantified Results:</span>
                      <span className="font-medium">{evaluation?.feedback?.mlAnalysis?.contentQuality?.quantifiableAchievements || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Language Complexity */}
                <div className="p-4 bg-white rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Language Analysis
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Readability:</span>
                      <span className="font-medium">{evaluation?.feedback?.mlAnalysis?.languageComplexity?.readabilityLevel || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Flesch Score:</span>
                      <span className="font-medium">{evaluation?.feedback?.mlAnalysis?.languageComplexity?.fleschScore || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Achievement Strength:</span>
                      <span className="font-medium">{evaluation?.feedback?.mlAnalysis?.achievementStrength?.strengthRatio || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ML Recommendations */}
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-3">AI Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(evaluation?.feedback?.mlAnalysis?.contentQuality?.recommendations || []).length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-purple-700 mb-2">Content Improvements</h5>
                      <ul className="space-y-1">
                        {(evaluation?.feedback?.mlAnalysis?.contentQuality?.recommendations || []).slice(0, 3).map((rec, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(evaluation?.feedback?.mlAnalysis?.skillMatching?.recommendations || []).length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-blue-700 mb-2">Skill Enhancements</h5>
                      <ul className="space-y-1">
                        {(evaluation?.feedback?.mlAnalysis?.skillMatching?.recommendations || []).slice(0, 3).map((rec, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                            <Target className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Found Skills */}
              {(evaluation?.feedback?.mlAnalysis?.skillMatching?.foundSkills || []).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">AI-Detected Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {(evaluation?.feedback?.mlAnalysis?.skillMatching?.foundSkills || []).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Gaps */}
              {(evaluation?.feedback?.mlAnalysis?.skillMatching?.skillGaps || []).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Skill Gaps to Address</h4>
                  <div className="flex flex-wrap gap-2">
                    {(evaluation?.feedback?.mlAnalysis?.skillMatching?.skillGaps || []).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Keywords Analysis */}
          {evaluation?.evaluation?.keywords && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Keywords Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Found Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {(evaluation?.evaluation?.keywords?.found || []).map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Missing Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {(evaluation?.evaluation?.keywords?.missing || []).map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ResumeEvaluation;