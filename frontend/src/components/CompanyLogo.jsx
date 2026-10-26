import { useState } from 'react';

export default function CompanyLogo({ className = 'header-logo-img', alt = 'Don Bigote Logo' }) {
  // Trata de cargar primero logo.jpg, luego logo.png, luego fallback
  const [imgSrc, setImgSrc] = useState('/logo.jpg');
  const [failedCount, setFailedCount] = useState(0);

  const handleError = () => {
    if (failedCount === 0) {
      setImgSrc('/logo.png');
      setFailedCount(1);
    } else {
      setFailedCount(2); // ambos fallaron, usar fallback visual
    }
  };

  if (failedCount >= 2) {
    return (
      <div className={`${className} logo-placeholder-box`}>
        <span>🐟</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
