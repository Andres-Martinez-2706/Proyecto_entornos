import { cn } from '../../utils/cn';

const Card = ({ children, className, padding = true, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow',
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;