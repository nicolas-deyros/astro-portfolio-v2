import React from 'react'

interface ContactEmailProps {
	name: string
	message?: string
}

export const ContactEmail: React.FC<ContactEmailProps> = ({
	name,
	message,
}) => (
	<div
		style={{
			fontFamily: 'sans-serif',
			lineHeight: '1.6',
			color: '#333',
			maxWidth: '600px',
			margin: 'auto',
			padding: '20px',
			border: '1px solid #eee',
			borderRadius: '10px',
		}}>
		<h2 style={{ color: '#2563eb' }}>Hello {name}!</h2>
		<p>Thank you for reaching out through my portfolio.</p>
		<p>
			I've received your message and will get back to you as soon as possible.
		</p>

		<div
			style={{
				backgroundColor: '#f9fafb',
				padding: '15px',
				borderRadius: '5px',
				margin: '20px 0',
			}}>
			<p>
				<strong>Your Message:</strong>
			</p>
			<p style={{ fontStyle: 'italic' }}>{message || 'No message provided'}</p>
		</div>

		<p>
			Best regards,
			<br />
			<strong>Nicolás Deyros</strong>
		</p>
	</div>
)
