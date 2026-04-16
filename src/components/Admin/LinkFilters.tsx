import type { PaginationData } from './AdminLinksManager'

interface LinkFiltersProps {
	pagination: PaginationData
	initialSort: string
	initialDir: string
	initialSearch: string
	initialTag: string
	availableTags: string[]
	linksCount: number
}

export function LinkFilters({
	pagination,
	initialSort,
	initialDir,
	initialSearch,
	initialTag,
	availableTags,
	linksCount,
}: LinkFiltersProps) {
	return (
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
						Search &amp; Filter
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
							(linksCount > 0 ? 1 : 0)}
						-{Math.min(pagination.page * pagination.pageSize, pagination.total)}{' '}
						of {pagination.total} results
					</p>
				</div>
			</form>
		</div>
	)
}
