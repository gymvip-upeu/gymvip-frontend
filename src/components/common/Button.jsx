// ==============================================================================
// GYM VIP — Componente Reutilizable: Button
// ==============================================================================

import React from 'react';

export function Button({
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  disabled = false,
  onClick,
  style,
  className = '',
  title,
  children,
  ...props
}) {
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-secondary';
  return (
    <button
      type={type}
      className={`btn ${variantClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      style={style}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
