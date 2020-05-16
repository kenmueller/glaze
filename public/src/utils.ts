export interface ChatColor {
	color: string
	background: string
}

export const randomElement = <Element, Fallback>(array: Element[], fallback: Fallback) => {
	const index = array.length
		? Math.floor(Math.random() * array.length)
		: null
	
	return index === null
		? fallback
		: { index, value: array[index] }
}
