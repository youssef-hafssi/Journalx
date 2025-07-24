
import { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface ChoiceCardProps {
  icon: React.ElementType<LucideProps>;
  text: string;
  isSelected: boolean;
  onSelect: () => void;
}

const ChoiceCard = ({ icon: Icon, text, isSelected, onSelect }: ChoiceCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex items-center p-4 border rounded-lg text-left transition-all duration-200 w-full',
        isSelected
          ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800 ring-2 ring-black dark:ring-white'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] hover:border-gray-400 dark:hover:border-gray-500'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0',
        isSelected ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'
      )}>
        <Icon className={cn('w-6 h-6', isSelected ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400')} />
      </div>
      <span className="font-medium text-gray-800 dark:text-gray-200">{text}</span>
    </button>
  );
};

export default ChoiceCard;
