import { Button, type ButtonProps } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'

type MenuButtonProps = Omit<ButtonProps, 'variant'> & {
  children: React.ReactNode
  appearance?: 'bare' | 'outline'
}

export default function MenuButton({
  children,
  className,
  appearance = 'bare',
  ...props
}: MenuButtonProps) {
  return (
    <Button
      variant={appearance === 'outline' ? 'outline' : 'ghost'}
      className={cn(
        'md:w-20 lg:w-24 lg:h-12 xl:h-12 xl:w-32',
        appearance === 'bare' &&
          'min-h-11 min-w-11 text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
