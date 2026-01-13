import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/shared';
import { getDepthClasses } from '@/shared/utils/styleUtils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import { Input } from '@/components/common/shadcn/input';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';

/**
 * Curated list of commonly useful icons from lucide-react
 * Organized by category for better discoverability
 */
const ICON_CATEGORIES = {
  actions: [
    'Plus', 'Minus', 'X', 'Check', 'Edit', 'Trash2', 'Copy', 'Download', 'Upload',
    'Save', 'Undo', 'Redo', 'RefreshCw', 'RotateCcw', 'Send', 'Share', 'Share2',
    'ExternalLink', 'Link', 'Unlink', 'Archive', 'ArchiveRestore', 'Eye', 'EyeOff',
    'Lock', 'Unlock', 'Filter', 'SortAsc', 'SortDesc', 'Search', 'ZoomIn', 'ZoomOut',
  ],
  navigation: [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ChevronUp', 'ChevronDown',
    'ChevronLeft', 'ChevronRight', 'ChevronsUp', 'ChevronsDown', 'ChevronsLeft',
    'ChevronsRight', 'ArrowUpRight', 'ArrowDownLeft', 'Home', 'Menu', 'MoreHorizontal',
    'MoreVertical', 'Grid', 'List', 'Layers', 'Move', 'Maximize', 'Minimize',
  ],
  media: [
    'Music', 'Music2', 'Music3', 'Music4', 'Disc', 'Disc2', 'Disc3', 'Radio',
    'Headphones', 'Mic', 'Mic2', 'MicOff', 'Volume', 'Volume1', 'Volume2', 'VolumeX',
    'Play', 'Pause', 'Square', 'SkipBack', 'SkipForward', 'Rewind', 'FastForward',
    'Repeat', 'Shuffle', 'ListMusic', 'AudioLines', 'Podcast', 'Camera', 'Video',
    'Image', 'Film', 'Clapperboard', 'Tv', 'Monitor', 'Projector',
  ],
  communication: [
    'Mail', 'MailOpen', 'Inbox', 'Send', 'MessageSquare', 'MessageCircle',
    'MessagesSquare', 'Phone', 'PhoneCall', 'PhoneOff', 'PhoneIncoming',
    'PhoneOutgoing', 'AtSign', 'Bell', 'BellOff', 'BellRing', 'Megaphone',
  ],
  social: [
    'User', 'Users', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'Contact',
    'Heart', 'HeartOff', 'ThumbsUp', 'ThumbsDown', 'Star', 'StarOff', 'StarHalf',
    'Award', 'Trophy', 'Medal', 'Crown', 'Gem', 'Sparkles', 'PartyPopper',
  ],
  location: [
    'MapPin', 'MapPinOff', 'Map', 'Navigation', 'Navigation2', 'Compass', 'Globe',
    'Globe2', 'Earth', 'Building', 'Building2', 'Home', 'Hotel', 'Warehouse',
    'Factory', 'Landmark', 'Castle', 'Church', 'ParkingCircle', 'Route', 'Signpost',
  ],
  time: [
    'Calendar', 'CalendarDays', 'CalendarClock', 'CalendarCheck', 'CalendarX',
    'CalendarPlus', 'CalendarMinus', 'CalendarRange', 'Clock', 'Clock1', 'Clock2',
    'Clock3', 'Clock4', 'Clock5', 'Clock6', 'Clock7', 'Clock8', 'Clock9', 'Clock10',
    'Clock11', 'Clock12', 'Timer', 'TimerOff', 'Hourglass', 'AlarmClock', 'History',
  ],
  commerce: [
    'CreditCard', 'Wallet', 'Banknote', 'Coins', 'DollarSign', 'Euro', 'PoundSterling',
    'Bitcoin', 'ShoppingCart', 'ShoppingBag', 'Store', 'Package', 'Gift', 'Percent',
    'Receipt', 'ReceiptText', 'Tag', 'Tags', 'Barcode', 'QrCode', 'Ticket',
  ],
  status: [
    'CheckCircle', 'CheckCircle2', 'XCircle', 'AlertCircle', 'AlertTriangle', 'Info',
    'HelpCircle', 'Ban', 'CircleDot', 'Circle', 'CircleSlash', 'CircleCheck',
    'CircleX', 'CirclePlus', 'CircleMinus', 'Loader', 'Loader2', 'LoaderCircle',
  ],
  weather: [
    'Sun', 'Moon', 'Cloud', 'CloudSun', 'CloudMoon', 'CloudRain', 'CloudSnow',
    'CloudLightning', 'CloudFog', 'Wind', 'Snowflake', 'Thermometer', 'Umbrella',
    'Rainbow', 'Sunrise', 'Sunset', 'Waves',
  ],
  misc: [
    'Palette', 'Paintbrush', 'Brush', 'PenTool', 'Pencil', 'Eraser', 'Highlighter',
    'Wand', 'Wand2', 'Scissors', 'Ruler', 'Scale', 'Gauge', 'Activity', 'Zap',
    'Flame', 'Droplet', 'Leaf', 'Flower', 'Flower2', 'TreeDeciduous', 'TreePine',
    'Mountain', 'MountainSnow', 'Tent', 'Anchor', 'Plane', 'Car', 'Bus', 'Train',
    'Bike', 'Ship', 'Rocket', 'Coffee', 'Wine', 'Beer', 'Pizza', 'Apple', 'Croissant',
    'Cookie', 'Cake', 'IceCream', 'Candy', 'Utensils', 'ChefHat', 'Book', 'BookOpen',
    'Newspaper', 'FileText', 'Folder', 'FolderOpen', 'Settings', 'Cog', 'Wrench',
    'Hammer', 'Plug', 'Puzzle', 'Lightbulb', 'Lamp', 'Glasses', 'Binoculars',
    'Microscope', 'Telescope', 'Dna', 'Atom', 'Flask', 'TestTube', 'Pill', 'Syringe',
    'Stethoscope', 'Activity', 'HeartPulse', 'Bone', 'Brain', 'Fingerprint',
  ],
} as const;

