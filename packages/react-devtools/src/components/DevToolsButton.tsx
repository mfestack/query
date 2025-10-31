
interface DevToolsButtonProps {
  onClick: () => void
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  isOpen: boolean
}

export function DevToolsButton({ onClick, position, isOpen }: DevToolsButtonProps) {
  const positionClasses = {
    'top-left': 'appstack-devtools-button-top-left',
    'top-right': 'appstack-devtools-button-top-right',
    'bottom-left': 'appstack-devtools-button-bottom-left',
    'bottom-right': 'appstack-devtools-button-bottom-right',
  }

  return (
    <button
      className={`appstack-devtools-button ${positionClasses[position]} ${isOpen ? 'active' : ''}`}
      onClick={onClick}
      aria-label="Toggle AppStack Query DevTools"
      type="button"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {isOpen ? 'Close' : 'Open'} DevTools
    </button>
  )
}

