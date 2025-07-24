
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
}

const ProgressBarComponent = ({ currentStep, totalSteps, onBack }: ProgressBarProps) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <header className="w-full max-w-5xl mx-auto p-4 sm:p-0">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Journal<span className="text-red-600">X</span></h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center text-sm font-medium">
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onBack} disabled={currentStep === 1} className="disabled:opacity-50 disabled:cursor-not-allowed">
          <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <Progress value={progressPercentage} className="w-full h-2 [&>*]:bg-black dark:[&>*]:bg-white" />
      </div>
    </header>
  );
};

export default ProgressBarComponent;
