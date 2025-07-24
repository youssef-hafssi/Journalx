
import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProgressBar from '@/components/onboarding/ProgressBar';
import Step1 from '@/components/onboarding/Step1';
import Step2 from '@/components/onboarding/Step2';
import Step3 from '@/components/onboarding/Step3';
import { Button } from '@/components/ui/button';

const TOTAL_STEPS = 3;

const OnboardingPage = () => {
  const { isAuthenticated, isLoading, setIsNewUser } = useAuth();
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  // Check if user has already completed onboarding
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('journalx_onboarding_completed');
    if (onboardingCompleted === 'true') {
      // User has already completed onboarding, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Redirect to auth if not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      console.log('Onboarding complete:', selections);
      // Clear the new user flag since onboarding is complete
      setIsNewUser(false);
      // Store onboarding completion in localStorage to prevent re-showing
      localStorage.setItem('journalx_onboarding_completed', 'true');
      // Clear email verification flag if it exists
      localStorage.removeItem('journalx_email_verified_new_user');
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateSelections = (stepKey: string, value: any) => {
    setSelections(prev => ({ ...prev, [stepKey]: value }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 selections={selections.step1 || []} onSelectionChange={(val) => updateSelections('step1', val)} />;
      case 2:
        return <Step2 selections={selections.step2 || []} onSelectionChange={(val) => updateSelections('step2', val)} />;
      case 3:
        return <Step3 selection={selections.step3 || ''} onSelectionChange={(val) => updateSelections('step3', val)} />;
      default:
        return <Step1 selections={selections.step1 || []} onSelectionChange={(val) => updateSelections('step1', val)} />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] min-h-screen flex flex-col justify-start">
      <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} onBack={handleBack} />
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4">
        {renderStep()}
      </main>
      <footer className="w-full flex justify-center p-8">
        <Button 
          onClick={handleNext} 
          className="w-full max-w-xs bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black py-6 text-lg rounded-lg shadow-lg"
          disabled={!selections[`step${step}`] || selections[`step${step}`].length === 0}
        >
          {step === TOTAL_STEPS ? 'Finish' : 'Continue'}
        </Button>
      </footer>
    </div>
  );
};

export default OnboardingPage;
