import React, { useState, useCallback, FormEvent, useEffect } from 'react'
import cx from 'classnames'

import useChat from '../hooks/useChat'

import '../scss/components/Chat.scss'

export default () => {
	const {
		isReady,
		pendingMessage,
		setPendingMessage,
		messages,
		sendMessage,
		stopChat
	} = useChat()
	
	const [message, setMessage] = useState('')
	
	const next = useCallback(() => {
		stopChat()
	}, [stopChat])
	
	const send = useCallback((event: FormEvent) => {
		event.preventDefault()
		
		sendMessage(message)
		setMessage('')
	}, [sendMessage, message])
	
	const onMessagesRef = useCallback((div: HTMLDivElement | null) => {
		if (div)
			div.scrollTop = div.scrollHeight
	}, [messages, pendingMessage]) // eslint-disable-line
	
	const onInputRef = useCallback((input: HTMLInputElement | null) => {
		input?.focus()
	}, [message]) // eslint-disable-line
	
	useEffect(() => {
		window.onbeforeunload = isReady ? stopChat : null
	}, [isReady, stopChat])
	
	useEffect(() => {
		setPendingMessage(message)
	}, [message, setPendingMessage])
	
	return (
		<div className={cx('chat', { loading: !isReady })}>
			{isReady
				? (
					<>
						<button className="next" onClick={next}>
							Next chat
						</button>
						<div ref={onMessagesRef} className="messages">
							<p className="header">
								This is the start of a beautiful thing.
							</p>
							{messages.map(({ id, didSend, data }) => (
								<p
									key={id}
									className={cx('message', { 'did-send': didSend })}
								>
									{data}
								</p>
							))}
							{pendingMessage && (
								<div className="message pending">
									{pendingMessage}
								</div>
							)}
						</div>
						<form onSubmit={send}>
							<input
								ref={onInputRef}
								placeholder="Say anything!"
								value={message}
								onChange={({ target: { value } }) => setMessage(value)}
							/>
							<button disabled={!message}>
								Send
							</button>
						</form>
					</>
				)
				: (
					<>
						<div className="loader" />
						<p>Searching for someone...</p>
					</>
				)
			}
		</div>
	)
}
