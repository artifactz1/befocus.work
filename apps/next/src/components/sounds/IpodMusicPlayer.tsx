'use client'

import { Button } from '@repo/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react"
import Image from 'next/image'
import { type TouchEvent, useRef, useState } from "react"
import { cn } from '~/lib/utils'
// import { useMobile } from "@/hooks/use-mobile"
import { useSoundsStore } from "~/store/useSoundsStore"

interface Album {
  id: string       // soundId from your store
  title: string    // we’ll just use id as title
  cover?: string   // optional; you can swap in your own URL
}

export default function IpodMusicPlayer() {
  const { sounds, toggleSound } = useSoundsStore()
  const entries = Object.entries(sounds).filter(([, s]) => s.soundType === 'bgMusic')
  const albums: Album[] = entries.map(([id]) => ({
    id,
    title: id,
    cover: '/placeholder-album-cover.png',
  }))

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<"left" | "right" | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const minSwipeDistance = 50
  // const isMobile = useMobile()
  const carouselRef = useRef<HTMLDivElement>(null)

  // read playing state directly from store
  const isPlaying = Boolean(
    albums[currentIndex] &&
    sounds[albums[currentIndex].id]?.playing
  )

  const handleNext = () => {
    if (isTransitioning || albums.length < 2) return
    setTransitionDirection("left")
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(i => i === albums.length - 1 ? 0 : i + 1)
      setTimeout(() => {
        setIsTransitioning(false)
        setTransitionDirection(null)
      }, 300)
    }, 300)
  }

  const handlePrev = () => {
    if (isTransitioning || albums.length < 2) return
    setTransitionDirection("right")
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(i => i === 0 ? albums.length - 1 : i - 1)
      setTimeout(() => {
        setIsTransitioning(false)
        setTransitionDirection(null)
      }, 300)
    }, 300)
  }

  const togglePlay = () => {
    const id = albums[currentIndex]?.id
    if (id) toggleSound(id)
  }

  // const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
  //   setTouchEnd(null)
  //   setTouchStart(e.targetTouches[0].clientX)
  // }
  // const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
  //   setTouchEnd(e.targetTouches[0].clientX)
  // }

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null)
    const first = e.touches[0]
    if (first) setTouchStart(first.clientX)
  }

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const first = e.touches[0]
    if (first) setTouchEnd(first.clientX)
  }

  const onTouchEnd = () => {
    if (touchStart == null || touchEnd == null) return
    const dist = touchStart - touchEnd
    if (dist > minSwipeDistance) handleNext()
    if (dist < -minSwipeDistance) handlePrev()
    setTouchStart(null)
    setTouchEnd(null)
  }

  const getTransitionClass = (index: number) => {
    if (!isTransitioning) return ""
    if (index === currentIndex) {
      return transitionDirection === "left"
        ? "animate-slide-out-left"
        : "animate-slide-out-right"
    }
    const target = transitionDirection === "left"
      ? (currentIndex === albums.length - 1 ? 0 : currentIndex + 1)
      : (currentIndex === 0 ? albums.length - 1 : currentIndex - 1)
    if (index === target) {
      return transitionDirection === "left"
        ? "animate-slide-in-right"
        : "animate-slide-in-left"
    }
    return ""
  }

  return (
    <div className="flex flex-col items-center max-w-md w-full mx-auto">
      <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-[24px] w-full shadow-xl border-2 border-amber-200 overflow-hidden pb-6">
        {/* Header */}
        <div className="bg-gradient-to-b from-amber-100 to-amber-200 p-4 border-b border-amber-300">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-amber-900">Music Player</h2>
            <div className="text-xs text-amber-700">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div
          className="relative overflow-hidden bg-gradient-to-b from-amber-800 to-amber-950 h-72 w-full"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div ref={carouselRef} className="flex h-full w-full relative">
            {albums.map((album, i) => (
              <div
                key={album.id}
                className={cn(
                  "absolute top-0 left-0 w-full h-full flex items-center justify-center transition-all duration-300",
                  i === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0",
                  getTransitionClass(i)
                )}
              >
                <div className="p-4 flex flex-col items-center">
                  <div className="relative">
                    <div
                      className={cn(
                        "w-56 h-56 rounded-full bg-black shadow-2xl relative overflow-hidden",
                        i === currentIndex && isPlaying ? "animate-spin-slow" : ""
                      )}
                    >
                      {/* grooves + background art */}
                      <div className="absolute inset-0 opacity-20">
                        {/* <Image
                          src={album.cover}
                          alt={album.title}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        /> */}
                        <div className="w-full h-full object-cover">
                          A
                        </div>
                      </div>
                      {/* label */}
                      <div className="absolute inset-0 m-auto w-20 h-20 rounded-full overflow-hidden border-4 border-gray-700 z-20">
                        {/* <Image
                          src={album.cover}
                          alt={album.title}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        /> */}
                        <div className="w-full h-full object-cover">
                          A
                        </div>
                      </div>
                      <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-amber-100 border border-gray-700 z-30" />
                    </div>

                    {/* arm */}
                    <div
                      className={cn(
                        "absolute top-4 -right-4 w-24 h-4 bg-amber-300 rounded-r-full origin-left transition-all duration-500 z-40",
                        i === currentIndex && isPlaying ? "rotate-25" : "rotate-0"
                      )}
                    >
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-900" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 z-50">
            {albums.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  i === currentIndex ? "bg-amber-100 w-4" : "bg-amber-100/50"
                )}
              />
            ))}
          </div>

          {/* Arrows */}
          <Button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-amber-800/50 rounded-full p-1 backdrop-blur-sm z-50"
          >
            <ChevronLeft className="h-5 w-5 text-amber-100" />
          </Button>
          <Button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-800/50 rounded-full p-1 backdrop-blur-sm z-50"
          >
            <ChevronRight className="h-5 w-5 text-amber-100" />
          </Button>
        </div>

        {/* Info */}
        <div className="bg-gradient-to-b from-amber-100 to-amber-200 p-4 border-t border-b border-amber-300">
          <div className="text-center">
            <h3 className="font-semibold text-amber-900">
              {albums[currentIndex]?.title}
            </h3>
          </div>
        </div>

        {/* Wheel */}
        <div className="mt-6 relative">
          <div className="w-64 h-64 mx-auto bg-gradient-to-b from-amber-200 to-amber-300 rounded-full border border-amber-400 flex items-center justify-center">
            <Button
              onClick={togglePlay}
              className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 text-amber-900"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
            <Button
              onClick={handleNext}
              className="absolute top-1/2 right-6 -translate-y-1/2 text-amber-900"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
            <Button
              onClick={handlePrev}
              className="absolute top-1/2 left-6 -translate-y-1/2 text-amber-900"
            >
              <SkipBack className="h-6 w-6" />
            </Button>
            <Button
              onClick={() => { }}
              className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-900"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}