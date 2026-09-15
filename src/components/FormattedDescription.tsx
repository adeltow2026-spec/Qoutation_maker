import React from 'react';

interface FormattedDescriptionProps {
  description: string;
  isPrint?: boolean;
}

export const MANDATORY_COMPLIANCE_NOTE =
  'All work executed as per approved 2D shop drawings, specifications, and approved physical control samples.';

export const FormattedDescription: React.FC<FormattedDescriptionProps> = ({
  description,
  isPrint = false,
}) => {
  const userText = (description || '').trim();

  // Check if user already included the compliance note in their description text
  const alreadyIncludesCompliance = userText.toLowerCase().includes('approved 2d shop drawings');

  return (
    <div className={`space-y-1.5 ${isPrint ? 'mt-1 text-[11px]' : 'mt-1 text-xs'}`}>
      {userText && (
        <div className={`text-slate-800 leading-relaxed whitespace-pre-line ${isPrint ? 'text-[11px]' : 'text-xs'}`}>
          {userText}
        </div>
      )}
      {!alreadyIncludesCompliance && (
        <div className={`text-slate-600 font-medium ${isPrint ? 'text-[10.5px]' : 'text-[11px]'}`}>
          {MANDATORY_COMPLIANCE_NOTE}
        </div>
      )}
    </div>
  );
};
