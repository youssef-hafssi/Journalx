
import ExperienceCard from './ExperienceCard';

const options = [
  { id: 'newbie', title: 'Newbie', duration: '< 1 year', imgSrc: '/lovable-uploads/7b003d1d-7121-45ce-bc02-b8f5e8eb5d64.png' },
  { id: 'climbing', title: 'Climbing Ranks', duration: '1-3 years', imgSrc: '/lovable-uploads/6886d019-ff5a-4d15-a4a9-15e9f8f3ab21.png' },
  { id: 'ninja', title: 'Ninja Level', duration: '3-5 years', imgSrc: '/lovable-uploads/b5e1175b-30ad-4f70-815a-b699bdef97bc.png' },
  { id: 'monk', title: 'Monk Mode', duration: '5+ years', imgSrc: '/lovable-uploads/f8f00911-a3ff-4c59-b3de-f26d94b1ba68.png' },
];

interface Step3Props {
  selection: string;
  onSelectionChange: (selection: string) => void;
}

const Step3 = ({ selection, onSelectionChange }: Step3Props) => {
  return (
    <div className="text-center w-full animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-12">How long have you been trading?</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
        {options.map((option) => (
          <ExperienceCard
            key={option.id}
            title={option.title}
            duration={option.duration}
            imgSrc={option.imgSrc}
            isSelected={selection === option.id}
            onSelect={() => onSelectionChange(option.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Step3;
