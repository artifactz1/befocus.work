// import { Button, type ButtonProps } from '@repo/ui/button';
// import { cn } from '@repo/ui/lib/utils'; // If you're using a utility like `clsx` or `cn`

// type MenuButtonProps = ButtonProps & {
//   children: React.ReactNode
// }

// export default function MenuButton({ children, className, ...props }: MenuButtonProps) {
//   return (
//     <Button
//       variant="outline"
//       size="lg"
//       className={cn(' lg:w-20 lg:h-10 xl:h-12 xl:w-32', className)}
//       {...props}
//     >
//       {children}
//     </Button>
//   )
// }

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
      className={cn('lg:w-20 lg:h-10 xl:h-12 xl:w-32', className)}
      {...props} // this includes onClick, variant, size, etc.
      variant="outline"
      size="lg"
    >
      {children}
    </Button>
  )
}
