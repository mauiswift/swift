import * as React from 'react';
import { Button, type ButtonProps } from './button';

export interface IconButtonProps extends Omit<ButtonProps, 'aria-label' | 'title' | 'size'> {
  label: string;
  title?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, title = label, children, ...props }, ref) => (
    <Button
      {...props}
      ref={ref}
      size="icon"
      aria-label={label}
      title={title}
    >
      {children}
    </Button>
  )
);

IconButton.displayName = 'IconButton';

export { IconButton };
