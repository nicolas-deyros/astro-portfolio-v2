import { ImageResponse } from '@vercel/og'
import React from 'react'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ request }) => {
	const { searchParams } = new URL(request.url)
	const title = searchParams.get('title') || 'Nicolás Deyros'
	const description =
		searchParams.get('desc') || 'Full-Stack Developer | Astro & React Specialist'

	// Ensure parameters fit nicely
	const displayTitle = title.length > 60 ? title.substring(0, 57) + '...' : title
	const displayDesc = description.length > 120 ? description.substring(0, 117) + '...' : description

	return new ImageResponse(
		React.createElement(
			'div',
			{
				style: {
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-start',
					justifyContent: 'center',
					padding: '80px',
					backgroundColor: '#0f172a', // Tailwind slate-900
					backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
					backgroundSize: '100px 100px',
				},
			},
			React.createElement(
				'div',
				{
					style: {
						display: 'flex',
						alignItems: 'center',
						marginBottom: '40px',
					},
				},
				React.createElement(
					'div',
					{
						style: {
							width: '64px',
							height: '64px',
							borderRadius: '16px',
							backgroundColor: '#3b82f6', // Tailwind blue-500
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: '#ffffff',
							fontSize: '32px',
							fontWeight: 'bold',
							marginRight: '20px',
						},
					},
					'ND'
				),
				React.createElement(
					'span',
					{
						style: {
							color: '#94a3b8', // Tailwind slate-400
							fontSize: '32px',
							fontWeight: 600,
							letterSpacing: '-1px',
						},
					},
					'nicolasdeyros.dev'
				)
			),
			React.createElement(
				'h1',
				{
					style: {
						color: '#f8fafc', // Tailwind slate-50
						fontSize: '72px',
						fontWeight: 800,
						lineHeight: 1.1,
						letterSpacing: '-2px',
						marginBottom: '24px',
						fontFamily: 'sans-serif',
					},
				},
				displayTitle
			),
			React.createElement(
				'p',
				{
					style: {
						color: '#cbd5e1', // Tailwind slate-300
						fontSize: '36px',
						lineHeight: 1.4,
						maxWidth: '800px',
						fontFamily: 'sans-serif',
					},
				},
				displayDesc
			),
			React.createElement(
				'div',
				{
					style: {
						display: 'flex',
						position: 'absolute',
						bottom: '80px',
						left: '80px',
						gap: '24px',
					},
				},
				React.createElement(
					'span',
					{
						style: {
							color: '#60a5fa', // Tailwind blue-400
							fontSize: '28px',
							fontWeight: 600,
						},
					},
					'#Astro'
				),
				React.createElement(
					'span',
					{
						style: {
							color: '#38bdf8', // Tailwind sky-400
							fontSize: '28px',
							fontWeight: 600,
						},
					},
					'#React'
				),
				React.createElement(
					'span',
					{
						style: {
							color: '#818cf8', // Tailwind indigo-400
							fontSize: '28px',
							fontWeight: 600,
						},
					},
					'#TypeScript'
				)
			)
		),
		{
			width: 1200,
			height: 630,
			// Here we could include a local font to avoid text rendering issues in production on Vercel
			// fonts: [...] 
		}
	)
}
