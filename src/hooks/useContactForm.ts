import { actions } from 'astro:actions'
import { useState } from 'react'

import type { FormErrors, FormValues } from '@/schemas'
import { validateContactForm } from '@/schemas'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

interface ContactFormState {
	values: FormValues
	errors: FormErrors
	touched: Partial<Record<keyof FormValues, boolean>>
}

const INITIAL_VALUES: FormValues = { name: '', email: '', message: '' }

export function useContactForm() {
	const [status, setStatus] = useState<SubmitStatus>('idle')
	const [submitMessage, setSubmitMessage] = useState('')
	const [formState, setFormState] = useState<ContactFormState>({
		values: INITIAL_VALUES,
		errors: {},
		touched: {},
	})

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target
		const nextValues = { ...formState.values, [name]: value }
		setFormState(prev => ({
			...prev,
			values: nextValues,
			errors: validateContactForm(nextValues),
		}))
	}

	const handleBlur = (
		e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name } = e.target
		setFormState(prev => ({
			...prev,
			touched: { ...prev.touched, [name]: true },
		}))
	}

	const isDirty = Object.values(formState.values).some(v => v !== '')
	const isValid =
		Object.keys(validateContactForm(formState.values)).length === 0

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Mark all fields touched on submit attempt
		setFormState(prev => ({
			...prev,
			touched: { name: true, email: true, message: true },
			errors: validateContactForm(prev.values),
		}))

		if (!isValid) return

		setStatus('submitting')
		setSubmitMessage('')

		try {
			const { data, error } = await actions.sendEmail(formState.values)

			if (error) {
				throw new Error(error.message || 'Failed to send message')
			}

			if (data?.success) {
				setStatus('success')
				setSubmitMessage(data.message || "Thanks! I'll be in touch soon.")
				setFormState({ values: INITIAL_VALUES, errors: {}, touched: {} })
				setTimeout(() => {
					setStatus('idle')
					setSubmitMessage('')
				}, 5000)
			} else {
				throw new Error(data?.message || 'Failed to send email')
			}
		} catch (err) {
			console.error('Form submission error:', err)
			setStatus('error')
			setSubmitMessage(
				err instanceof Error
					? err.message
					: 'Something went wrong. Please try again.',
			)
		}
	}

	return {
		values: formState.values,
		errors: formState.errors,
		touched: formState.touched,
		isDirty,
		isValid,
		submitStatus: status,
		submitMessage,
		handleChange,
		handleBlur,
		handleSubmit,
	}
}
