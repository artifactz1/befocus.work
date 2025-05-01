'use client'
import type { SoundType } from '@repo/api/db/schemas'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useState } from 'react'
import { useSoundsStore } from '~/store/useSoundsStore'



export default function AddSoundButton({type} : {type : SoundType } ) {
  const { addSound, isAddMode, toggleAddMode } = useSoundsStore()
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [linkError, setLinkError] = useState('')

  const validateYoutubeLink = (url: string) => {
    // Regular expression to match YouTube URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    return youtubeRegex.test(url)
  }

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLink = e.target.value
    setLink(newLink)

    if (newLink && !validateYoutubeLink(newLink)) {
      setLinkError('Please enter a valid YouTube link')
    } else {
      setLinkError('')
    }
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      setLinkError('Please enter a sound name')
      return
    }

    if (!validateYoutubeLink(link)) {
      setLinkError('Please enter a valid YouTube link')
      return
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks

    addSound(name, link, false, type)

    setName('')
    setLink('')
    setLinkError('')
    toggleAddMode()
  }

  return (
    <main>
      {isAddMode && (
        <div className='flex flex-col space-y-4 py-6'>
          <div className='space-y-2'>
            <Label htmlFor='name' className='text-left'>
              {
                type === 'bgMusic' ? 'Background Music Name' : 'Ambient Sound Name'
              }
            </Label>
            <Input
              id='name'
              value={name}
              onChange={e => setName(e.target.value)}
              className='col-span-3 border-white'
              placeholder='Enter sound name'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='youtube-link' className='text-right'>
              YouTube Link
            </Label>
            <Input
              id='youtube-link'
              value={link}
              onChange={handleLinkChange}
              className={linkError ? 'border-red-500' : 'border-white'}
              placeholder='https://youtube.com/...'
            />
          </div>

          <Button
            type='submit'
            onClick={handleSubmit}
            disabled={!name.trim() || !link.trim() || !!linkError}
          >
            Add
          </Button>
        </div>
      )}
    </main>
  )
}
