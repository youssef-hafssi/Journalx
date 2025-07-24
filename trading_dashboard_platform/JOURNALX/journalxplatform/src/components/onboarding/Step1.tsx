
import { BookText, TrendingUp, Database, ShieldCheck } from 'lucide-react';
import ChoiceCard from './ChoiceCard';

const options = [
  { id: 'journal', icon: BookText, text: 'Journal, track, and analyze my trading stats' },
  { id: 'new', icon: TrendingUp, text: 'New to trading, just checking out' },
  { id: 'data', icon: Database, text: 'Gather data'},
  { id: 'funded', icon: ShieldCheck, text: 'Tracking my funded accounts' },
];

interface Step1Props {
  selections: string[];
  onSelectionChange: (selections: string[]) => void;
}

const Step1 = ({ selections, onSelectionChange }: Step1Props) => {
  const handleSelect = (id: string) => {
    const newSelections = selections.includes(id)
      ? selections.filter((s) => s !== id)
      : [...selections, id];
    onSelectionChange(newSelections);
  };

  return (
    <div className="text-center w-full animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">What are you looking to do with Journal X?</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-12">Select all that apply</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {options.map((option) => (
          <ChoiceCard
            key={option.id}
            icon={option.icon}
            text={option.text}
            isSelected={selections.includes(option.id)}
            onSelect={() => handleSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Step1;
