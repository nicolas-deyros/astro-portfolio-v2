import { useContactForm } from '@/hooks/useContactForm'

import Input from './Input'
import TextArea from './TextArea'

type StatusVariant = 'success' | 'error' | 'warning' | 'default'

const STATUS_STYLES: Record<StatusVariant, string> = {
	success: 'border-green-200 bg-green-50 text-green-800',
	error: 'border-red-200 bg-red-50 text-red-800',
	warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
	default:
		'border-transparent bg-transparent text-slate-700 dark:text-slate-200',
}

interface StatusBannerProps {
	variant: StatusVariant
	message: string
}

function StatusBanner({ variant, message }: StatusBannerProps) {
	return (
		<div
			className={`mb-4 rounded-lg border p-4 text-center transition-all duration-300 ${STATUS_STYLES[variant]}`}>
			<h3 className="text-lg font-semibold">{message}</h3>
		</div>
	)
}

const ContactUs = () => {
	const {
		values,
		errors,
		touched,
		isDirty,
		isValid,
		submitStatus,
		submitMessage,
		handleChange,
		handleBlur,
		handleSubmit,
	} = useContactForm()

	const getButtonState = () => {
		if (submitStatus === 'submitting') return 'submitting'
		if (submitStatus === 'success') return 'success'
		if (!isValid || !isDirty) return 'disabled'
		return 'enabled'
	}

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

	const renderStatusBanner = () => {
		if (submitStatus === 'success')
			return <StatusBanner variant="success" message={`✅ ${submitMessage}`} />
		if (submitStatus === 'error')
			return <StatusBanner variant="error" message={`❌ ${submitMessage}`} />
		if (!isValid && isDirty)
			return (
				<StatusBanner
					variant="warning"
					message="⚠️ Please review your input to proceed"
				/>
			)
		return <StatusBanner variant="default" message="💬 Get in touch with me" />
	}

	return (
		<div className="mx-auto w-full max-w-md">
			{renderStatusBanner()}

			<form onSubmit={handleSubmit} className="space-y-4" noValidate>
				<Input
					id="name"
					name="name"
					type="text"
					label="Your Name *"
					placeholder="Enter your full name"
					value={values.name}
					onChange={handleChange}
					onBlur={handleBlur}
					error={errors.name}
					touched={touched.name}
					disabled={submitStatus === 'submitting'}
				/>

				<Input
					id="email"
					name="email"
					type="email"
					label="Your Email *"
					placeholder="Enter your email address"
					value={values.email}
					onChange={handleChange}
					onBlur={handleBlur}
					error={errors.email}
					touched={touched.email}
					disabled={submitStatus === 'submitting'}
				/>

				<TextArea
					id="message"
					name="message"
					rows={4}
					label="Your Message"
					placeholder="Tell me about your project, ideas, or just say hello..."
					value={values.message}
					onChange={handleChange}
					onBlur={handleBlur}
					error={errors.message}
					touched={touched.message}
					disabled={submitStatus === 'submitting'}
				/>

				<div className="pt-4">
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
				</div>
			</form>
		</div>
	)
}

export default ContactUs
