
import { cn } from '@/lib/utils';

interface ExperienceCardProps {
  title: string;
  duration: string;
  imgSrc: string;
  isSelected: boolean;
  onSelect: () => void;
}

const ExperienceCard = ({ title, duration, imgSrc, isSelected, onSelect }: ExperienceCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'p-4 border rounded-lg text-center transition-all duration-200 flex flex-col items-center justify-between space-y-4',
        isSelected
          ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800 ring-2 ring-black dark:ring-white'
          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] hover:border-gray-400 dark:hover:border-gray-500'
      )}
    >
      <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        <img src={imgSrc} alt={title} className="w-24 h-24 object-contain" />
      </div>
      <div>
        <h3 className="font-bold text-md text-gray-800 dark:text-gray-200">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{duration}</p>
      </div>
    </button>
  );
};

export default ExperienceCard;
