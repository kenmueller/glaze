import React, { useState, useCallback, FormEvent, useEffect } from 'react'
import cx from 'classnames'

import useChat from '../hooks/useChat'
import useOnline from '../hooks/useOnline'

import githubIcon from '../images/github.png'

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
	
	const { onlineCount, setIsOnline } = useOnline()
	
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
		setIsOnline(true)
	}, [setIsOnline])
	
	useEffect(() => {
		window.onbeforeunload = isReady
			? () => {
				stopChat()
				setIsOnline(false)
			}
			: null
	}, [isReady, stopChat, setIsOnline])
	
	useEffect(() => {
		setPendingMessage(message)
	}, [message, setPendingMessage])
	
	return (
		<div className="chat-container">
			<div className={cx('chat', { loading: !isReady })}>
				{isReady
					? (
						<>
							<div className="header">
								{onlineCount === null || (
									<p className="online">
										{onlineCount} online
									</p>
								)}
								<button className="next" onClick={next}>
									Next chat
								</button>
							</div>
							<div ref={onMessagesRef} className="messages">
								<p className="header">
									This is the tale of a beautiful thing.
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
							{onlineCount === null || (
								<p>{onlineCount} online</p>
							)}
						</>
					)
				}
			</div>
			<footer>
				<a
					href="https://github.com/kenmueller/glaze"
					target="_blank"
					rel="author nofollow noopener noreferrer"
				>
					<img src={githubIcon} alt="GitHub" />
					<p>GitHub</p>
				</a>
			</footer>
		</div>
	)
}
