import { useState, useCallback, useEffect } from 'react'

import firebase from '../firebase'
import useUID from './useUID'
import useAudio from './useAudio'

import 'firebase/firestore'

export interface Message {
	id: string
	didSend: boolean
	data: string
}

const firestore = firebase.firestore()

export default () => {
	const [isReady, setIsReady] = useState(false)
	const [chatId, setChatId] = useState(null as string | null)
	
	const [pendingMessage, setPendingMessage] = useState(null as string | null)
	const [messages, setMessages] = useState([] as Message[])
	
	const uid = useUID()
	
	const [playJoinChatSound] = useAudio(require('../sounds/join-chat.wav'))
	const [playSendMessageSound] = useAudio(require('../sounds/send-message.mp3'))
	const [playReceiveMessageSound] = useAudio(require('../sounds/receive-message.wav'))
	const [playTypingSound, pauseTypingSound] = useAudio(require('../sounds/typing.mp3'), true)
	
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
					
					const pendingMessages: (
						Record<string, string> | undefined
					) = snapshot.get('pendingMessages')
					
					if (!pendingMessages)
						return
					
					for (const [key, message] of Object.entries(pendingMessages))
						if (key !== uid)
							return setPendingMessage(message)
					
					setPendingMessage(null)
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
							case 'added': {
								const didSend = doc.get('from') === uid
								
								setMessages(messages => [
									...messages,
									{ id, didSend, data: doc.get('data') }
								])
								
								didSend
									? playSendMessageSound()
									: playReceiveMessageSound()
								
								break
							}
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
			
			setPendingMessage(null)
			setMessages([])
		}
	}, [chatId, uid, loadChat, playSendMessageSound, playReceiveMessageSound])
	
	useEffect(() => {
		if (isReady)
			playJoinChatSound()
	}, [isReady, playJoinChatSound])
	
	useEffect(() => {
		pendingMessage
			? playTypingSound()
			: pauseTypingSound()
	}, [pendingMessage, playTypingSound, pauseTypingSound])
	
	return {
		isReady,
		pendingMessage,
		setPendingMessage: useCallback((message: string) => {
			if (chatId)
				firestore.doc(`chats/${chatId}`).update({
					[`pendingMessages.${uid}`]: message
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
			
			navigator.sendBeacon(
				'https://glaze.chat/api/stop-chat',
				JSON.stringify({
					chat: chatId,
					user: uid
				})
			)
		}, [chatId, uid])
	}
}