// Flatten all icons into a single array for searching
const ALL_ICONS = Object.values(ICON_CATEGORIES).flat();

// Color palette for icon color selection
export const ICON_COLORS = [
  // Design system colors
  { name: 'gold', value: '#dfba7d', label: 'Gold' },
  { name: 'crimson', value: '#520C10', label: 'Crimson' },
  { name: 'navy', value: '#545E75', label: 'Navy' },
  { name: 'danger', value: '#D64933', label: 'Danger' },
  { name: 'success', value: '#7D9B72', label: 'Success' },
  // Additional useful colors
  { name: 'white', value: '#FFFFFF', label: 'White' },
  { name: 'gray', value: '#9CA3AF', label: 'Gray' },
  { name: 'amber', value: '#F59E0B', label: 'Amber' },
  { name: 'orange', value: '#F97316', label: 'Orange' },
  { name: 'red', value: '#EF4444', label: 'Red' },
  { name: 'rose', value: '#F43F5E', label: 'Rose' },
  { name: 'pink', value: '#EC4899', label: 'Pink' },
  { name: 'fuchsia', value: '#D946EF', label: 'Fuchsia' },
  { name: 'purple', value: '#A855F7', label: 'Purple' },
  { name: 'violet', value: '#8B5CF6', label: 'Violet' },
  { name: 'indigo', value: '#6366F1', label: 'Indigo' },
  { name: 'blue', value: '#3B82F6', label: 'Blue' },
  { name: 'sky', value: '#0EA5E9', label: 'Sky' },
  { name: 'cyan', value: '#06B6D4', label: 'Cyan' },
  { name: 'teal', value: '#14B8A6', label: 'Teal' },
  { name: 'emerald', value: '#10B981', label: 'Emerald' },
  { name: 'green', value: '#22C55E', label: 'Green' },
  { name: 'lime', value: '#84CC16', label: 'Lime' },
  { name: 'yellow', value: '#EAB308', label: 'Yellow' },
] as const;

