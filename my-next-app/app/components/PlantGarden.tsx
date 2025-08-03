'use client';

import { useState, useEffect } from 'react';
import { X, Edit3, Sprout } from 'lucide-react';

interface PlantGardenProps {
  isOpen: boolean;
  onClose: () => void;
  studyTimeMinutes: number;
}

type PlantStage = 'seedling' | 'sprout' | 'tree' | 'full-tree';

interface PlantData {
  name: string;
  stage: PlantStage;
}

export default function PlantGarden({ isOpen, onClose, studyTimeMinutes }: PlantGardenProps) {
  const [plantData, setPlantData] = useState<PlantData>({ name: 'My Plant', stage: 'seedling' });
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');

  // Determine plant stage based on study time
  const getPlantStage = (minutes: number): PlantStage => {
    if (minutes >= 90) return 'full-tree';
    if (minutes >= 60) return 'tree';
    if (minutes >= 30) return 'sprout';
    return 'seedling';
  };

  // Load plant data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPlant = localStorage.getItem('studypal-plant');
      if (savedPlant) {
        try {
          const parsed = JSON.parse(savedPlant);
          setPlantData(parsed);
        } catch (error) {
          console.error('Error loading plant data:', error);
        }
      }
    }
  }, []);

  // Update plant stage based on study time and save to localStorage
  useEffect(() => {
    const newStage = getPlantStage(studyTimeMinutes);
    if (newStage !== plantData.stage) {
      const updatedPlant = { ...plantData, stage: newStage };
      setPlantData(updatedPlant);
      if (typeof window !== 'undefined') {
        localStorage.setItem('studypal-plant', JSON.stringify(updatedPlant));
        console.log(`Plant evolved to ${newStage}! (${studyTimeMinutes} minutes studied)`);
      }
    }
  }, [studyTimeMinutes, plantData.stage, plantData.name]);

  const handleNameEdit = () => {
    setTempName(plantData.name);
    setIsEditing(true);
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      const updatedPlant = { ...plantData, name: tempName.trim() };
      setPlantData(updatedPlant);
      if (typeof window !== 'undefined') {
        localStorage.setItem('studypal-plant', JSON.stringify(updatedPlant));
      }
    }
    setIsEditing(false);
  };

  const handleNameCancel = () => {
    setTempName('');
    setIsEditing(false);
  };

  // Plant animations and visuals
  const getPlantDisplay = () => {
    switch (plantData.stage) {
      case 'seedling':
        return (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-t from-amber-100 to-green-100 rounded-full flex items-end justify-center animate-pulse">
                <div className="w-4 h-8 bg-green-400 rounded-t-full animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <div className="w-2 h-2 bg-green-600 rounded-full mx-auto mt-1"></div>
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-amber-800 rounded-full"></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">🌱 Seedling</p>
          </div>
        );
      
      case 'sprout':
        return (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-t from-amber-100 to-green-200 rounded-full flex items-end justify-center">
                <div className="flex flex-col items-center">
                  <div className="flex space-x-1 mb-2">
                    <div className="w-3 h-6 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-3 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  <div className="w-6 h-12 bg-green-600 rounded-t-lg animate-sway">
                    <div className="w-2 h-2 bg-green-800 rounded-full mx-auto mt-1"></div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-amber-800 rounded-full"></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">🌿 Sprout</p>
          </div>
        );
      
      case 'tree':
        return (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-t from-amber-100 to-green-300 rounded-full flex items-end justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full relative animate-pulse">
                    <div className="absolute inset-2 bg-green-700 rounded-full">
                      <div className="absolute inset-1 bg-green-800 rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-4 h-8 bg-amber-700 rounded-b-sm"></div>
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-amber-800 rounded-full"></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">🌳 Tree</p>
          </div>
        );
      
      case 'full-tree':
        return (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-t from-amber-100 to-green-400 rounded-full flex items-end justify-center overflow-hidden">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-20 h-20 bg-green-600 rounded-full animate-pulse">
                      <div className="absolute inset-1 bg-green-700 rounded-full">
                        <div className="absolute inset-1 bg-green-800 rounded-full"></div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="absolute -top-1 -right-3 w-6 h-6 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute top-2 -left-4 w-4 h-4 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                  </div>
                  <div className="w-5 h-10 bg-amber-700 rounded-b-sm"></div>
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-amber-800 rounded-full"></div>
              <div className="absolute top-4 left-4 text-yellow-400 animate-pulse">✨</div>
              <div className="absolute top-8 right-6 text-yellow-400 animate-pulse" style={{ animationDelay: '0.7s' }}>✨</div>
            </div>
            <p className="text-sm text-gray-600 mt-2">🌲 Majestic Tree</p>
          </div>
        );
    }
  };

  const getProgressInfo = () => {
    const currentStageMinutes = studyTimeMinutes % 30;
    const nextStageMinutes = 30 - currentStageMinutes;
    const isMaxStage = plantData.stage === 'full-tree';
    
    return {
      current: currentStageMinutes,
      needed: isMaxStage ? 0 : nextStageMinutes,
      isMaxStage
    };
  };

  const progress = getProgressInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Sprout className="h-5 w-5 mr-2 text-green-600" />
            Your Plant Garden
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Plant Display */}
          <div className="text-center mb-6">
            {getPlantDisplay()}
          </div>

          {/* Plant Name */}
          <div className="text-center mb-6">
            {isEditing ? (
              <div className="flex items-center justify-center space-x-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="text-lg font-semibold text-center border-b-2 border-green-500 focus:outline-none bg-transparent text-gray-900"
                  maxLength={20}
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  className="text-green-600 hover:text-green-800"
                >
                  ✓
                </button>
                <button
                  onClick={handleNameCancel}
                  className="text-red-600 hover:text-red-800"
                >
                  ✗
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">{plantData.name}</h3>
                <button
                  onClick={handleNameEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Progress Information */}
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Study Time: {studyTimeMinutes} minutes</p>
              {!progress.isMaxStage ? (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(progress.current / 30) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {progress.needed} more minutes until next growth stage!
                  </p>
                </>
              ) : (
                <p className="text-sm text-green-600 font-medium">
                  🎉 Your plant has reached full maturity! Keep studying to maintain its beauty.
                </p>
              )}
            </div>
          </div>

          {/* Growth Stages Info */}
          <div className="text-center text-xs text-gray-500">
            <p>Growth Stages:</p>
            <p>🌱 Seedling (0-29 min) → 🌿 Sprout (30-59 min) → 🌳 Tree (60-89 min) → 🌲 Majestic Tree (90+ min)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
