type ConfirmModalVariant = 'delete' | 'update'

interface ConfirmModalProps {
	variant: ConfirmModalVariant
	onConfirm: () => void
	onCancel: () => void
}

const config = {
	delete: {
		id: 'confirm-delete-modal',
		iconColor: 'text-yellow-500 dark:text-yellow-300',
		title: 'Confirm Delete',
		message: 'Are you sure you want to delete this link?',
		confirmLabel: 'Delete',
		confirmClass:
			'rounded-md bg-red-600 px-6 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:bg-red-500 dark:hover:bg-red-400 dark:focus:ring-offset-slate-900',
		iconPath:
			'M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z',
	},
	update: {
		id: 'confirm-update-modal',
		iconColor: 'text-blue-500 dark:text-blue-400',
		title: 'Confirm Update',
		message: 'Are you sure you want to update this link?',
		confirmLabel: 'Update',
		confirmClass:
			'rounded-md bg-blue-600 px-6 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-slate-900',
		iconPath:
			'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
	},
}

export function ConfirmModal({
	variant,
	onConfirm,
	onCancel,
}: ConfirmModalProps) {
	const c = config[variant]
	return (
		<div
			id={c.id}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
				<div className="flex flex-col items-center">
					<div className="mb-4 flex items-center gap-3">
						<svg
							className={`h-6 w-6 ${c.iconColor}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d={c.iconPath}
							/>
						</svg>
						<span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
							{c.title}
						</span>
					</div>
					<p className="mb-6 text-center text-base text-slate-700 dark:text-slate-300">
						{c.message}
					</p>
					<div className="flex gap-4">
						<button
							onClick={onCancel}
							className="rounded-md bg-gray-200 px-6 py-2 text-base font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-offset-slate-900">
							Cancel
						</button>
						<button onClick={onConfirm} className={c.confirmClass}>
							{c.confirmLabel}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
