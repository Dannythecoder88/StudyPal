'use client';

import { useState } from 'react';
import { X, Plus, Calendar, BookOpen, AlertTriangle } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: any) => void;
}

export default function AddTaskModal({ isOpen, onClose, onAddTask }: AddTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    customSubject: '',
    priority: 'medium',
    dueDate: '',
    estimatedTime: 60,
    description: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'English', 'Literature',
    'Computer Science', 'Economics', 'Psychology', 'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { [key: string]: string } = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    
    // Handle subject validation
    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject === 'Other' && !formData.customSubject.trim()) {
      newErrors.customSubject = 'Please enter a custom subject';
    }
    
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (formData.estimatedTime <= 0) newErrors.estimatedTime = 'Estimated time must be greater than 0';
    if (formData.estimatedTime >= 600) newErrors.estimatedTime = 'Estimated time must be less than 600 minutes';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare task data
    const taskData = {
      ...formData,
      subject: formData.subject === 'Other' ? formData.customSubject : formData.subject
    };

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const newTask = await response.json();
        onAddTask(newTask);
        onClose();
        setFormData({
          title: '',
          subject: '',
          customSubject: '',
          priority: 'medium',
          dueDate: '',
          estimatedTime: 60,
          description: ''
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    console.log('Input change:', field, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 ${errors.title ? 'border-red-500' : ''}`}
              placeholder="e.g., AP Euro Unit 7 Review"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <select
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 ${errors.subject ? 'border-red-500' : ''}`}
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {errors.subject}
              </p>
            )}
            
            {/* Custom Subject Input */}
            {formData.subject === 'Other' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Subject *
                </label>
                <input
                  type="text"
                  value={formData.customSubject}
                  onChange={(e) => handleInputChange('customSubject', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 ${errors.customSubject ? 'border-red-500' : ''}`}
                  placeholder="Enter your custom subject..."
                />
                {errors.customSubject && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errors.customSubject}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex space-x-3">
              {[
                { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
                { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
                { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
              ].map(priority => (
                <label key={priority.value} className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={formData.priority === priority.value}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="sr-only"
                  />
                  <span className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    formData.priority === priority.value 
                      ? priority.color 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                    {priority.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 ${errors.dueDate ? 'border-red-500' : ''}`}
            />
            {errors.dueDate && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {errors.dueDate}
              </p>
            )}
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="599"
              value={formData.estimatedTime}
              onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 ${errors.estimatedTime ? 'border-red-500' : ''}`}
              placeholder="e.g., 45"
            />
            <p className="text-xs text-gray-500 mt-1">Enter any time from 1 to 599 minutes</p>
            {errors.estimatedTime && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {errors.estimatedTime}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 resize-none h-20"
              placeholder="Add any additional details about this task..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 