export type IconColor = typeof ICON_COLORS[number];

export interface IconPickerValue {
  icon: string;
  color: string;
}

interface FmIconPickerProps {
  /** Currently selected icon and color */
  value?: IconPickerValue;
  /** Callback when selection changes */
  onChange: (value: IconPickerValue) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Default color when no color is selected */
  defaultColor?: string;
  /** Default icon to show when no icon is selected (icon name from lucide-react) */
  defaultIcon?: string;
  /** Size of the icon button */
  size?: 'sm' | 'default' | 'lg';
}

/**
 * FmIconPicker - Compact icon button that opens an icon and color picker
 *
 * A popup picker that allows users to select from a curated list of
 * lucide-react icons and choose a color for the icon. The trigger is
 * styled as an icon button for compact inline usage.
 *
 * Features:
 * - Compact icon button trigger
 * - Searchable icon grid with 250+ icons
 * - Color palette with design system colors
 * - Frosted glass popup styling
 * - Gold accent hover/focus effects
 *
 * Usage:
 * ```tsx
 * const [iconValue, setIconValue] = useState<IconPickerValue>({
 *   icon: 'Music',
 *   color: '#dfba7d'
 * });
 *
 * <FmIconPicker
 *   value={iconValue}
 *   onChange={setIconValue}
 *   defaultIcon="Bookmark"
 * />
 * ```
 */
