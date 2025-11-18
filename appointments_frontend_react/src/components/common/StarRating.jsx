import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

const StarRating = ({ 
  value = 0, 
  onChange, 
  readOnly = false, 
  size = 'md',
  className 
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={cn('flex gap-1', className)}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = (hoverValue || value) >= rating;
        
        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => !readOnly && setHoverValue(rating)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            disabled={readOnly}
            className={cn(
              'transition-colors',
              !readOnly && 'cursor-pointer hover:scale-110',
              readOnly && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizes[size],
                isFilled 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;