interface MemberAvatarProps {
  member: {
    id: string;
    name: string;
    profileImage?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg'
};

export default function MemberAvatar({ 
  member, 
  size = 'md',
  showTooltip = true 
}: MemberAvatarProps) {
  return (
    <div className="relative group">
      {member.profileImage ? (
        <img
          src={member.profileImage}
          alt={member.name}
          className={`${sizeClasses[size]} rounded-full border-2 border-white dark:border-gray-800 
                     object-cover transition-transform duration-200 group-hover:scale-105`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full border-2 border-white dark:border-gray-800 
                        bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center 
                        transition-transform duration-200 group-hover:scale-105`}>
          <span className="text-white font-medium">
            {member.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                       text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 
                       transition-opacity duration-200 whitespace-nowrap">
          {member.name}
        </span>
      )}
    </div>
  );
} 