// Tour System Type Definitions

/**
 * Tour status values
 */
export type TourStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

/**
 * Tour step placement options
 */
export type TourStepPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

/**
 * Tour interaction types for interactive steps
 */
export type TourInteractionType = 'click' | 'input' | 'select' | 'hover';

/**
 * Tour event types for analytics
 */
export type TourEventType = 
  | 'started' 
  | 'completed' 
  | 'skipped' 
  | 'hint_shown' 
  | 'step_completed' 
  | 'step_skipped';

/**
 * Tour category for grouping tours
 */
export type TourCategory = 'getting-started' | 'daily-tasks' | 'advanced';

/**
 * Page identifiers for tour association
 */
export type TourPageId = 
  | 'dashboard' 
  | 'pos' 
  | 'inventory' 
  | 'transactions' 
  | 'purchase-orders' 
  | 'returns' 
  | 'users';

/**
 * Individual step within a tour
 */
export interface TourStep {
  id: string;
  title: string;
  content: string;
  targetSelector: string; // CSS selector for element to highlight
  placement: TourStepPlacement;
  isInteractive: boolean;
  interactionType?: TourInteractionType;
  validationFn?: () => boolean; // Function to validate user action
  beforeStep?: () => void | Promise<void>; // Hook to run before showing step
  afterStep?: () => void | Promise<void>; // Hook to run after completing step
  keyboardShortcut?: string; // Keyboard shortcut to display
  hintText?: string; // Hint to show if user is stuck
}

/**
 * Complete tour definition
 */
export interface Tour {
  id: string;
  title: string;
  description: string;
  pageId: TourPageId;
  requiredRole?: 'admin' | 'sales_person'; // If undefined, available to all roles
  category: TourCategory;
  estimatedDuration: number; // Duration in minutes
  steps: TourStep[];
}

/**
 * User's progress through a specific tour
 */
export interface UserTourProgress {
  id: string;
  user_id: string;
  tenant_id: string;
  tour_id: string;
  status: TourStatus;
  current_step: number;
  total_steps: number;
  completed_at?: string;
  started_at?: string;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string;
}

/**
 * Dismissed help hint record
 */
export interface UserTourHintDismissed {
  id: string;
  user_id: string;
  tenant_id: string;
  hint_id: string;
  dismissed_at: string;
}

/**
 * Tour analytics event record
 */
export interface TourAnalyticsEvent {
  id: string;
  tenant_id: string;
  tour_id: string;
  step_id?: string;
  event_type: TourEventType;
  user_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * User tour statistics
 */
export interface UserTourStats {
  total_tours: number;
  completed_tours: number;
  in_progress_tours: number;
  skipped_tours: number;
  completion_percentage: number;
}

/**
 * Tour context value provided by TourProvider
 */
export interface TourContextValue {
  // Current tour state
  activeTour: Tour | null;
  currentStep: number;
  isActive: boolean;
  isPaused: boolean;
  
  // Tour control methods
  startTour: (tourId: string) => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  skipTour: () => Promise<void>;
  pauseTour: () => void;
  resumeTour: () => void;
  completeTour: () => Promise<void>;
  goToStep: (stepIndex: number) => void;
  
  // Tour progress
  userProgress: UserTourProgress[];
  userStats: UserTourStats | null;
  markTourComplete: (tourId: string) => Promise<void>;
  resetProgress: () => Promise<void>;
  
  // Help system
  showHelp: (pageId: TourPageId) => void;
  hideHelp: () => void;
  isHelpVisible: boolean;
  
  // Hint management
  dismissedHints: string[];
  dismissHint: (hintId: string) => Promise<void>;
  isHintDismissed: (hintId: string) => boolean;
  
  // Element registration for tours
  registerElement: (key: string, element: HTMLElement | null) => void;
  getElement: (key: string) => HTMLElement | null;
}

/**
 * Tour overlay component props
 */
export interface TourOverlayProps {
  targetElement: HTMLElement | null;
  isActive: boolean;
  onClickOutside?: () => void;
}

/**
 * Tour tooltip component props
 */
export interface TourTooltipProps {
  step: TourStep;
  currentStepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  position: { x: number; y: number };
  placement: TourStepPlacement;
}

/**
 * Tour help button component props
 */
export interface TourHelpButtonProps {
  pageId: TourPageId;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * Tour menu component props
 */
export interface TourMenuProps {
  pageId: TourPageId;
  tours: Tour[];
  userProgress: UserTourProgress[];
  onSelectTour: (tourId: string) => void;
  onClose: () => void;
}

/**
 * Tour progress dashboard component props
 */
export interface TourProgressDashboardProps {
  allTours: Tour[];
  userProgress: UserTourProgress[];
  userStats: UserTourStats | null;
  onStartTour: (tourId: string) => void;
}

/**
 * Welcome modal component props
 */
export interface WelcomeModalProps {
  userRole: 'admin' | 'sales_person';
  onStartTour: () => void;
  onSkip: () => void;
  onRemindLater: () => void;
}

/**
 * Tour step validator interface
 */
export interface TourStepValidator {
  validateStep: (step: TourStep) => boolean;
  waitForAction: (step: TourStep, timeout: number) => Promise<boolean>;
  provideHint: (step: TourStep) => void;
}

/**
 * Tour search result
 */
export interface TourSearchResult {
  tour: Tour;
  step?: TourStep;
  matchType: 'title' | 'description' | 'step-content';
  matchText: string;
}

/**
 * Tour analytics aggregated data
 */
export interface TourAnalytics {
  tour_id: string;
  tour_title: string;
  total_starts: number;
  total_completions: number;
  total_skips: number;
  completion_rate: number;
  average_time_seconds: number;
  most_skipped_step?: {
    step_id: string;
    skip_count: number;
  };
}

/**
 * Registered tour elements map
 */
export type TourElementsMap = Map<string, HTMLElement | null>;

/**
 * Tour provider props
 */
export interface TourProviderProps {
  children: React.ReactNode;
  pageId?: TourPageId;
}
