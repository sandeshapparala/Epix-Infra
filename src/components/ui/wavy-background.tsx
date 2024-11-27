'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export const WavyBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight

        let frequency = 0.001
        const waves = {
            y: canvas.height / 2,
            length: 0.01,
            amplitude: 100,
            frequency: 0.01,
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.beginPath()
            ctx.moveTo(0, canvas.height / 2)

            for (let i = 0; i < canvas.width; i++) {
                ctx.lineTo(
                    i,
                    waves.y + Math.sin(i * waves.length + frequency) * waves.amplitude
                )
            }

            ctx.strokeStyle = 'rgba(200, 180, 150, 0.1)'
            ctx.stroke()
            frequency += waves.frequency

            requestAnimationFrame(animate)
        }

        animate()

        return () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full opacity-20"
        />
    )
}

