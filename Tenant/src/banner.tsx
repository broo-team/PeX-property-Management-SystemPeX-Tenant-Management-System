import { Image } from "lucide-react"

export default function Banner() {
  return (
    <div className="w-full flex justify-center items-center py-4 px-4 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-6xl aspect-[21/9]">
        <Image
          src="/placeholder.svg?height=720&width=1680"
          alt="Banner Image"
 
          className="object-cover rounded-lg"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1080px"
          priority
        />
      </div>
    </div>
  )
}