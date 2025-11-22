import { AnimatePresence, motion } from 'framer-motion'

import { useContactForm } from '@/hooks/useContactForm'

import Input from './Input'
import TextArea from './TextArea'

const fadeInOut = {
	initial: { opacity: 0, y: -10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
	transition: { duration: 0.3 },
}

const ContactUs = () => {
	const { formik, submitStatus, submitMessage } = useContactForm()

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
				<Input
					id="name"
					name="name"
					type="text"
					label="Your Name *"
					placeholder="Enter your full name"
					value={formik.values.name}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					error={formik.errors.name}
					touched={formik.touched.name}
					disabled={submitStatus === 'submitting'}
				/>

				<Input
					id="email"
					name="email"
					type="email"
					label="Your Email *"
					placeholder="Enter your email address"
					value={formik.values.email}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					error={formik.errors.email}
					touched={formik.touched.email}
					disabled={submitStatus === 'submitting'}
				/>

				<TextArea
					id="message"
					name="message"
					rows={4}
					label="Your Message"
					placeholder="Tell me about your project, ideas, or just say hello..."
					value={formik.values.message}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					error={formik.errors.message}
					touched={formik.touched.message}
					disabled={submitStatus === 'submitting'}
				/>

				<div className="pt-4">{renderButton()}</div>
			</form>
		</div>
	)
}

export default ContactUs
