import React, { useState } from 'react'

export interface LinkData {
	id: number
	title: string
	url: string
	tags: string
	date: string
}

export interface PaginationData {
	page: number
	pageSize: number
	total: number
	totalPages: number
	hasNext: boolean
	hasPrev: boolean
}

interface AdminLinksManagerProps {
	initialLinks: LinkData[]
	initialPagination: PaginationData
	availableTags: string[]
	initialSort: string
	initialDir: string
	initialSearch: string
	initialTag: string
}

export default function AdminLinksManager({
	initialLinks,
	initialPagination,
	availableTags,
	initialSort,
	initialDir,
	initialSearch,
	initialTag,
}: AdminLinksManagerProps) {
	// State from props
	const [links] = useState<LinkData[]>(initialLinks)
	const [pagination] = useState<PaginationData>(initialPagination)

	// UI state
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formErrors, setFormErrors] = useState<string[]>([])
	const [formSuccess, setFormSuccess] = useState<string>('')

	// Edit state
	const [editMode, setEditMode] = useState(false)
	const [editingLinkId, setEditingLinkId] = useState<number | null>(null)

	// Form Data
	const [formData, setFormData] = useState({
		title: '',
		url: '',
		tags: '',
		date: new Date().toISOString().split('T')[0],
	})

	// Modal states
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
		setFormData({
			title: '',
			url: '',
			tags: '',
			date: new Date().toISOString().split('T')[0],
		})
		setFormErrors([])
		setFormSuccess('')
	}

	const validateForm = () => {
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
			return // Delay submission until modal confirmation
		}

		await submitLinkData('POST')
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

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Error Modal */}
			<div
				id="session-modal"
				className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 ${!showErrorModal ? 'hidden' : ''}`}>
				<div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
					<div className="flex flex-col items-center">
						<div className="mb-4 flex items-center gap-3">
							<svg
								className="h-6 w-6 text-red-500 dark:text-red-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
								/>
							</svg>
							<span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
								Error
							</span>
						</div>
						<p className="mb-6 text-center text-base text-red-700 dark:text-red-300">
							{globalErrorMessage}
						</p>
						<button
							onClick={() => setShowErrorModal(false)}
							className="rounded-md bg-blue-600 px-6 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-slate-900">
							OK
						</button>
					</div>
				</div>
			</div>

			{/* Delete Modal */}
			<div
				id="confirm-delete-modal"
				className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 ${!showDeleteModal ? 'hidden' : ''}`}>
				<div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
					<div className="flex flex-col items-center">
						<div className="mb-4 flex items-center gap-3">
							<svg
								className="h-6 w-6 text-yellow-500 dark:text-yellow-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
								/>
							</svg>
							<span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
								Confirm Delete
							</span>
						</div>
						<p className="mb-6 text-center text-base text-slate-700 dark:text-slate-300">
							Are you sure you want to delete this link?
						</p>
						<div className="flex gap-4">
							<button
								onClick={() => setShowDeleteModal(false)}
								className="rounded-md bg-gray-200 px-6 py-2 text-base font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-offset-slate-900">
								Cancel
							</button>
							<button
								onClick={confirmDelete}
								className="rounded-md bg-red-600 px-6 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:bg-red-500 dark:hover:bg-red-400 dark:focus:ring-offset-slate-900">
								Delete
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Update Modal */}
			<div
				id="confirm-update-modal"
				className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 ${!showUpdateModal ? 'hidden' : ''}`}>
				<div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
					<div className="flex flex-col items-center">
						<div className="mb-4 flex items-center gap-3">
							<svg
								className="h-6 w-6 text-blue-500 dark:text-blue-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							<span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
								Confirm Update
							</span>
						</div>
						<p className="mb-6 text-center text-base text-slate-700 dark:text-slate-300">
							Are you sure you want to update this link?
						</p>
						<div className="flex gap-4">
							<button
								onClick={() => setShowUpdateModal(false)}
								className="rounded-md bg-gray-200 px-6 py-2 text-base font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-offset-slate-900">
								Cancel
							</button>
							<button
								onClick={() => submitLinkData('PUT')}
								className="rounded-md bg-blue-600 px-6 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-slate-900">
								Update
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Header */}
			<div className="mb-8">
				<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
					Link Management
				</h2>
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
					Manage your social links and external resources.
				</p>
			</div>

			{/* Form */}
			<div className="mb-12 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
				<div className="mb-6 flex items-center justify-between">
					<h3
						id="form-title"
						className="text-xl font-semibold text-slate-900 dark:text-slate-100">
						{editMode ? 'Edit Link' : 'Add New Link'}
					</h3>
					{editMode && (
						<button
							id="clear-form-btn"
							type="button"
							onClick={resetForm}
							className="rounded bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
							Cancel Edit
						</button>
					)}
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div
						id="form-errors"
						className={formErrors.length > 0 ? '' : 'hidden'}>
						{formErrors.length > 0 && (
							<div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
								<div className="flex">
									<svg
										className="h-5 w-5 text-red-400"
										fill="currentColor"
										viewBox="0 0 20 20">
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clipRule="evenodd"
										/>
									</svg>
									<div className="ml-3">
										<h3 className="text-sm font-medium text-red-800 dark:text-red-200">
											Please fix the following errors:
										</h3>
										<div className="mt-2 text-sm text-red-700 dark:text-red-300">
											{formErrors.map((err, i) => (
												<p key={i}>• {err}</p>
											))}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>

					<div id="form-success" className={formSuccess ? '' : 'hidden'}>
						{formSuccess && (
							<div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
								<div className="flex">
									<svg
										className="h-5 w-5 text-green-400"
										fill="currentColor"
										viewBox="0 0 20 20">
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
									<p className="ml-3 text-sm font-medium text-green-800 dark:text-green-200">
										{formSuccess}
									</p>
								</div>
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<label
								htmlFor="title"
								className="block text-sm font-medium text-slate-700 dark:text-slate-300">
								Title
							</label>
							<input
								type="text"
								id="title"
								name="title"
								value={formData.title}
								onChange={handleInputChange}
								required
								className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
								placeholder="Enter link title"
							/>
						</div>
						<div className="sm:col-span-2">
							<label
								htmlFor="url"
								className="block text-sm font-medium text-slate-700 dark:text-slate-300">
								URL
							</label>
							<input
								type="url"
								id="url"
								name="url"
								value={formData.url}
								onChange={handleInputChange}
								required
								className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
								placeholder="https://example.com"
							/>
						</div>
						<div>
							<label
								htmlFor="tags"
								className="block text-sm font-medium text-slate-700 dark:text-slate-300">
								Tags
							</label>
							<input
								type="text"
								id="tags"
								name="tags"
								value={formData.tags}
								onChange={handleInputChange}
								required
								className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
								placeholder="tech, ai, development"
							/>
						</div>
						<div>
							<label
								htmlFor="date"
								className="block text-sm font-medium text-slate-700 dark:text-slate-300">
								Publication Date
							</label>
							<input
								type="date"
								id="date"
								name="date"
								value={formData.date}
								onChange={handleInputChange}
								required
								className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
							/>
						</div>
					</div>
					<div className="flex justify-end">
						<button
							disabled={isSubmitting}
							type="submit"
							className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-slate-800 ${editMode ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`}>
							{!editMode ? (
								<svg
									className="mr-2 h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M12 6v6m0 0v6m0-6h6m-6 0H6"
									/>
								</svg>
							) : (
								<svg
									className="mr-2 h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							)}
							<span>
								{isSubmitting
									? editMode
										? 'Updating...'
										: 'Adding...'
									: editMode
										? 'Update Link'
										: 'Add Link'}
							</span>
						</button>
					</div>
				</form>
			</div>

			{/* Search and Filters */}
			<div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
				<form method="GET" className="space-y-4">
					<input type="hidden" name="sort" value={initialSort} />
					<input type="hidden" name="dir" value={initialDir} />

					<div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
						<div className="md:col-span-2">
							<label
								htmlFor="search"
								className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
								Search Links
							</label>
							<input
								type="text"
								id="search"
								name="search"
								defaultValue={initialSearch}
								placeholder="Search by title, URL, or tags..."
								className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
							/>
						</div>
						<div>
							<label
								htmlFor="tag-filter"
								className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
								Filter by Tag
							</label>
							<select
								id="tag-filter"
								name="tag"
								defaultValue={initialTag}
								className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white">
								<option value="">All Tags</option>
								{availableTags.map(tagOpt => (
									<option key={tagOpt} value={tagOpt}>
										{tagOpt}
									</option>
								))}
							</select>
						</div>
						<div>
							<label
								htmlFor="page-size"
								className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
								Results per page
							</label>
							<select
								id="page-size"
								name="pageSize"
								defaultValue={pagination.pageSize.toString()}
								className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white">
								<option value="10">10</option>
								<option value="20">20</option>
								<option value="50">50</option>
								<option value="100">100</option>
							</select>
						</div>
					</div>

					<div className="flex flex-wrap gap-3">
						<button
							type="submit"
							className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-slate-800">
							<svg
								className="mr-2 h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
							Search & Filter
						</button>
						{(initialSearch || initialTag) && (
							<a
								href={`?sort=${initialSort}&dir=${initialDir}&pageSize=${pagination.pageSize}`}
								className="inline-flex items-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-200 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:focus:ring-offset-slate-800">
								<svg
									className="mr-2 h-4 w-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
								Clear Filters
							</a>
						)}
					</div>

					<div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
						<p className="text-sm text-slate-600 dark:text-slate-400">
							Showing{' '}
							{Math.max(1, pagination.page - 1) * pagination.pageSize +
								(links.length > 0 ? 1 : 0)}
							-
							{Math.min(
								pagination.page * pagination.pageSize,
								pagination.total,
							)}{' '}
							of {pagination.total} results
						</p>
					</div>
				</form>
			</div>

			{/* Links Table */}
			<div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
				<div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
					<h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
						Links Management
					</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
						<thead className="bg-slate-50 dark:bg-slate-700">
							<tr>
								<th
									scope="col"
									className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-300">
									<a
										href={`?sort=title&dir=${initialSort === 'title' && initialDir === 'asc' ? 'desc' : 'asc'}&page=1&pageSize=${pagination.pageSize}&search=${initialSearch}&tag=${initialTag}`}
										className="text-blue-600 hover:text-slate-700 dark:hover:text-slate-200">
										Title{' '}
										{initialSort === 'title'
											? initialDir === 'asc'
												? '↑'
												: '↓'
											: ''}
									</a>
								</th>
								<th
									scope="col"
									className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase md:table-cell dark:text-slate-300">
									URL
								</th>
								<th
									scope="col"
									className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase md:table-cell dark:text-slate-300">
									<a
										href={`?sort=tags&dir=${initialSort === 'tags' && initialDir === 'asc' ? 'desc' : 'asc'}&page=1&pageSize=${pagination.pageSize}&search=${initialSearch}&tag=${initialTag}`}
										className="text-blue-600 hover:text-slate-700 dark:hover:text-slate-200">
										Tags{' '}
										{initialSort === 'tags'
											? initialDir === 'asc'
												? '↑'
												: '↓'
											: ''}
									</a>
								</th>
								<th
									scope="col"
									className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-300">
									<a
										href={`?sort=date&dir=${initialSort === 'date' && initialDir === 'asc' ? 'desc' : 'asc'}&page=1&pageSize=${pagination.pageSize}&search=${initialSearch}&tag=${initialTag}`}
										className="text-blue-600 hover:text-slate-700 dark:hover:text-slate-200">
										Date{' '}
										{initialSort === 'date'
											? initialDir === 'asc'
												? '↑'
												: '↓'
											: ''}
									</a>
								</th>
								<th
									scope="col"
									className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase md:table-cell dark:text-slate-300">
									Status
								</th>
								<th
									scope="col"
									className="px-4 py-3 text-right text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-300">
									Actions
								</th>
							</tr>
						</thead>
						<tbody
							id="links-table-body"
							className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
							{links.length > 0 ? (
								links.map(link => {
									const isScheduled = new Date(link.date) > new Date()
									return (
										<tr
											key={link.id}
											className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
											<td className="px-4 py-4">
												<div className="font-medium break-words text-slate-900 dark:text-slate-100">
													{link.title}
												</div>
												<div className="mt-1 text-sm text-slate-500 md:hidden dark:text-slate-400">
													<div className="mb-1">
														<a
															href={link.url}
															target="_blank"
															rel="noopener noreferrer"
															className="break-all text-blue-600">
															{link.url}
														</a>
													</div>
													<div>{link.tags}</div>
												</div>
											</td>
											<td className="hidden px-4 py-4 text-sm text-slate-500 md:table-cell dark:text-slate-400">
												<a
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													className="break-all text-blue-600">
													{link.url}
												</a>
											</td>
											<td className="hidden px-4 py-4 text-sm break-words text-slate-500 md:table-cell dark:text-slate-400">
												{link.tags}
											</td>
											<td className="px-4 py-4 text-sm whitespace-nowrap text-slate-500 dark:text-slate-400">
												{link.date}
											</td>
											<td className="hidden px-4 py-4 md:table-cell">
												{isScheduled ? (
													<span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
														Scheduled
													</span>
												) : (
													<span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
														Live
													</span>
												)}
											</td>
											<td className="px-4 py-4 text-right">
												<div className="flex justify-end gap-2">
													<button
														type="button"
														onClick={() => handleEditClick(link)}
														className="edit-btn rounded bg-blue-50 px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40">
														Edit
													</button>
													<button
														type="button"
														onClick={() => {
															setLinkToDelete(link.id)
															setShowDeleteModal(true)
														}}
														className="delete-btn rounded bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
														Delete
													</button>
												</div>
											</td>
										</tr>
									)
								})
							) : (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-8 text-center text-sm text-slate-500">
										No links found.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination component bottom */}
			{pagination.totalPages > 1 && (
				<div className="mt-8 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
					<div className="flex items-center space-x-2">
						{pagination.hasPrev && (
							<a
								href={`?page=${pagination.page - 1}&sort=${initialSort}&dir=${initialDir}&pageSize=${pagination.pageSize}&search=${initialSearch}&tag=${initialTag}`}
								className="rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 hover:bg-slate-50">
								Previous
							</a>
						)}
						<span className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm dark:bg-blue-500">
							{pagination.page}
						</span>
						{pagination.hasNext && (
							<a
								href={`?page=${pagination.page + 1}&sort=${initialSort}&dir=${initialDir}&pageSize=${pagination.pageSize}&search=${initialSearch}&tag=${initialTag}`}
								className="rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 hover:bg-slate-50">
								Next
							</a>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
