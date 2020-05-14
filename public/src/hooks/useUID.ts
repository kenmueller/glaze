import { useRef } from 'react'
import { v4 as uuid } from 'uuid'

export default () => {
	const uid = useRef(uuid())
	
	return uid.current
}
