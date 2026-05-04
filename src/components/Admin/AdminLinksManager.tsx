import { useState } from 'react'

import type { LinkData } from '@/schemas'

import { useAdminLinks } from '../../hooks/useAdminLinks'
import { ConfirmModal } from './ConfirmModal'
import { ErrorModal } from './ErrorModal'
import { LinkFilters } from './LinkFilters'
import { LinkForm } from './LinkForm'
import { LinkTable } from './LinkTable'

export type { LinkData }

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
	const [pagination] = useState<PaginationData>(initialPagination)
	const {
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
		handlers,
	} = useAdminLinks(initialLinks)

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{showErrorModal && (
				<ErrorModal
					message={globalErrorMessage}
					onDismiss={handlers.dismissErrorModal}
				/>
			)}
			{showDeleteModal && (
				<ConfirmModal
					variant="delete"
					onConfirm={handlers.confirmDelete}
					onCancel={handlers.dismissDeleteModal}
				/>
			)}
			{showUpdateModal && (
				<ConfirmModal
					variant="update"
					onConfirm={handlers.confirmUpdate}
					onCancel={handlers.dismissUpdateModal}
				/>
			)}

			<div className="mb-8">
				<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
					Link Management
				</h2>
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
					Manage your social links and external resources.
				</p>
			</div>

			<LinkForm
				formData={formData}
				formErrors={formErrors}
				formSuccess={formSuccess}
				editMode={editMode}
				isSubmitting={isSubmitting}
				onInputChange={handlers.handleInputChange}
				onSubmit={handlers.handleSubmit}
				onCancelEdit={handlers.resetForm}
			/>

			<LinkFilters
				pagination={pagination}
				initialSort={initialSort}
				initialDir={initialDir}
				initialSearch={initialSearch}
				initialTag={initialTag}
				availableTags={availableTags}
				linksCount={links.length}
			/>

			<LinkTable
				links={links}
				pagination={pagination}
				initialSort={initialSort}
				initialDir={initialDir}
				initialSearch={initialSearch}
				initialTag={initialTag}
				onEditClick={handlers.handleEditClick}
				onDeleteClick={handlers.handleDeleteClick}
			/>
		</div>
	)
}
