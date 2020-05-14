import { useState, useCallback, useEffect } from 'react'

import firebase from '../firebase'
import useUID from './useUID'

import 'firebase/firestore'

export interface Message {
	id: string
	didSend: boolean
	data: string
}

const { FieldValue } = firebase.firestore
const firestore = firebase.firestore()

export default () => {
	const [isReady, setIsReady] = useState(false)
	const [chatId, setChatId] = useState(null as string | null)
	
	const [isTyping, setIsTyping] = useState(false)
	const [messages, setMessages] = useState([] as Message[])
	
	const uid = useUID()
	
	const loadChat = useCallback(async () => {
		const { empty, docs } = await firestore
			.collection('chats')
			.where('available', '==', true)
			.limit(1)
			.get()
		
		const batch = firestore.batch()
		const requestDoc = firestore.doc(`requests/${uid}`)
		
		if (empty) {
			const chatDoc = firestore.collection('chats').doc()
			
			batch.set(chatDoc, {
				available: true,
				creator: uid
			})
			
			batch.set(requestDoc, {
				available: true,
				chat: chatDoc.id
			})
		} else {
			const snapshot = docs[0]
			
			batch.update(snapshot.ref, {
				available: false
			})
			
			const requestData = {
				available: false,
				chat: snapshot.id
			}
			
			batch.set(requestDoc, requestData)
			batch.set(
				firestore.doc(`requests/${snapshot.get('creator')}`),
				requestData
			)
		}
		
		return batch.commit()
	}, [uid])
	
	useEffect(() => (
		firestore.doc(`requests/${uid}`).onSnapshot(
			snapshot => {
				setIsReady(snapshot.exists && !snapshot.get('available'))
				setChatId(snapshot.get('chat') ?? null)
			},
			error => {
				alert(error.message)
				console.error(error)
			}
		)
	), [uid])
	
	useEffect(() => {
		if (!chatId)
			return void loadChat()
		
		const removeChatListener = firestore
			.doc(`chats/${chatId}`)
			.onSnapshot(
				snapshot => {
					if (!snapshot.exists)
						return firestore.doc(`requests/${uid}`).set({
							available: false
						})
					
					for (const key of snapshot.get('typing') ?? [])
						if (key !== uid)
							return setIsTyping(true)
					
					setIsTyping(false)
				},
				error => {
					alert(error.message)
					console.error(error)
				}
			)
		
		const removeMessagesListener = firestore
			.collection(`chats/${chatId}/messages`)
			.onSnapshot(
				snapshot => {
					for (const { type, doc } of snapshot.docChanges()) {
						const { id } = doc
						
						switch (type) {
							case 'added':
								setMessages(messages => [
									...messages,
									{
										id,
										didSend: doc.get('from') === uid,
										data: doc.get('data')
									}
								])
								break
							case 'removed':
								setMessages(messages =>
									messages.filter(message => message.id !== id)
								)
								break
						}
					}
				},
				error => {
					alert(error.message)
					console.error(error)
				}
			)
		
		return () => {
			removeChatListener()
			removeMessagesListener()
			
			setIsTyping(false)
			setMessages([])
		}
	}, [chatId, uid, loadChat])
	
	return {
		isReady,
		isTyping,
		setIsTyping: useCallback((isTyping: boolean) => {
			if (chatId)
				firestore.doc(`chats/${chatId}`).update({
					typing: FieldValue[isTyping ? 'arrayUnion' : 'arrayRemove'](uid)
				})
		}, [chatId, uid]),
		messages,
		sendMessage: useCallback((data: string) => {
			if (chatId)
				firestore.collection(`chats/${chatId}/messages`).add({
					from: uid,
					data
				})
		}, [chatId, uid]),
		stopChat: useCallback(() => {
			if (!chatId)
				return
			
			const batch = firestore.batch()
			
			batch.delete(firestore.doc(`chats/${chatId}`))
			batch.set(firestore.doc(`requests/${uid}`), {
				available: false
			})
			
			batch.commit()
		}, [chatId, uid])
	}
}
