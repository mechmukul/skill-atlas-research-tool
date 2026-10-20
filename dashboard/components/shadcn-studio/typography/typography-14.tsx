import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const PaperTypography = ({ className, ...props }: ComponentProps<'p'>) => (
  <p
    className={cn('paper-dropcap first-letter:text-foreground w-full max-w-xl text-justify first-letter:float-left first-letter:me-3 first-letter:text-7xl first-letter:font-bold', className)}
    {...props}
  />
)

const TypographyFirstLetterDemo = () => {
  return (
    <PaperTypography>
      Once overlooked, the record now sings of small summers, quiet kitchens, and bright-remembered nights. Its grooves
      carry a map of memory, each crack a moment worth revisiting. I trace the edges with a careful thumb, and the room
      blooms with songs that used to belong only to the past.
    </PaperTypography>
  )
}

export default TypographyFirstLetterDemo
