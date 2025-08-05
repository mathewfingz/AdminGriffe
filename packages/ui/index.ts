// UI Components Package
// This package will contain reusable UI components

export const UI_PACKAGE_VERSION = '0.1.0';

// Export all components
export { Button, type ButtonProps } from './components/Button';
export { Input, type InputProps } from './components/Input';
export { Label, type LabelProps } from './components/Label';
export { PasswordInput, type PasswordInputProps } from './components/PasswordInput';
export { GoogleIcon, type GoogleIconProps } from './components/GoogleIcon';

// Store View Components (STEP 3-T.0)
export { CSVImporter, type CSVImporterProps } from './components/CSVImporter';
export { TableToolbar, type TableToolbarProps, type FilterOption, type BulkAction } from './components/TableToolbar';
export { MetricsCard, type MetricsCardProps, MetricsPresets } from './components/MetricsCard';
export { StockBadge, type StockBadgeProps, MultiStockBadge, type MultiStockBadgeProps, getStockStatus, StockPresets } from './components/StockBadge';
export { ChatFloat, type ChatFloatProps, type ChatMessage } from './components/ChatFloat';