'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const images = [
    '/placeholder.svg?height=200&width=200',
    '/placeholder.svg?height=200&width=200',
    '/placeholder.svg?height=200&width=200',
    '/placeholder.svg?height=200&width=200',
    '/placeholder.svg?height=200&width=200',
    '/placeholder.svg?height=200&width=200',
]

export const ImageGrid = () => {
    return (
        <div className="grid grid-cols-3 gap-2">
            {images.map((src, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative aspect-square"
                >
                    <Image
                        src={src}
                        alt={`Work ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                    />
                </motion.div>
            ))}
        </div>
    )
}

