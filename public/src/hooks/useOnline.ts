import { useState, useEffect, useCallback } from 'react'

import firebase from '../firebase'

import 'firebase/firestore'

const firestore = firebase.firestore()

export default () => {
	const [onlineCount, setOnlineCount] = useState(null as number | null)
	
	useEffect(() => {
		firestore.doc('counts/online').onSnapshot(
			snapshot => {
				setOnlineCount(snapshot.get('value') ?? 0)
			},
			error => {
				alert(error.message)
				console.error(error)
			}
		)
	}, [])
	
	return {
		onlineCount,
		setIsOnline: useCallback((isOnline: boolean) => {
			navigator.sendBeacon(
				'https://glaze.chat/api/online',
				isOnline.toString()
			)
		}, [])
	}
}
