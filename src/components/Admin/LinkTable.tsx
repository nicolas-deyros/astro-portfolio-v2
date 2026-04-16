import type { LinkData, PaginationData } from './AdminLinksManager'

interface LinkTableProps {
	links: LinkData[]
	pagination: PaginationData
	initialSort: string
	initialDir: string
	initialSearch: string
	initialTag: string
	onEditClick: (link: LinkData) => void
	onDeleteClick: (id: number) => void
}

function SortLink({
	label,
	sortKey,
	initialSort,
	initialDir,
	initialSearch,
	initialTag,
	pageSize,
}: {
	label: string
	sortKey: string
	initialSort: string
	initialDir: string
	initialSearch: string
	initialTag: string
	pageSize: number
}) {
	const nextDir =
		initialSort === sortKey && initialDir === 'asc' ? 'desc' : 'asc'
	const arrow =
		initialSort === sortKey ? (initialDir === 'asc' ? ' ↑' : ' ↓') : ''
	return (
		<a
			href={`?sort=${sortKey}&dir=${nextDir}&page=1&pageSize=${pageSize}&search=${initialSearch}&tag=${initialTag}`}
			className="text-blue-600 hover:text-slate-700 dark:hover:text-slate-200">
			{label}
			{arrow}
		</a>
	)
}

export function LinkTable({
	links,
	pagination,
	initialSort,
	initialDir,
	initialSearch,
	initialTag,
	onEditClick,
	onDeleteClick,
}: LinkTableProps) {
	const sortProps = {
		initialSort,
		initialDir,
		initialSearch,
		initialTag,
		pageSize: pagination.pageSize,
	}

	return (
		<>
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
									<SortLink label="Title" sortKey="title" {...sortProps} />
								</th>
								<th
									scope="col"
									className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase md:table-cell dark:text-slate-300">
									URL
								</th>
								<th
									scope="col"
									className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase md:table-cell dark:text-slate-300">
									<SortLink label="Tags" sortKey="tags" {...sortProps} />
								</th>
								<th
									scope="col"
									className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-300">
									<SortLink label="Date" sortKey="date" {...sortProps} />
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
														onClick={() => onEditClick(link)}
														className="edit-btn rounded bg-blue-50 px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40">
														Edit
													</button>
													<button
														type="button"
														onClick={() => onDeleteClick(link.id)}
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
		</>
	)
}
