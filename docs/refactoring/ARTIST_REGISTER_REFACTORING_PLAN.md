# ArtistRegister Refactoring Plan

## Overview

The `ArtistRegister` component (849 lines) follows a wizard pattern with 4 steps. This document provides a complete refactoring plan with established patterns.

## Current Structure (849 lines - Monolithic)

- All form state in one component
- All validation logic inline
- All submission logic inline
- All 4 step UIs defined in carousel items
- Mixed concerns (UI, validation, API calls)

## Target Structure (Modular)

### Directory Layout
```
src/pages/artists/
├── ArtistRegisterRefactored.tsx        # Main orchestrator (~150 lines)
├── types/
│   └── registration.ts                 # ✅ CREATED - Form data types
├── hooks/
│   ├── useArtistRegistrationValidation.ts  # ✅ CREATED - Validation logic
│   ├── useArtistRegistrationSubmit.ts      # ✅ CREATED - Submit logic
│   └── useRegistrationStepper.ts           # TODO - Step navigation
└── components/
    └── registration-steps/
        ├── BasicDetailsStep.tsx        # ✅ CREATED - Step 1
        ├── SocialImagesStep.tsx        # TODO - Step 2
        ├── MusicStep.tsx               # TODO - Step 3
        ├── TermsStep.tsx               # TODO - Step 4
        └── RegistrationProgress.tsx    # TODO - Progress indicator
```

## ✅ Files Already Created

### 1. types/registration.ts (60 lines)
- `ArtistRegistrationFormData` interface
- `DEFAULT_FORM_DATA` constant
- `STEP_TITLES` array
- `DEFAULT_BIO` constant

### 2. hooks/useArtistRegistrationValidation.ts (80 lines)
- `validateStep(step, formData)` - Validates single step
- `validateAllSteps(formData)` - Validates all steps
- Returns first invalid step number or null

### 3. hooks/useArtistRegistrationSubmit.ts (95 lines)
- `submitRegistration(formData)` - Handles API call
- `isSubmitting` state
- Error handling and logging
- Navigation on success

### 4. components/registration-steps/BasicDetailsStep.tsx (75 lines)
- Step 1: Stage name, bio, genres
- Self-contained with layout
- Accepts formData, onInputChange, onNext props

## 📋 Remaining Work

### Step 2: SocialImagesStep.tsx (~200 lines)

**Purpose:** Profile images and social media links

**Structure:**
```typescript
interface SocialImagesStepProps {
  formData: ArtistRegistrationFormData;
  onInputChange: (field, value) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function SocialImagesStep({ ... }) {
  return (
    <div className='h-full flex flex-col p-[20px]'>
      {/* Image upload grid */}
      {/* Social media inputs */}
      {/* Navigation buttons */}
    </div>
  );
}
```

**Components to extract:**
- Profile image uploader (main)
- Press photo uploaders (3 optional)
- Social media input group

### Step 3: MusicStep.tsx (~150 lines)

**Purpose:** Music samples and streaming links

**Structure:**
```typescript
interface MusicStepProps {
  formData: ArtistRegistrationFormData;
  onInputChange: (field, value) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function MusicStep({ ... }) {
  return (
    <div className='h-full flex flex-col p-[20px]'>
      {/* SoundCloud set URL (required) */}
      {/* Spotify track URL (optional) */}
      {/* Music preview */}
      {/* Navigation buttons */}
    </div>
  );
}
```

### Step 4: TermsStep.tsx (~120 lines)

**Purpose:** Terms, privacy, and preferences

**Structure:**
```typescript
interface TermsStepProps {
  formData: ArtistRegistrationFormData;
  onInputChange: (field, value) => void;
  onSubmit: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function TermsStep({ ... }) {
  return (
    <div className='h-full flex flex-col p-[20px]'>
      {/* Terms checkbox (required) */}
      {/* Privacy checkboxes */}
      {/* Submit button with loading state */}
    </div>
  );
}
```

### Hook: useRegistrationStepper.ts (~60 lines)

**Purpose:** Manage step navigation and carousel sync

