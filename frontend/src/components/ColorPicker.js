import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const COLORS = [
  { name: 'Crimson Red', hex: '#DC143C' },
  { name: 'Ruby Red', hex: '#E0115F' },
  { name: 'Coral Pink', hex: '#FF6B6B' },
  { name: 'Blush Pink', hex: '#FFB6C1' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Royal Purple', hex: '#7851A9' },
  { name: 'Deep Purple', hex: '#673AB7' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Ocean Blue', hex: '#4A90E2' },
  { name: 'Navy Blue', hex: '#001F3F' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Mint Green', hex: '#98FF98' },
  { name: 'Emerald Green', hex: '#50C878' },
  { name: 'Forest Green', hex: '#228B22' },
  { name: 'Sage Green', hex: '#9DC183' },
  { name: 'Sunshine Yellow', hex: '#FFD700' },
  { name: 'Mustard Yellow', hex: '#FFDB58' },
  { name: 'Lemon Yellow', hex: '#FFF44F' },
  { name: 'Peach', hex: '#FFE5B4' },
  { name: 'Burnt Orange', hex: '#CC5500' },
  { name: 'Tangerine', hex: '#FF9933' },
  { name: 'Chocolate Brown', hex: '#7B3F00' },
  { name: 'Mocha', hex: '#967969' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Ivory', hex: '#FFFFF0' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Pearl White', hex: '#F8F6F0' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Jet Black', hex: '#000000' },
  { name: 'Midnight Black', hex: '#0C0C0C' }
];

const ColorPicker = ({ label, value, onChange, dataTestId, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedColor = COLORS.find(c => c.hex === value);
  
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onOpenChange) {
      onOpenChange(newState);
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <div className="relative" data-testid={dataTestId}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-between hover:border-blue-400 transition-all duration-300 focus:ring-4 focus:ring-blue-100 focus:outline-none"
      >
        <div className="flex items-center space-x-3">
          {selectedColor ? (
            <>
              <div 
                className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span className="font-medium text-gray-900">{selectedColor.name}</span>
            </>
          ) : (
            <span className="text-gray-500">Select a color</span>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[100] sm:hidden" 
            onClick={handleClose}
          />
          <div className="relative z-[101] mt-2 bg-white border-2 border-blue-300 rounded-2xl shadow-2xl max-h-[500px] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => {
                    onChange(color.hex);
                    setIsOpen(false);
                  }}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 hover:bg-blue-50 ${
                    value === color.hex ? 'bg-blue-50 ring-2 ring-blue-500' : 'hover:scale-102'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    {value === color.hex && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-base font-medium text-gray-700 text-left flex-1">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ColorPicker;