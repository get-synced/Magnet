'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const industries = [
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'HR',
  'Content Creation',
  'IT',
  'Customer Service',
  'Other'
];

const challenges = [
  'Too much manual work',
  'Slow workflows',
  'High operational costs',
  'Scalability issues',
  'Data entry and management',
  'Communication gaps',
  'Process inconsistencies',
  'Limited resources'
];

const tools = [
  'Google Drive',
  'Zapier',
  'Make.com',
  'Slack',
  'HubSpot',
  'Notion',
  'Microsoft Office',
  'Trello/Asana',
  'Other'
];

const continuationOptions = [
  'I know what I want to automate',
  'Guide me through the process',
  'Explain how automation works first'
];

export default function DiscoveryQuestions() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    industry: '',
    otherIndustry: '',
    challenges: [] as string[],
    tools: [] as string[],
    otherTools: [] as string[],
    continuation: ''
  });

  useEffect(() => {
    // Check if user is authenticated
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/');
      return;
    }
    setUserId(storedUserId);
  }, [router]);

  const handleChallengesChange = (challenge: string) => {
    setFormData(prev => {
      const challenges = prev.challenges.includes(challenge)
        ? prev.challenges.filter(c => c !== challenge)
        : prev.challenges.length < 3
        ? [...prev.challenges, challenge]
        : prev.challenges;
      return { ...prev, challenges };
    });
  };

  const handleToolsChange = (tool: string) => {
    setFormData(prev => {
      const updatedTools = prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool];
      
      // If removing "Other" option, clear otherTools
      if (tool === 'Other' && !updatedTools.includes('Other')) {
        return { ...prev, tools: updatedTools, otherTools: [] };
      }
      
      return { ...prev, tools: updatedTools };
    });
  };

  const handleOtherToolAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const newTool = e.currentTarget.value.trim();
      if (!formData.otherTools.includes(newTool)) {
        setFormData(prev => ({
          ...prev,
          otherTools: [...prev.otherTools, newTool]
        }));
      }
      e.currentTarget.value = '';
    }
  };

  const handleOtherToolRemove = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      otherTools: prev.otherTools.filter(t => t !== tool)
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('User not authenticated');
      router.push('/');
      return;
    }

    try {
      const response = await fetch('/api/discovery/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      toast.success('Information saved! Redirecting to chat...');

      // Store discovery data in localStorage for context
      localStorage.setItem('discoveryData', JSON.stringify(formData));

      // Redirect to chat interface
      setTimeout(() => {
        router.push('/chat');
      }, 1500);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.industry && 
          (formData.industry !== 'Other' || (formData.industry === 'Other' && formData.otherIndustry.trim()));
      case 2:
        return formData.challenges.length > 0;
      case 3:
        return formData.tools.length > 0 && 
          (!formData.tools.includes('Other') || 
           (formData.tools.includes('Other') && formData.otherTools.length > 0));
      case 4:
        return !!formData.continuation;
      default:
        return false;
    }
  };

  if (!userId) {
    return null; // Or a loading state
  }

  return (
    <main className="min-h-screen bg-transparent pt-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold metallic-text mb-4">
              Let's understand your needs
            </h1>
            <p className="text-gray-300 mb-4">
              Answer a few questions to help us provide better automation suggestions
            </p>
            <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step !== 4 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      step === currentStep
                        ? 'border-cyan-500 bg-cyan-500/20 text-white'
                        : step < currentStep
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/20 text-white/40'
                    }`}
                  >
                    {step < currentStep ? (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    ) : (
                      step
                    )}
                  </div>
                  {step !== 4 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-all duration-300 ${
                        step < currentStep
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-500'
                          : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass-effect rounded-xl p-6 sm:p-8 mt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Existing step content */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white mr-3">
                          1
                        </span>
                        Select your industry / job role
                      </h3>
                      <div className="space-y-3">
                        {industries.map(industry => (
                          <motion.div
                            key={industry}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <label className="option-box">
                              <input
                                type="radio"
                                name="industry"
                                value={industry}
                                checked={formData.industry === industry}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    industry: e.target.value,
                                    otherIndustry: ''
                                  }));
                                }}
                              />
                              <div className="content">
                                <div className="radio-display" />
                                <span className="text-white flex-1">{industry}</span>
                              </div>
                            </label>
                          </motion.div>
                        ))}
                        {formData.industry === 'Other' && (
                          <div className="ml-8 mt-2">
                            <input
                              type="text"
                              placeholder="Please specify your industry"
                              value={formData.otherIndustry}
                              onChange={e => setFormData(prev => ({
                                ...prev,
                                otherIndustry: e.target.value
                              }))}
                              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white mr-3">
                          2
                        </span>
                        What challenges are you facing? (Select up to 3)
                      </h3>
                      <div className="space-y-3">
                        {challenges.map(challenge => (
                          <motion.div
                            key={challenge}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <label className="option-box">
                              <input
                                type="checkbox"
                                checked={formData.challenges.includes(challenge)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  handleChallengesChange(challenge);
                                }}
                                disabled={
                                  !formData.challenges.includes(challenge) &&
                                  formData.challenges.length >= 3
                                }
                              />
                              <div className="content">
                                <div className="checkbox-display" />
                                <span className="text-white flex-1">{challenge}</span>
                              </div>
                            </label>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white mr-3">
                          3
                        </span>
                        What tools do you currently use?
                      </h3>
                      <div className="space-y-3">
                        {tools.map(tool => (
                          <motion.div
                            key={tool}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <label className="option-box">
                              <input
                                type="checkbox"
                                checked={formData.tools.includes(tool)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  handleToolsChange(tool);
                                }}
                              />
                              <div className="content">
                                <div className="checkbox-display" />
                                <span className="text-white flex-1">{tool}</span>
                              </div>
                            </label>
                          </motion.div>
                        ))}

                        {formData.tools.includes('Other') && (
                          <div className="ml-8 mt-4 space-y-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                placeholder="Type a tool name and press Enter"
                                onKeyDown={handleOtherToolAdd}
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 cursor-text"
                              />
                            </div>
                            {formData.otherTools.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {formData.otherTools.map(tool => (
                                  <div
                                    key={tool}
                                    className="flex items-center space-x-2 px-3 py-2 bg-white/10 rounded-lg"
                                  >
                                    <span className="text-sm text-white">{tool}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleOtherToolRemove(tool)}
                                      className="text-white/60 hover:text-white transition-colors"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white mr-3">
                          4
                        </span>
                        How would you like to proceed?
                      </h3>
                      <div className="space-y-3">
                        {continuationOptions.map(option => (
                          <motion.div
                            key={option}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <label className="option-box">
                              <input
                                type="radio"
                                name="continuation"
                                value={option}
                                checked={formData.continuation === option}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    continuation: e.target.value
                                  }));
                                }}
                              />
                              <div className="content">
                                <div className="radio-display" />
                                <span className="text-white flex-1">{option}</span>
                              </div>
                            </label>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                <motion.button
                  type="button"
                  onClick={handleBack}
                  initial={false}
                  animate={{
                    opacity: currentStep === 1 ? 0 : 1,
                    x: currentStep === 1 ? -20 : 0
                  }}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    currentStep === 1
                      ? 'pointer-events-none'
                      : 'bg-white/5 hover:bg-white/10 text-white cursor-pointer'
                  }`}
                >
                  Back
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  whileHover={isStepValid() ? { scale: 1.02 } : {}}
                  whileTap={isStepValid() ? { scale: 0.98 } : {}}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    isStepValid()
                      ? 'accent-border bg-white/5 hover:bg-white/10 cursor-pointer'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  {currentStep === 4 ? 'Start Chat' : 'Next'}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
} 