```typescript
export function useRegistrationStepper(
  carouselApi: CarouselApi | undefined
) {
  const [currentStep, setCurrentStep] = useState(0);

  // Sync carousel with current step
  useEffect(() => {
    if (carouselApi) {
      carouselApi.scrollTo(currentStep);
    }
  }, [currentStep, carouselApi]);

  // Track carousel changes
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentStep(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', onSelect);
    onSelect();

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const goToStep = (step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, 3)));
  };

  return {
    currentStep,
    handleNext,
    handlePrevious,
    goToStep,
  };
}
```

### Component: RegistrationProgress.tsx (~50 lines)

**Purpose:** Visual progress indicator

```typescript
interface RegistrationProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export function RegistrationProgress({ ... }) {
  return (
    <div className='flex items-center gap-2'>
      {stepTitles.map((title, index) => (
        <div key={index} className={cn(
          'step-indicator',
          index === currentStep && 'active',
          index < currentStep && 'completed'
        )}>
          <div className='step-number'>{index + 1}</div>
          <div className='step-title'>{title}</div>
        </div>
      ))}
    </div>
  );
}
```

## Main Component: ArtistRegisterRefactored.tsx (~150 lines)

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { Carousel, CarouselContent, CarouselItem } from '@/components/common/shadcn/carousel';

// Hooks
import { useRegistrationStepper } from './hooks/useRegistrationStepper';
import { useArtistRegistrationValidation } from './hooks/useArtistRegistrationValidation';
import { useArtistRegistrationSubmit } from './hooks/useArtistRegistrationSubmit';

// Types and constants
import { DEFAULT_FORM_DATA, STEP_TITLES } from './types/registration';
import type { ArtistRegistrationFormData } from './types/registration';

// Step components
import { BasicDetailsStep } from './components/registration-steps/BasicDetailsStep';
import { SocialImagesStep } from './components/registration-steps/SocialImagesStep';
import { MusicStep } from './components/registration-steps/MusicStep';
import { TermsStep } from './components/registration-steps/TermsStep';

