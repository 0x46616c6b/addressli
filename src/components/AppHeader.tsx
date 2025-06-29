import React from "react";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AppHeader({
  title = "adressli",
  subtitle = "Transform your CSV address data into map-ready coordinates (GeoJSON).",
  className = "",
}: AppHeaderProps): React.JSX.Element {
  return (
    <header className={`text-center ${className}`}>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
        <span className="text-blue-600 mr-2 sm:mr-3" aria-hidden="true">
          🗺️
        </span>
        {title}
      </h1>
      <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">{subtitle}</p>
    </header>
  );
}
