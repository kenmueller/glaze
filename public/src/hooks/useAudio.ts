import { useMemo } from 'react'

export default (url: string, loop: boolean = false) =>
	useMemo(() => {
		const audio = new Audio(url)
		
		audio.loop = loop
		
		return [
			() => audio.play().catch(console.error),
			() => audio.pause()
		] as const
	}, [url, loop])
