import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';

const SearchBar = ({ 
  value, 
  onChange, 
  onClear,
  placeholder = 'Buscar...', 
  className 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-10 py-2 border rounded-lg transition-all',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          isFocused ? 'border-primary-500' : 'border-gray-300'
        )}
      />
      
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;