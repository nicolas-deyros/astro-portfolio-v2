import { useState } from 'react'

import type { LinkData } from '../components/Admin/AdminLinksManager'

interface FormData {
	title: string
	url: string
	tags: string
	date: string
}

const defaultFormData = (): FormData => ({
	title: '',
	url: '',
	tags: '',
	date: new Date().toISOString().split('T')[0],
})

export function useAdminLinks(initialLinks: LinkData[]) {
	// Data
	const [links] = useState<LinkData[]>(initialLinks)

	// Form state
	const [formData, setFormData] = useState<FormData>(defaultFormData())
	const [formErrors, setFormErrors] = useState<string[]>([])
	const [formSuccess, setFormSuccess] = useState<string>('')
	const [editMode, setEditMode] = useState(false)
	const [editingLinkId, setEditingLinkId] = useState<number | null>(null)

	// API state
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Modal state
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [globalErrorMessage, setGlobalErrorMessage] = useState('')
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [linkToDelete, setLinkToDelete] = useState<number | null>(null)
	const [showUpdateModal, setShowUpdateModal] = useState(false)

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	const handleEditClick = (link: LinkData) => {
		setEditMode(true)
		setEditingLinkId(link.id)
		setFormData({
			title: link.title,
			url: link.url,
			tags: link.tags,
			date: link.date,
		})
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const resetForm = () => {
		setEditMode(false)
		setEditingLinkId(null)
		setFormData(defaultFormData())
		setFormErrors([])
		setFormSuccess('')
	}

	const validateForm = (): string[] => {
		const errors: string[] = []

		if (!formData.title || formData.title.trim() === '')
			errors.push('Title is required')
		else if (formData.title.length > 200)
			errors.push('Title must be less than 200 characters')

		if (!formData.url || formData.url.trim() === '')
			errors.push('URL is required')
		else {
			try {
				new URL(formData.url)
			} catch {
				errors.push('URL must be a valid URL')
			}
		}

		if (!formData.date || formData.date.trim() === '')
			errors.push('Date is required')
		else if (isNaN(Date.parse(formData.date)))
			errors.push('Date must be a valid date')

		return errors
	}

	const submitLinkData = async (method: 'POST' | 'PUT') => {
		setIsSubmitting(true)
		try {
			const payload =
				method === 'PUT' ? { id: editingLinkId, ...formData } : formData
			const response = await fetch('/api/links.json', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			const result = await response.json()

			if (response.ok) {
				setFormSuccess(
					method === 'POST'
						? 'Link added successfully!'
						: 'Link updated successfully!',
				)
				resetForm()
				setTimeout(() => window.location.reload(), 1500)
			} else if (response.status === 401) {
				setGlobalErrorMessage('Session expired. Please log in again.')
				setShowErrorModal(true)
				setTimeout(() => {
					window.location.href = '/admin'
				}, 2000)
			} else {
				const errorMsg =
					result.error?.message || result.message || 'Failed to process request'
				setFormErrors(
					result.errors && Array.isArray(result.errors)
						? result.errors
						: [errorMsg],
				)
			}
		} catch {
			setFormErrors([
				'Network error. Please check your connection and try again.',
			])
		} finally {
			setIsSubmitting(false)
			setShowUpdateModal(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setFormErrors([])
		setFormSuccess('')

		const errors = validateForm()
		if (errors.length > 0) {
			setFormErrors(errors)
			return
		}

		if (editMode) {
			setShowUpdateModal(true)
			return
		}

		await submitLinkData('POST')
	}

	const handleDeleteClick = (id: number) => {
		setLinkToDelete(id)
		setShowDeleteModal(true)
	}

	const confirmDelete = async () => {
		if (!linkToDelete) return
		try {
			const response = await fetch(`/api/links.json?id=${linkToDelete}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			})
			if (response.ok) {
				window.location.reload()
			} else if (response.status === 401) {
				setGlobalErrorMessage('Session expired. Please log in again.')
				setShowErrorModal(true)
				setShowDeleteModal(false)
				setTimeout(() => {
					window.location.href = '/admin'
				}, 2000)
			} else {
				setGlobalErrorMessage('Error deleting link')
				setShowErrorModal(true)
				setShowDeleteModal(false)
			}
		} catch {
			setGlobalErrorMessage('Error deleting link')
			setShowErrorModal(true)
			setShowDeleteModal(false)
		}
	}

	return {
		links,
		formData,
		formErrors,
		formSuccess,
		editMode,
		isSubmitting,
		showErrorModal,
		globalErrorMessage,
		showDeleteModal,
		showUpdateModal,
		handlers: {
			handleInputChange,
			handleEditClick,
			handleSubmit,
			handleDeleteClick,
			resetForm,
			confirmDelete,
			dismissErrorModal: () => setShowErrorModal(false),
			dismissDeleteModal: () => setShowDeleteModal(false),
			dismissUpdateModal: () => setShowUpdateModal(false),
			confirmUpdate: () => submitLinkData('PUT'),
		},
	}
}
