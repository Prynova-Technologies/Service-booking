import React, { useState } from 'react';
import {
  WrenchIcon, HomeIcon, CpuChipIcon, WrenchScrewdriverIcon, BoltIcon, FireIcon,
  BeakerIcon, BuildingOfficeIcon, CogIcon, DevicePhoneMobileIcon, LightBulbIcon,
  PaintBrushIcon, ShieldCheckIcon, TruckIcon, WifiIcon, ComputerDesktopIcon,
  AcademicCapIcon, HeartIcon, ScaleIcon, SparklesIcon, UserGroupIcon
} from '@heroicons/react/24/outline';

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

type IconType = React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;

interface IconOption {
  name: string;
  icon: IconType;
}

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelectIcon }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const iconOptions: IconOption[] = [
    { name: 'WrenchIcon', icon: WrenchIcon },
    { name: 'HomeIcon', icon: HomeIcon },
    { name: 'CpuChipIcon', icon: CpuChipIcon },
    { name: 'WrenchScrewdriverIcon', icon: WrenchScrewdriverIcon },
    { name: 'BoltIcon', icon: BoltIcon },
    { name: 'FireIcon', icon: FireIcon },
    { name: 'BeakerIcon', icon: BeakerIcon },
    { name: 'BuildingOfficeIcon', icon: BuildingOfficeIcon },
    { name: 'CogIcon', icon: CogIcon },
    { name: 'DevicePhoneMobileIcon', icon: DevicePhoneMobileIcon },
    { name: 'LightBulbIcon', icon: LightBulbIcon },
    { name: 'PaintBrushIcon', icon: PaintBrushIcon },
    { name: 'ShieldCheckIcon', icon: ShieldCheckIcon },
    { name: 'TruckIcon', icon: TruckIcon },
    { name: 'WifiIcon', icon: WifiIcon },
    { name: 'ComputerDesktopIcon', icon: ComputerDesktopIcon },
    { name: 'AcademicCapIcon', icon: AcademicCapIcon },
    { name: 'HeartIcon', icon: HeartIcon },
    { name: 'ScaleIcon', icon: ScaleIcon },
    { name: 'SparklesIcon', icon: SparklesIcon },
    { name: 'UserGroupIcon', icon: UserGroupIcon },
  ];

  const filteredIcons = searchTerm
    ? iconOptions.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : iconOptions;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="icon-search" className="block text-sm font-medium text-gray-700 mb-1">
          Search Icons
        </label>
        <input
          type="text"
          id="icon-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Search icons..."
        />
      </div>
      
      <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
        {filteredIcons.map((iconOption) => {
          const IconComponent = iconOption.icon;
          return (
            <div
              key={iconOption.name}
              onClick={() => onSelectIcon(iconOption.name)}
              className={`p-2 flex flex-col items-center justify-center rounded-md cursor-pointer hover:bg-gray-100 ${selectedIcon === iconOption.name ? 'bg-indigo-100 ring-2 ring-indigo-500' : ''}`}
            >
              <IconComponent className="h-8 w-8 text-gray-700" />
              <span className="mt-1 text-xs text-gray-600 truncate w-full text-center">
                {iconOption.name.replace('Icon', '')}
              </span>
            </div>
          );
        })}
      </div>
      
      {filteredIcons.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No icons found matching your search.
        </p>
      )}
    </div>
  );
};

export default IconPicker;

// Helper function to render the selected icon by name
export const renderIconByName = (iconName: string, className: string = "h-6 w-6") => {
  const iconMap: Record<string, IconType> = {
    WrenchIcon,
    HomeIcon,
    CpuChipIcon,
    WrenchScrewdriverIcon,
    BoltIcon,
    FireIcon,
    BeakerIcon,
    BuildingOfficeIcon,
    CogIcon,
    DevicePhoneMobileIcon,
    LightBulbIcon,
    PaintBrushIcon,
    ShieldCheckIcon,
    TruckIcon,
    WifiIcon,
    ComputerDesktopIcon,
    AcademicCapIcon,
    HeartIcon,
    ScaleIcon,
    SparklesIcon,
    UserGroupIcon,
  };

  const IconComponent = iconMap[iconName];
  return IconComponent ? <IconComponent className={className} /> : null;
};