import { useFormik } from 'formik'
import { useState } from 'react'

import { BasicSchema } from '@/schemas'

export interface FormValues {
	name: string
	email: string
	message: string
}

export interface SubmitResponse {
	success: boolean
	message?: string
}

export const useContactForm = (): {
	formik: ReturnType<typeof useFormik<FormValues>>
	submitStatus: 'idle' | 'submitting' | 'success' | 'error'
	submitMessage: string
} => {
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
	): Promise<void> => {
		setSubmitStatus('submitting')
		setSubmitMessage('')

		try {
			const response = await fetch('/api/sendEmail.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(values),
			})

			if (!response.ok) {
				const errorText = await response.text()
				console.error('API Response Error:', errorText)
				throw new Error(`Server error: ${response.status}`)
			}

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

	return {
		formik,
		submitStatus,
		submitMessage,
	}
}
