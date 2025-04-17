import { Button, type ButtonProps } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'

type MenuButtonProps = ButtonProps & {
  children: React.ReactNode
}

export default function MenuButton({
  children,
  className,
  ...props
}: MenuButtonProps) {
  return (
    <Button
      className={cn('md:w-20 lg:w-24 lg:h-12 xl:h-12 xl:w-32 ', className)}
      {...props} // this includes onClick, variant, size, etc.
      variant="outline"
    >
      {children}
    </Button>
  )
}
