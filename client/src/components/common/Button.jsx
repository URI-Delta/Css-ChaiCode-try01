import clsx from 'clsx';

/** variant: primary | secondary | ghost | pro | danger; size: sm | md */
export default function Button({ variant = 'primary', size = 'md', className, loading, children, ...props }) {
  return (
    <button
      className={clsx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : null}
      {children}
    </button>
  );
}
