import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingProps {
    value: number
    onChange: (value: number) => void
    className?: string
}

export function Rating({ value, onChange, className }: RatingProps) {
    return (
        <div className={cn("flex space-x-1", className)}>
            {[1, 2, 3, 4, 5].map((rating) => (
                <button
                    key={rating}
                    type="button"
                    onClick={() => onChange(rating)}
                    className="focus:outline-none"
                >
                    <Star
                        className={cn(
                            "w-6 h-6 transition-all",
                            rating <= value
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-transparent text-gray-300"
                        )}
                    />
                </button>
            ))}
        </div>
    )
}