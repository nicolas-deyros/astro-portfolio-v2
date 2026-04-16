import React from 'react'

interface FormData {
	title: string
	url: string
	tags: string
	date: string
}

interface LinkFormProps {
	formData: FormData
	formErrors: string[]
	formSuccess: string
	editMode: boolean
	isSubmitting: boolean
	onInputChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => void
	onSubmit: (e: React.FormEvent) => void
	onCancelEdit: () => void
}

export function LinkForm({
	formData,
	formErrors,
	formSuccess,
	editMode,
	isSubmitting,
	onInputChange,
	onSubmit,
	onCancelEdit,
}: LinkFormProps) {
	const inputClass =
		'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400'

	return (
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
						onClick={onCancelEdit}
						className="rounded bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
						Cancel Edit
					</button>
				)}
			</div>

			<form onSubmit={onSubmit} className="space-y-6">
				{formErrors.length > 0 && (
					<div
						id="form-errors"
						className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
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

				{formSuccess && (
					<div
						id="form-success"
						className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
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
							onChange={onInputChange}
							required
							className={inputClass}
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
							onChange={onInputChange}
							required
							className={inputClass}
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
							onChange={onInputChange}
							required
							className={inputClass}
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
							onChange={onInputChange}
							required
							className={inputClass}
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
	)
}
