interface ErrorModalProps {
	message: string
	onDismiss: () => void
}

export function ErrorModal({ message, onDismiss }: ErrorModalProps) {
	return (
		<div
			id="session-modal"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
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
						{message}
					</p>
					<button
						onClick={onDismiss}
						className="rounded-md bg-blue-600 px-6 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-slate-900">
						OK
					</button>
				</div>
			</div>
		</div>
	)
}
