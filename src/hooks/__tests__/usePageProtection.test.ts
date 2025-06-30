import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePageProtection } from '../usePageProtection';
import { useProcessingTitle } from '../useProcessingTitle';
import { useUnloadProtection } from '../useUnloadProtection';
import type { ProcessingProgress } from '../../types';

// Mock the individual hooks
vi.mock('../useUnloadProtection');
vi.mock('../useProcessingTitle');

const mockUseUnloadProtection = vi.mocked(useUnloadProtection);
const mockUseProcessingTitle = vi.mocked(useProcessingTitle);

describe('usePageProtection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useUnloadProtection with isProcessing', () => {
    renderHook(() => usePageProtection({ isProcessing: true }));
    
    expect(mockUseUnloadProtection).toHaveBeenCalledWith(true);
  });

  it('should call useProcessingTitle with all parameters', () => {
    const progress: ProcessingProgress = {
      total: 100,
      processed: 50,
      successful: 45,
      failed: 5
    };
    const originalTitle = 'Custom Title';
    
    renderHook(() => usePageProtection({ 
      isProcessing: true, 
      progress, 
      originalTitle 
    }));
    
    expect(mockUseProcessingTitle).toHaveBeenCalledWith(true, progress, originalTitle);
  });

  it('should use default original title when not provided', () => {
    renderHook(() => usePageProtection({ isProcessing: false }));
    
    expect(mockUseProcessingTitle).toHaveBeenCalledWith(
      false, 
      undefined, 
      'addressli - CSV Geocoding Tool'
    );
  });

  it('should call both hooks when processing starts', () => {
    renderHook(() => usePageProtection({ isProcessing: true }));
    
    expect(mockUseUnloadProtection).toHaveBeenCalled();
    expect(mockUseProcessingTitle).toHaveBeenCalled();
  });

  it('should pass progress to useProcessingTitle when provided', () => {
    const progress: ProcessingProgress = {
      total: 200,
      processed: 75,
      successful: 70,
      failed: 5
    };
    
    renderHook(() => usePageProtection({ isProcessing: true, progress }));
    
    expect(mockUseProcessingTitle).toHaveBeenCalledWith(
      true, 
      progress, 
      'addressli - CSV Geocoding Tool'
    );
  });
});
