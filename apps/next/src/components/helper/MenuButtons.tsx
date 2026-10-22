import { Button, type ButtonProps } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { forwardRef } from 'react'

type MenuButtonProps = Omit<ButtonProps, 'variant'> & {
  children: React.ReactNode
  appearance?: 'bare' | 'outline'
}

// forwardRef: Radix triggers (asChild) and the hold tray need the DOM node.
const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(function MenuButton(
  { children, className, appearance = 'bare', ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant={appearance === 'outline' ? 'outline' : 'ghost'}
      className={cn(
        'md:w-16 lg:w-24 lg:h-12 xl:h-12 xl:w-32',
        appearance === 'bare' &&
          'min-h-11 min-w-11 text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )
})

export default MenuButton
