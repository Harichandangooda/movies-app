import { useState } from 'react'
import { Film } from 'lucide-react'
import { imageUrl } from '../../utils/movies'

export function Poster({ path, eager = false }: { path: string; eager?: boolean }) {
  const [failed, setFailed] = useState('')
  const src = imageUrl(path, 'w500')
  return <div className="poster">
    {src && failed !== path ? <img src={src} srcSet={imageUrl(path, 'w342') + ' 342w, ' + src + ' 500w'}
      sizes={eager ? '(max-width: 640px) 160px, 270px' : '(max-width: 640px) 43vw, 210px'}
      alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(path)} />
      : <Film aria-hidden="true" />}
  </div>
}

export function Backdrop({ backdrop, poster }: { backdrop: string; poster: string }) {
  const [failedBackdrop, setFailedBackdrop] = useState(false)
  const [failedPoster, setFailedPoster] = useState(false)
  const wide = !failedBackdrop && imageUrl(backdrop, 'w1280')
  const fallback = !failedPoster && imageUrl(poster, 'w780')
  if (!wide && !fallback) return null
  return <img className={'backdrop' + (wide ? '' : ' backdrop-poster')} src={wide || fallback || undefined}
    srcSet={wide ? imageUrl(backdrop, 'w780') + ' 780w, ' + wide + ' 1280w, ' + imageUrl(backdrop, 'original') + ' 1920w' : undefined}
    sizes="100vw" alt="" fetchPriority="high"
    onError={() => wide ? setFailedBackdrop(true) : setFailedPoster(true)} />
}
