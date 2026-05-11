import { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const Input = forwardRef(({
  label,
  error,
  success,
  helpText,
  required,
  disabled,
  prefix,
  suffix,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  const baseClass = 'input';
  const stateClass = error ? 'input-error' : success ? 'input-success' : '';

  return (
    <div className="w-full">
      {label && (
        <label className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-md text-slate-500 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={`${baseClass} ${stateClass} ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-md text-slate-500 pointer-events-none">
            {suffix}
          </span>
        )}
        {error && (
          <AlertCircle className="absolute right-md w-4 h-4 text-error pointer-events-none" />
        )}
        {success && (
          <CheckCircle className="absolute right-md w-4 h-4 text-success pointer-events-none" />
        )}
      </div>
      {(error || helpText) && (
        <p className={error ? 'help-text-error' : 'help-text'}>
          {error || helpText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({
  label,
  error,
  success,
  helpText,
  required,
  disabled,
  rows = 4,
  className = '',
  ...props
}, ref) => {
  const stateClass = error ? 'input-error' : success ? 'input-success' : '';

  return (
    <div className="w-full">
      {label && (
        <label className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        disabled={disabled}
        rows={rows}
        className={`textarea ${stateClass} ${className}`}
        {...props}
      />
      {(error || helpText) && (
        <p className={error ? 'help-text-error' : 'help-text'}>
          {error || helpText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(({
  label,
  error,
  helpText,
  required,
  disabled,
  options = [],
  className = '',
  ...props
}, ref) => {
  const stateClass = error ? 'input-error' : '';

  return (
    <div className="w-full">
      {label && (
        <label className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        disabled={disabled}
        className={`select ${stateClass} ${className}`}
        {...props}
      >
        {options.map(({ value, label: optLabel, disabled: optDisabled }) => (
          <option key={value} value={value} disabled={optDisabled}>
            {optLabel}
          </option>
        ))}
      </select>
      {(error || helpText) && (
        <p className={error ? 'help-text-error' : 'help-text'}>
          {error || helpText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export const Checkbox = forwardRef(({
  label,
  error,
  helpText,
  disabled,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      <label className="flex items-center gap-md cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className={`w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary disabled:bg-slate-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {label && <span className="text-body text-slate-900">{label}</span>}
      </label>
      {(error || helpText) && (
        <p className={error ? 'help-text-error' : 'help-text'}>
          {error || helpText}
        </p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
