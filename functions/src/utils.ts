export const parseStringToBoolean = (data: any) => {
	switch (data) {
		case 'true':
			return true
		case 'false':
			return false
		default:
			throw new Error('Invalid argument')
	}
}
