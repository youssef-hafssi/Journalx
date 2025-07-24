
import { cn } from '@/lib/utils';

const options = ['Stocks', 'Options', 'Forex', 'Crypto', 'Futures', 'Other'];

interface Step2Props {
  selections: string[];
  onSelectionChange: (selections: string[]) => void;
}

const Step2 = ({ selections, onSelectionChange }: Step2Props) => {
  const handleSelect = (option: string) => {
    const newSelections = selections.includes(option)
      ? selections.filter((s) => s !== option)
      : [...selections, option];
    onSelectionChange(newSelections);
  };

  return (
    <div className="text-center w-full animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">What assets are you currently trading?</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-12">Select all that apply</p>
      <div className="flex flex-wrap justify-center gap-4 max-w-xl mx-auto">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className={cn(
              'px-6 py-3 border rounded-lg font-medium transition-all duration-200',
              selections.includes(option)
                ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800 text-black dark:text-white ring-2 ring-black dark:ring-white'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Step2;
