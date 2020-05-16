import { ChatColor } from './utils'

export const CHAT_COLORS: ChatColor[] = [
	{ color: 'white', background: 'rgb(19, 27, 164)' },
	{ color: 'white', background: 'rgb(165, 65, 165)' },
	{ color: 'white', background: 'rgb(81, 101, 206)' },
	{ color: 'white', background: 'rgb(88, 165, 93)' },
	{ color: 'white', background: 'rgb(41, 42, 48)' },
	{ color: 'white', background: 'rgb(97, 177, 214)' },
	{ color: 'white', background: 'black' },
	{ color: 'white', background: 'rgb(236, 84, 40)' },
	{ color: 'white', background: 'rgb(31, 79, 97)' },
	{ color: '#233446', background: 'rgb(250, 253, 84)' }
]

export const DEFAULT_CHAT_COLOR: ChatColor = {
	color: '#233446',
	background: '#f0f1f8'
}

export const MAX_PARTICIPANT_COUNT = 10
