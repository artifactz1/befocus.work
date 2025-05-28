'use client'

import { createId } from '@paralleldrive/cuid2'
import type { SoundType } from '@repo/api/db/schemas'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSound } from '~/hooks/useSounds'
import { api } from '~/lib/api.client'
import { useSoundsStore } from '~/store/useSoundsStore'


export default function AddSoundButton({ type }: { type: SoundType }) {
  const { addSound, isAddMode, toggleAddMode } = useSoundsStore()
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [linkError, setLinkError] = useState('')

  // ✅ Hook call with current name, link, type
  const { mutateAsync: createSound, status } = useSound({
    name,
    url: link,
    type,
    onSuccessCallback: newSound => {
      addSound(newSound.id, newSound.name, newSound.url, newSound.isCustom, type)
    },
  })
  

  const validateYoutubeLink = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    return youtubeRegex.test(url)
  }

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLink = e.target.value
    setLink(newLink)
    setLinkError(newLink && !validateYoutubeLink(newLink) ? 'Please enter a valid YouTube link' : '')
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setLinkError('Please enter a sound name')
      return
    }
    if (!validateYoutubeLink(link)) {
      setLinkError('Please enter a valid YouTube link')
      return
    }

    await createSound()

    // clear form
    setName('')
    setLink('')
    setLinkError('')
    toggleAddMode()
  }

  return (
    <main>
      {isAddMode && (
        <div className="flex flex-col space-y-4 py-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-left">
              {type === 'bgMusic' ? 'Background Music Name' : 'Ambient Sound Name'}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 border-white"
              placeholder="Enter sound name"
            />
          </div>
          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="youtube-link" className="text-right">
              YouTube Link
            </Label>
            <Input
              id="youtube-link"
              value={link}
              onChange={handleLinkChange}
              className={linkError ? 'border-red-500' : 'border-white'}
              placeholder="https://youtube.com/..."
            />
          </div>
          {/* Submit */}
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={
              !name.trim() ||
              !link.trim() ||
              !!linkError ||
              status === 'pending'
            }
          >
            {status === 'pending' ? 'Adding…' : 'Add'}
          </Button>
        </div>
      )}
    </main>
  )
}
