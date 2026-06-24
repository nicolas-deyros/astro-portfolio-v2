import { useState } from 'react'

type NodeType = 'folder' | 'file' | 'page'

interface ClientNode {
	id: number
	clientId: number
	parentId: number | null
	name: string
	type: string
	blobKey: string | null
	mimeType: string | null
	size: number | null
	pageSlug: string | null
	createdAt: string
}

interface BreadcrumbItem {
	id: number | null
	name: string
}

interface Props {
	nodes: ClientNode[]
	breadcrumb: BreadcrumbItem[]
	clientSlug: string
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function NodeIcon({ type, mimeType }: { type: string; mimeType?: string | null }) {
	if (type === 'folder') {
		return (
			<svg className="h-10 w-10 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
				<path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
			</svg>
		)
	}
	if (type === 'page') {
		return (
			<svg className="h-10 w-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
		)
	}
	if (mimeType?.startsWith('image/')) {
		return (
			<svg className="h-10 w-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
					d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
		)
	}
	if (mimeType === 'application/pdf') {
		return (
			<svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
		)
	}
	return (
		<svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
				d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
		</svg>
	)
}

export default function FileBrowser({ nodes, breadcrumb, clientSlug }: Props) {
	const [downloading, setDownloading] = useState<number | null>(null)
	const [error, setError] = useState<string | null>(null)

	async function handleFileClick(node: ClientNode) {
		if (node.type !== 'file') return
		setDownloading(node.id)
		setError(null)
		try {
			const res = await fetch(
				`/api/client/files.json?nodeId=${node.id}&action=download`,
				{ credentials: 'include' },
			)
			if (!res.ok) {
				const json = await res.json().catch(() => ({}))
				throw new Error(json.error?.message ?? 'Download failed')
			}
			const { url } = await res.json()
			const a = document.createElement('a')
			a.href = url
			a.download = node.name
			a.click()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Download failed')
		} finally {
			setDownloading(null)
		}
	}

	function handleNodeClick(node: ClientNode) {
		if (node.type === 'folder') {
			window.location.href = `/client/?folder=${node.id}`
		} else if (node.type === 'page' && node.pageSlug) {
			window.location.href = `/clients/${clientSlug}/${node.pageSlug}`
		} else {
			handleFileClick(node)
		}
	}

	return (
		<div>
			{/* Breadcrumb */}
			<nav className="mb-6 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
				{breadcrumb.map((item, i) => (
					<span key={i} className="flex items-center gap-1">
						{i > 0 && <span className="text-gray-300 dark:text-gray-600">/</span>}
						{i < breadcrumb.length - 1 ? (
							<a
								href={item.id ? `/client/?folder=${item.id}` : '/client/'}
								className="hover:text-gray-900 dark:hover:text-white">
								{item.name}
							</a>
						) : (
							<span className="font-medium text-gray-900 dark:text-white">
								{item.name}
							</span>
						)}
					</span>
				))}
			</nav>

			{/* Error banner */}
			{error && (
				<div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
					{error}
				</div>
			)}

			{/* Empty state */}
			{nodes.length === 0 && (
				<div className="flex flex-col items-center justify-center py-20 text-gray-400">
					<svg className="mb-3 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
							d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
					</svg>
					<p className="text-sm">No files here yet</p>
				</div>
			)}

			{/* Node grid */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{nodes.map(node => (
					<button
						key={node.id}
						onClick={() => handleNodeClick(node)}
						disabled={downloading === node.id}
						className="group flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600">
						<NodeIcon type={node.type as NodeType} mimeType={node.mimeType} />
						<span className="line-clamp-2 text-xs font-medium text-gray-700 dark:text-gray-300">
							{node.name}
						</span>
						{node.type === 'file' && node.size !== null && (
							<span className="text-xs text-gray-400">
								{downloading === node.id ? 'Downloading…' : formatBytes(node.size)}
							</span>
						)}
						{node.type === 'page' && (
							<span className="text-xs text-blue-500">Open page →</span>
						)}
					</button>
				))}
			</div>
		</div>
	)
}
