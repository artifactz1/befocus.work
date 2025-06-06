import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { Minus, Plus } from 'lucide-react'
import Counter from './Counter'

interface BreakDurationInputProps {
  value: number
  onChange: (value: number) => void
}

export const BreakDurationInput: React.FC<BreakDurationInputProps> = ({ value, onChange }) => {
  const increment = () => {
    console.log('Before increment:', value)
    onChange(value * 60 + 300)
    console.log('After increment:', value)
  }

  const decrement = () => {
    if (value > 5) {
      onChange(value * 60 - 300)
    } else {
      onChange(300)
    }
  }

  return (
    <div className='flex justify-between'>
      <div className='flex items-end'>
        <Label htmlFor='workDuration' className='text-md pb-3 font-bold'>
          Break Duration :
        </Label>
        <Counter value={value} />
        <div className='pb-3'>(min)</div>
      </div>
      <div className='flex items-end space-x-2 pb-3'>
        <Button onClick={decrement} variant='secondary' size='icon'>
          <Minus height={12} width={12} />
        </Button>
        <Button onClick={increment} variant='secondary' size='icon'>
          <Plus height={12} width={12} />
        </Button>
      </div>
    </div>
  )
}