export default function ArtistRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ArtistRegistrationFormData>(DEFAULT_FORM_DATA);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Custom hooks
  const { currentStep, handleNext, handlePrevious, goToStep } = useRegistrationStepper(carouselApi);
  const { validateStep, validateAllSteps } = useArtistRegistrationValidation();
  const { submitRegistration, isSubmitting } = useArtistRegistrationSubmit();

  const handleInputChange = (field: keyof ArtistRegistrationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStepNext = () => {
    if (validateStep(currentStep, formData)) {
      handleNext();
    }
  };

  const handleSubmit = async () => {
    const invalidStep = validateAllSteps(formData);
    if (invalidStep !== null) {
      goToStep(invalidStep);
      return;
    }

    await submitRegistration(formData);
  };

  return (
    <ArtistRegistrationLayout>
      <div className='fixed inset-0 top-[80px] flex overflow-hidden'>
        {/* Left Column - Form Carousel */}
        <div className='w-1/2 relative flex flex-col border-r border-white/10 z-10'>
          {/* Frosted Glass Background */}
          <div className='absolute inset-0 bg-black/70 backdrop-blur-md' />

          {/* Header */}
          <div className='relative z-10 flex items-center justify-between p-[20px] border-b border-white/10'>
            <button
              onClick={() => navigate('/artists/signup')}
              className='text-white/70 hover:text-fm-gold transition-colors duration-300 flex items-center gap-[10px] font-canela text-sm'
            >
              <ArrowLeft className='h-4 w-4' />
              Back
            </button>
            <div className='flex flex-col items-end'>
              <span className='font-canela text-sm text-muted-foreground'>
                Step {currentStep + 1} of 4
              </span>
              <span className='font-canela text-xs text-muted-foreground/70'>
                {STEP_TITLES[currentStep]}
              </span>
            </div>
          </div>

          {/* Form Carousel */}
          <div className='relative z-10 flex-1 overflow-hidden'>
            <Carousel
              setApi={setCarouselApi}
              opts={{ align: 'start', watchDrag: false }}
              className='h-full'
            >
              <CarouselContent className='h-full'>
                <CarouselItem className='h-full'>
                  <BasicDetailsStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onNext={handleStepNext}
                  />
                </CarouselItem>

                <CarouselItem className='h-full'>
                  <SocialImagesStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onNext={handleStepNext}
                    onPrevious={handlePrevious}
                  />
                </CarouselItem>

                <CarouselItem className='h-full'>
                  <MusicStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onNext={handleStepNext}
                    onPrevious={handlePrevious}
                  />
                </CarouselItem>

                <CarouselItem className='h-full'>
                  <TermsStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onPrevious={handlePrevious}
                    isSubmitting={isSubmitting}
                  />
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </div>
        </div>

        {/* Right Column - Preview (existing code) */}
        {/* ... preview panel code ... */}
      </div>
    </ArtistRegistrationLayout>
  );
}
```

## Benefits of Refactoring

### Before (849 lines)
- All logic in one file
- Hard to test individual steps
- Validation scattered throughout
- Difficult to reuse step UIs
- Complex state management

### After (~150 main + 700 distributed)
- Clean orchestrator pattern
- Each step independently testable
- Centralized validation
- Reusable step components
- Separated concerns

## File Size Breakdown

| File | Lines | Purpose |
|------|-------|---------|
| ArtistRegisterRefactored.tsx | 150 | Main orchestrator |
| types/registration.ts | 60 | Type definitions |
| useArtistRegistrationValidation.ts | 80 | Validation logic |
| useArtistRegistrationSubmit.ts | 95 | API submission |
| useRegistrationStepper.ts | 60 | Step navigation |
| BasicDetailsStep.tsx | 75 | Step 1 UI |
| SocialImagesStep.tsx | 200 | Step 2 UI |
| MusicStep.tsx | 150 | Step 3 UI |
| TermsStep.tsx | 120 | Step 4 UI |
| RegistrationProgress.tsx | 50 | Progress indicator |
| **Total** | **1,040 lines** | **Across 10 files** |
| **Largest file** | **200 lines** | **76% reduction** |

## Migration Steps

1. **Create remaining step components** (SocialImagesStep, MusicStep, TermsStep)
2. **Create useRegistrationStepper hook**
3. **Create RegistrationProgress component** (optional)
4. **Create ArtistRegisterRefactored.tsx** using the template above
5. **Test all 4 steps thoroughly**
6. **Switch imports** when confident
7. **Delete old file**

## Testing Strategy

### Test Each Step Component
```typescript
describe('BasicDetailsStep', () => {
  it('should call onNext when form is valid', () => {
    const onNext = jest.fn();
    render(<BasicDetailsStep formData={validData} onInputChange={jest.fn()} onNext={onNext} />);

    fireEvent.click(screen.getByText('Next'));
    expect(onNext).toHaveBeenCalled();
  });
});
```

### Test Validation Hook
```typescript
describe('useArtistRegistrationValidation', () => {
  it('should invalidate empty stage name', () => {
    const { validateStep } = useArtistRegistrationValidation();
    const result = validateStep(0, { stageName: '', ... });

    expect(result).toBe(false);
  });
});
```

### Test Submission Hook
```typescript
describe('useArtistRegistrationSubmit', () => {
  it('should submit valid registration', async () => {
    const { submitRegistration } = useArtistRegistrationSubmit();
    const result = await submitRegistration(validFormData);

    expect(result).toBe(true);
  });
});
```

## Estimated Time

- **Remaining step components:** 3-4 hours
- **Hook creation:** 1 hour
- **Main component assembly:** 1 hour
- **Testing & refinement:** 2 hours
- **Total:** 7-8 hours

## Success Criteria

- [ ] All 4 step components created
- [ ] All hooks created and tested
- [ ] Main component orchestrates properly
- [ ] Carousel navigation works
- [ ] All validation works
- [ ] Submission successful
- [ ] No breaking changes to user flow
- [ ] Build succeeds
- [ ] All TypeScript errors resolved

## Notes

- The pattern is established with BasicDetailsStep
- Other steps follow the same structure
- Each step is 75-200 lines (vs 849 in one file)
- Hooks make logic testable and reusable
- Preview panel code can remain in main component or be extracted separately

---

**Status:** 40% complete (4/10 files created)
**Next:** Create remaining step components following BasicDetailsStep pattern
