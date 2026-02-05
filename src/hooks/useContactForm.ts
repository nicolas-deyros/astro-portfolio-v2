import { actions } from 'astro:actions'
import { useFormik } from 'formik'
import { useState } from 'react'

import { BasicSchema } from '@/schemas'

export interface FormValues {
	name: string
	email: string
	message: string
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
			const { data, error } = await actions.sendEmail(values)

			if (error) {
				console.error('Action error:', error)
				throw new Error(error.message || 'Failed to send message')
			}

			if (data?.success) {
				setSubmitStatus('success')
				setSubmitMessage(data.message || "Thanks! I'll be in touch soon.")
				resetForm()

				setTimeout(() => {
					setSubmitStatus('idle')
					setSubmitMessage('')
				}, 5000)
			} else {
				throw new Error(data?.message || 'Failed to send email')
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
