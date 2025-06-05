'use client'
import { createId } from '@paralleldrive/cuid2'
import type { SoundType } from '@repo/api/db/schemas'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'
import { useSoundsStore } from '~/store/useSoundsStore'
          
    

        


  export default function AddSoundButton({ type }: { type: SoundType }) {
    const { addSound, isAddMode, toggleAddMode } = useSoundsStore()
    const [name, setName] = useState('')
    const [link, setLink] = useState('')
    const [linkError, setLinkError] = useState('')

    // 1. Setup mutation
    const queryClient = useQueryClient()
    const { mutateAsync: createSound, status } = useMutation({
      mutationKey: ['userSounds'],
      mutationFn: async () => {
        const res = await api.user.sounds.$post({
          json: {
            id: createId(),        // or generate your own ID
            name: name,
            url: link,
            isCustom: true,
            soundType: type,
          },
        })
        if (!res.ok) {
          const { message } = await res.json().catch(() => ({ message: 'Unknown error' }))
          throw new Error(message)
        }
        return res.json()
      },
      onSuccess: (newSound) => {
        console.log("Sound sent to database")
        // 2. Push into store
        addSound(newSound.id, newSound.name, newSound.url, newSound.isCustom, type)
        // 3. Optional: invalidate or refetch userSounds
        queryClient.invalidateQueries({ queryKey: ['userSounds'] })
        toast.success('Sound added!')
      },
      onError: (err: any) => {
        toast.error(`Error adding sound: ${err.message}`)
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