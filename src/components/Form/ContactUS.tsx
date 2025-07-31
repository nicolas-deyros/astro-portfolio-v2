import { useState } from 'react'
import { useFormik } from 'formik'
import { BasicSchema } from '@/schemas'
import { motion, AnimatePresence } from 'framer-motion'

// Types
interface FormValues {
	name: string
	email: string
	message: string
}

interface SubmitResponse {
	success: boolean
	message?: string
}

// Animation variants
const fadeInOut = {
	initial: { opacity: 0, y: -10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
	transition: { duration: 0.3 },
}

const shakeAnimation = {
	initial: { x: 0 },
	animate: { x: [-10, 10, -10, 10, 0] },
	transition: { duration: 0.4 },
}

const ContactUs = () => {
	const [submitStatus, setSubmitStatus] = useState<
		'idle' | 'submitting' | 'success' | 'error'
	>('idle')
	const [submitMessage, setSubmitMessage] = useState<string>('')

	const initialValues: FormValues = {
		name: '',
		email: '',
		message: '',
	}

	const handleSubmit = async (
		values: FormValues,
		{ resetForm, setSubmitting }: import('formik').FormikHelpers<FormValues>,
	) => {
		setSubmitStatus('submitting')
		setSubmitMessage('')

		try {
			// Create simple email content without complex rendering
			const emailHtml = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Contact Form Submission</title>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { color: #2563eb; margin-bottom: 20px; }
                            .details { background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
                            .message { background-color: #e5f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb; }
                            .footer { margin-top: 30px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1 class="header">Hello ${values.name}!</h1>
                            <p>Thank you for reaching out through my portfolio contact form.</p>
                            <p>I've received your message and will get back to you as soon as possible.</p>
                            
                            <div class="details">
                                <h3>Your submission details:</h3>
                                <p><strong>Name:</strong> ${values.name}</p>
                                <p><strong>Email:</strong> ${values.email}</p>
                                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                            </div>

                            ${
															values.message
																? `
                            <div class="message">
                                <h3>Your Message:</h3>
                                <p>${values.message.replace(/\n/g, '<br>')}</p>
                            </div>
                            `
																: ''
														}
                            
                            <div class="footer">
                                <p>Best regards,<br><strong>Nicolás Deyros</strong></p>
                                <p><em>Full Stack Developer</em></p>
                            </div>
                        </div>
                    </body>
                </html>
            `

			const emailText = `
Hello admin!

New submission from ${values.name}!

Thank you for reaching out through my portfolio contact form.
I've received your message and will get back to you as soon as possible.

Your submission details:
Email: ${values.email}
Submitted: ${new Date().toLocaleString()}

${values.message ? `Your Message:\n${values.message}\n` : ''}

Get in touch with him ASAP!
Best regards,
            `.trim()

			// Validate email content
			if (!emailHtml.trim() || !emailText.trim()) {
				throw new Error('Failed to generate email content')
			}

			const response = await fetch('/api/sendEmail.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					from: 'onboarding@resend.dev',
					to: values.email,
					subject: `Hi ${values.name}! Thanks for reaching out`,
					name: values.name,
					message: values.message, // Add the message field for database storage
					html: emailHtml,
					text: emailText,
				}),
			})

			// Check if response is ok
			if (!response.ok) {
				const errorText = await response.text()
				console.error('API Response Error:', errorText)
				throw new Error(`Server error: ${response.status}`)
			}

			// Parse response
			let result: SubmitResponse
			try {
				result = await response.json()
			} catch (parseError) {
				console.error('JSON Parse Error:', parseError)
				throw new Error('Invalid response from server')
			}

			if (result.success) {
				setSubmitStatus('success')
				setSubmitMessage(result.message || "Thanks! I'll be in touch soon.")
				resetForm()

				// Reset success message after 5 seconds
				setTimeout(() => {
					setSubmitStatus('idle')
					setSubmitMessage('')
				}, 5000)
			} else {
				throw new Error(result.message || 'Failed to send email')
			}
		} catch (error) {
			console.error('Form submission error:', error)
			setSubmitStatus('error')
			setSubmitMessage(
				error instanceof Error
					? error.message
					: 'Something went wrong. Please try again.',
			)
		} finally {
			setSubmitting(false)
		}
	}

	const formik = useFormik({
		initialValues,
		onSubmit: handleSubmit,
		validationSchema: BasicSchema,
	})

	const getFieldClasses = (fieldName: keyof FormValues) => {
		const hasError = formik.errors[fieldName] && formik.touched[fieldName]
		const baseClasses =
			'block w-full rounded-md border p-2.5 text-sm transition-colors duration-200'

		if (hasError) {
			return `${baseClasses} border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500`
		}

		return `${baseClasses} border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 dark:text-slate-200 focus:border-blue-500 focus:ring-blue-500 focus:bg-white`
	}

	const getLabelClasses = (fieldName: keyof FormValues) => {
		const hasError = formik.errors[fieldName] && formik.touched[fieldName]
		const baseClasses = 'block text-sm font-medium mb-1'

		return hasError
			? `${baseClasses} text-red-700`
			: `${baseClasses} text-slate-700 dark:text-slate-200`
	}

	const getButtonState = () => {
		if (submitStatus === 'submitting') return 'submitting'
		if (submitStatus === 'success') return 'success'
		if (!formik.isValid || !formik.dirty) return 'disabled'
		return 'enabled'
	}

	const renderStatusMessage = () => {
		if (submitStatus === 'success') {
			return (
				<motion.div
					{...fadeInOut}
					className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
					<h3 className="text-lg font-semibold text-green-800">
						✅ {submitMessage}
					</h3>
				</motion.div>
			)
		}

		if (submitStatus === 'error') {
			return (
				<motion.div
					{...fadeInOut}
					className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
					<h3 className="text-lg font-semibold text-red-800">
						❌ {submitMessage}
					</h3>
				</motion.div>
			)
		}

		if (!formik.isValid && formik.dirty) {
			return (
				<motion.div
					{...fadeInOut}
					className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
					<h3 className="text-lg font-semibold text-yellow-800">
						⚠️ Please review your input to proceed
					</h3>
				</motion.div>
			)
		}

		return (
			<div className="mb-4 text-center">
				<h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
					💬 Get in touch with me
				</h3>
			</div>
		)
	}

	const renderButton = () => {
		const buttonState = getButtonState()

		const buttonClasses = {
			enabled: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 text-white',
			disabled: 'bg-slate-400 text-slate-200 cursor-not-allowed',
			submitting: 'bg-blue-600 text-white cursor-wait',
			success: 'bg-green-600 text-white cursor-default',
		}

		const buttonTexts = {
			enabled: 'Send Message',
			disabled: 'Complete Form',
			submitting: 'Sending...',
			success: 'Sent!',
		}

		return (
			<button
				type="submit"
				disabled={buttonState !== 'enabled'}
				className={`w-full min-w-[140px] rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 focus:ring-4 focus:outline-none md:w-auto ${buttonClasses[buttonState]}`}>
				<span className="flex items-center justify-center gap-2">
					{buttonState === 'submitting' && (
						<svg
							className="h-4 w-4 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24">
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					)}
					{buttonState === 'success' && <span>✅</span>}
					{buttonTexts[buttonState]}
				</span>
			</button>
		)
	}

	return (
		<div className="mx-auto w-full max-w-md">
			<AnimatePresence mode="wait">{renderStatusMessage()}</AnimatePresence>

			<form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
				{/* Name Field */}
				<div>
					<label htmlFor="name" className={getLabelClasses('name')}>
						Your Name *
					</label>
					<motion.div
						animate={
							formik.errors.name && formik.touched.name
								? shakeAnimation.animate
								: {}
						}
						transition={shakeAnimation.transition}>
						<input
							id="name"
							name="name"
							type="text"
							placeholder="Enter your full name"
							className={getFieldClasses('name')}
							value={formik.values.name}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={submitStatus === 'submitting'}
						/>
					</motion.div>
					<AnimatePresence>
						{formik.errors.name && formik.touched.name && (
							<motion.span
								{...fadeInOut}
								className="mt-1 block text-sm font-medium text-red-600">
								{formik.errors.name}
							</motion.span>
						)}
					</AnimatePresence>
				</div>

				{/* Email Field */}
				<div>
					<label htmlFor="email" className={getLabelClasses('email')}>
						Your Email *
					</label>
					<motion.div
						animate={
							formik.errors.email && formik.touched.email
								? shakeAnimation.animate
								: {}
						}
						transition={shakeAnimation.transition}>
						<input
							id="email"
							name="email"
							type="email"
							placeholder="Enter your email address"
							className={getFieldClasses('email')}
							value={formik.values.email}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={submitStatus === 'submitting'}
						/>
					</motion.div>
					<AnimatePresence>
						{formik.errors.email && formik.touched.email && (
							<motion.span
								{...fadeInOut}
								className="mt-1 block text-sm font-medium text-red-600">
								{formik.errors.email}
							</motion.span>
						)}
					</AnimatePresence>
				</div>

				{/* Message Field */}
				<div>
					<label htmlFor="message" className={getLabelClasses('message')}>
						Your Message
					</label>
					<motion.div
						animate={
							formik.errors.message && formik.touched.message
								? shakeAnimation.animate
								: {}
						}
						transition={shakeAnimation.transition}>
						<textarea
							id="message"
							name="message"
							rows={4}
							placeholder="Tell me about your project, ideas, or just say hello..."
							className={getFieldClasses('message')}
							value={formik.values.message}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={submitStatus === 'submitting'}
						/>
					</motion.div>
					<AnimatePresence>
						{formik.errors.message && formik.touched.message && (
							<motion.span
								{...fadeInOut}
								className="mt-1 block text-sm font-medium text-red-600">
								{formik.errors.message}
							</motion.span>
						)}
					</AnimatePresence>
				</div>

				{/* Submit Button */}
				<div className="pt-4">{renderButton()}</div>
			</form>
		</div>
	)
}

export default ContactUs