export function FmIconPicker({
  value,
  onChange,
  disabled = false,
  className,
  defaultColor = '#FFFFFF',
  defaultIcon = 'Circle',
  size = 'default',
}: FmIconPickerProps) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return ALL_ICONS;
    }
    const query = searchQuery.toLowerCase();
    return ALL_ICONS.filter(iconName =>
      iconName.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Get the icon component for a given icon name
  const getIconComponent = useCallback((iconName: string): LucideIcons.LucideIcon | null => {
    const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon | undefined>;
    const IconComponent = icons[iconName];
    return IconComponent || null;
  }, []);

  // Handle icon selection
  const handleIconSelect = useCallback((iconName: string) => {
    onChange({
      icon: iconName,
      color: value?.color || defaultColor,
    });
  }, [onChange, value?.color, defaultColor]);

  // Handle color selection
  const handleColorSelect = useCallback((color: string) => {
    onChange({
      icon: value?.icon || '',
      color,
    });
  }, [onChange, value?.icon]);

  // Clear/reset selection to default
  const handleClear = useCallback(() => {
    onChange({ icon: defaultIcon, color: defaultColor });
    setSearchQuery('');
  }, [onChange, defaultColor, defaultIcon]);

  // Get currently selected or default icon component
  const displayIcon = value?.icon || defaultIcon;
  const displayColor = value?.color || defaultColor;
  const DisplayIconComponent = getIconComponent(displayIcon);
  const DefaultIconComponent = getIconComponent(defaultIcon);

  // Size classes for the icon button
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'flex items-center justify-center',
            'rounded-none',
            'bg-black/40 backdrop-blur-sm',
            'border transition-all duration-300',
            sizeClasses[size],
            // Default border
            !isOpen && !isHovered && 'border-white/20',
            // Hover state
            isHovered && !isOpen && [
              'border-fm-gold/60 bg-white/5',
              'shadow-[0_0_12px_rgba(223,186,125,0.2)]',
            ],
            // Open/focused state
            isOpen && [
              'border-fm-gold bg-fm-gold/10',
              'shadow-[0_0_16px_rgba(223,186,125,0.3)]',
            ],
            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'cursor-pointer',
            className
          )}
          aria-label={t('iconPicker.selectIcon')}
        >
          {DisplayIconComponent ? (
            <DisplayIconComponent
              className={cn(iconSizeClasses[size], 'transition-all duration-300')}
              style={{ color: displayColor }}
            />
          ) : DefaultIconComponent ? (
            <DefaultIconComponent
              className={cn(iconSizeClasses[size], 'transition-all duration-300 text-white/50')}
            />
          ) : (
            <div className={cn(iconSizeClasses[size], 'border border-dashed border-white/30 rounded-none')} />
          )}
        </button>
      </PopoverTrigger>
        <PopoverContent
          className={cn(
            'w-[360px] p-0',
            getDepthClasses(3),
            'border-2 border-fm-gold/30',
            'shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_24px_rgba(223,186,125,0.15)]',
            'rounded-none'
          )}
          align="start"
          sideOffset={8}
        >
          {/* Search input */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('iconPicker.searchPlaceholder')}
                className={cn(
                  'pl-10 pr-8 h-9',
                  'bg-black/40 border-white/20 rounded-none',
                  'placeholder:text-white/40',
                  'focus-visible:outline-none focus-visible:border-fm-gold/50',
                  'focus-visible:shadow-[0_0_12px_rgba(223,186,125,0.15)]'
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Icon grid */}
          <ScrollArea className="h-[200px]">
            <div className="p-3">
              {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-8 gap-1">
                  {filteredIcons.map(iconName => {
                    const IconComp = getIconComponent(iconName);
                    if (!IconComp) return null;
                    const isSelected = value?.icon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => handleIconSelect(iconName)}
                        title={iconName}
                        className={cn(
                          'p-2 rounded-none transition-all duration-200',
                          'border border-transparent',
                          'hover:bg-fm-gold/10 hover:border-fm-gold/30',
                          'hover:shadow-[0_0_8px_rgba(223,186,125,0.2)]',
                          'focus:outline-none focus:bg-fm-gold/15 focus:border-fm-gold/50',
                          isSelected && [
                            'bg-fm-gold/20 border-fm-gold',
                            'shadow-[0_0_12px_rgba(223,186,125,0.3)]',
                          ]
                        )}
                      >
                        <IconComp
                          className="h-4 w-4"
                          style={{
                            color: isSelected ? (value?.color || defaultColor) : 'rgba(255,255,255,0.7)',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-white/50 text-sm">
                  {t('iconPicker.noIconsFound')}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Color palette */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {t('iconPicker.color')}
              </span>
              {(value?.icon || value?.color !== defaultColor) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-white/50 hover:text-fm-gold transition-colors"
                >
                  {t('iconPicker.clear')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-12 gap-1">
              {ICON_COLORS.map(colorOption => {
                const isSelected = value?.color === colorOption.value;
                return (
                  <button
                    key={colorOption.name}
                    type="button"
                    onClick={() => handleColorSelect(colorOption.value)}
                    title={colorOption.label}
                    className={cn(
                      'w-6 h-6 rounded-none transition-all duration-200',
                      'border-2',
                      'hover:scale-110 hover:shadow-lg',
                      'focus:outline-none focus:scale-110',
                      isSelected
                        ? 'border-white shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                        : 'border-transparent hover:border-white/50'
                    )}
                    style={{ backgroundColor: colorOption.value }}
                  >
                    {isSelected && (
                      <Check
                        className="h-3 w-3 mx-auto"
                        style={{
                          color: colorOption.name === 'white' || colorOption.name === 'yellow' || colorOption.name === 'lime'
                            ? '#000000'
                            : '#FFFFFF',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected preview */}
          {value?.icon && (
            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-3 text-sm">
                <div
                  className={cn(
                    'w-10 h-10 flex items-center justify-center',
                    'bg-black/40 border border-white/20 rounded-none'
                  )}
                >
                  {DisplayIconComponent && (
                    <DisplayIconComponent
                      className="h-5 w-5"
                      style={{ color: displayColor }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{value.icon}</div>
                  <div className="text-white/50 text-xs">{value.color}</div>
                </div>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
  );
}

/**
 * Helper function to render an icon by name
 * Useful for displaying saved icon selections
 */
export function renderIcon(
  iconName: string,
  color?: string,
  className?: string
): React.ReactNode {
  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon | undefined>;
  const IconComponent = icons[iconName];
  if (!IconComponent) return null;
  return (
    <IconComponent
      className={className}
      style={color ? { color } : undefined}
    />
  );
}