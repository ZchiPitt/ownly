import { getColorHex, getColorTint, isLightColor } from '@/lib/colorUtils';

interface TagChipProps {
  label: string;
  isColor?: boolean;
  colorHex?: string | null;
  prefix?: string;
  className?: string;
}

export function TagChip({
  label,
  isColor,
  colorHex,
  prefix = '',
  className = '',
}: TagChipProps) {
  const detectedColorHex = getColorHex(label);
  const showColor = typeof isColor === 'boolean' ? isColor : detectedColorHex !== null;
  const resolvedColorHex = colorHex ?? detectedColorHex;
  const hasColor = showColor && !!resolvedColorHex;
  const tintStyle = hasColor && resolvedColorHex
    ? { backgroundColor: getColorTint(resolvedColorHex) }
    : undefined;
  const dotBorderClass = resolvedColorHex && isLightColor(resolvedColorHex)
    ? 'border border-gray-300'
    : 'border border-transparent';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
        hasColor ? 'text-gray-800' : 'bg-gray-100 text-gray-700'
      } ${className}`}
      style={tintStyle}
    >
      {hasColor && resolvedColorHex && (
        <span
          role="img"
          aria-label={`Color: ${label}`}
          className={`inline-block w-2 h-2 rounded-full ${dotBorderClass}`}
          style={{ backgroundColor: resolvedColorHex }}
        />
      )}
      <span className="truncate">{prefix}{label}</span>
    </span>
  );
}
