import React from "react";

export type AppStep = "upload" | "preview" | "processing" | "results";

interface MultiStepIndicatorProps {
  readonly currentStep: AppStep;
  readonly className?: string;
}

const stepConfig = {
  upload: { label: "Upload", order: 0 },
  preview: { label: "Preview & Map", order: 1 },
  processing: { label: "Processing", order: 2 },
  results: { label: "Results", order: 3 },
} as const;

export function MultiStepIndicator({ currentStep, className = "" }: Readonly<MultiStepIndicatorProps>): React.JSX.Element {
  const steps = Object.entries(stepConfig) as [AppStep, (typeof stepConfig)[AppStep]][];
  const currentStepOrder = stepConfig[currentStep].order;

  const getStepStyles = (isActive: boolean, isCompleted: boolean): string => {
    if (isActive) return "bg-blue-600 text-white";
    if (isCompleted) return "bg-green-600 text-white";
    return "bg-gray-300 text-gray-600";
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile View - Vertical */}
      <div className="flex flex-col space-y-3 sm:hidden">
        {steps.map(([stepKey, stepData]) => {
          const isActive = stepKey === currentStep;
          const isCompleted = currentStepOrder > stepData.order;

          return (
            <div key={stepKey} className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                  ${getStepStyles(isActive, isCompleted)}
                `}
                aria-current={isActive ? "step" : undefined}
                aria-label={isActive ? "current step" : undefined}
              >
                {isCompleted ? "✓" : stepData.order + 1}
              </div>
              <span className={`ml-3 text-sm ${isActive ? "text-blue-600 font-medium" : "text-gray-600"}`}>{stepData.label}</span>
            </div>
          );
        })}
      </div>

      {/* Desktop/Tablet View - Horizontal */}
      <div className="hidden sm:flex items-center justify-center space-x-2 md:space-x-4">
        {steps.map(([stepKey, stepData], index) => {
          const isActive = stepKey === currentStep;
          const isCompleted = currentStepOrder > stepData.order;

          return (
            <React.Fragment key={stepKey}>
              <div className="flex items-center">
                <div
                  className={`
                    flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-xs md:text-sm font-medium
                    ${getStepStyles(isActive, isCompleted)}
                  `}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={isActive ? "current step" : undefined}
                >
                  {isCompleted ? "✓" : stepData.order + 1}
                </div>
                <span className={`ml-2 text-xs md:text-sm ${isActive ? "text-blue-600 font-medium" : "text-gray-500"}`}>{stepData.label}</span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-6 md:w-8 h-0.5 
                    ${isCompleted && currentStepOrder > stepData.order + 1 ? "bg-green-600" : "bg-gray-300"}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
