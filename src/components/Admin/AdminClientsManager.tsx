import { useEffect,useState } from 'react'

interface Client {
	id: number
	slug: string
	name: string
	email: string
	isActive: number
	createdAt: string
}

interface Props {
	initialClients: Client[]
}

function Modal({
	title,
	onClose,
	children,
}: {
	title: string
	onClose: () => void
	children: React.ReactNode
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
				<div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
						✕
					</button>
				</div>
				<div className="px-6 py-4">{children}</div>
			</div>
		</div>
	)
}

function Field({
	label,
	id,
	type = 'text',
	value,
	onChange,
	placeholder,
	required,
}: {
	label: string
	id: string
	type?: string
	value: string
	onChange: (v: string) => void
	placeholder?: string
	required?: boolean
}) {
	return (
		<div className="mb-4">
			<label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
				{label}
			</label>
			<input
				id={id}
				type={type}
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				required={required}
				className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
			/>
		</div>
	)
}

export default function AdminClientsManager({ initialClients }: Props) {
	const [clientList, setClientList] = useState<Client[]>(initialClients)
	const [showCreate, setShowCreate] = useState(false)
	const [editTarget, setEditTarget] = useState<Client | null>(null)
	const [selectedClient, setSelectedClient] = useState<Client | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [setupNotice, setSetupNotice] = useState<{ url: string; emailSent: boolean } | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
	const [deleteConfirm, setDeleteConfirm] = useState('')
	const [saving, setSaving] = useState(false)

	// Create form state
	const [createName, setCreateName] = useState('')
	const [createEmail, setCreateEmail] = useState('')
	const [createSlug, setCreateSlug] = useState('')

	// Edit form state
	const [editName, setEditName] = useState('')
	const [editEmail, setEditEmail] = useState('')
	const [editPassword, setEditPassword] = useState('')

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault()
		setSaving(true)
		setError(null)
		setSetupNotice(null)
		try {
			const res = await fetch('/api/admin/clients.json', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					name: createName,
					email: createEmail,
					slug: createSlug,
				}),
			})
			const json = await res.json()
			if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to create client')
			setClientList(prev => [...prev, json.client])
			setShowCreate(false)
			setCreateName('')
			setCreateEmail('')
			setCreateSlug('')
			if (json.setupUrl) {
				setSetupNotice({ url: json.setupUrl, emailSent: json.emailSent === true })
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
		} finally {
			setSaving(false)
		}
	}

	function openEdit(client: Client) {
		setEditTarget(client)
		setEditName(client.name)
		setEditEmail(client.email)
		setEditPassword('')
		setError(null)
	}

	async function handleEdit(e: React.FormEvent) {
		e.preventDefault()
		if (!editTarget) return
		setSaving(true)
		setError(null)
		try {
			const body: Record<string, unknown> = {
				id: editTarget.id,
				name: editName,
				email: editEmail,
			}
			if (editPassword) body.password = editPassword
			const res = await fetch('/api/admin/clients.json', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(body),
			})
			const json = await res.json()
			if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to update client')
			setClientList(prev => prev.map(c => (c.id === json.client.id ? json.client : c)))
			setEditTarget(null)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
		} finally {
			setSaving(false)
		}
	}

	async function toggleActive(client: Client) {
		const newActive = client.isActive ? 0 : 1
		try {
			const res = await fetch('/api/admin/clients.json', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ id: client.id, isActive: newActive }),
			})
			const json = await res.json()
			if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to update')
			setClientList(prev => prev.map(c => (c.id === json.client.id ? json.client : c)))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
		}
	}

	async function resendInvite(client: Client) {
		setError(null)
		setSetupNotice(null)
		try {
			const res = await fetch('/api/admin/clients.json', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ id: client.id, regenerateSetupToken: true }),
			})
			const json = await res.json()
			if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to resend')
			setSetupNotice({ url: json.setupUrl, emailSent: json.emailSent === true })
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return
		setSaving(true)
		setError(null)
		try {
			const res = await fetch(`/api/admin/clients.json?id=${deleteTarget.id}`, {
				method: 'DELETE',
				credentials: 'include',
			})
			const json = await res.json()
			if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to delete client')
			setClientList(prev => prev.filter(c => c.id !== deleteTarget.id))
			setDeleteTarget(null)
			setDeleteConfirm('')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div>
			{error && (
				<div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
					{error}
				</div>
			)}

			{setupNotice && (
				<div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
					<p className="mb-2 font-medium">
						Client created.{' '}
						{setupNotice.emailSent
							? 'A set-password link was emailed to them.'
							: 'The setup email could not be sent — share this link manually:'}
					</p>
					<div className="flex items-center gap-2">
						<input
							readOnly
							value={setupNotice.url}
							onFocus={e => e.currentTarget.select()}
							className="flex-1 rounded border border-green-300 bg-white px-2 py-1 text-xs text-gray-800 dark:border-green-700 dark:bg-gray-800 dark:text-gray-200"
						/>
						<button
							onClick={() => navigator.clipboard?.writeText(setupNotice.url)}
							className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700">
							Copy
						</button>
						<button
							onClick={() => setSetupNotice(null)}
							className="text-xs text-green-700 hover:underline dark:text-green-400">
							Dismiss
						</button>
					</div>
				</div>
			)}

			<div className="mb-6 flex items-center justify-between">
				<p className="text-sm text-gray-500 dark:text-gray-400">
					{clientList.length} client{clientList.length !== 1 ? 's' : ''}
				</p>
				<button
					onClick={() => setShowCreate(true)}
					className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
					+ New Client
				</button>
			</div>

			{/* Clients table */}
			<div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
				<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead className="bg-gray-50 dark:bg-gray-800">
						<tr>
							{['Name', 'Email', 'Slug', 'Status', 'Created', 'Actions'].map(h => (
								<th key={h} className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
						{clientList.map(client => (
							<tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
								<td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
									{client.name}
								</td>
								<td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
									{client.email}
								</td>
								<td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
									<code className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-800">
										{client.slug}
									</code>
								</td>
								<td className="px-4 py-3">
									<button
										onClick={() => toggleActive(client)}
										className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
											client.isActive
												? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
												: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
										}`}>
										{client.isActive ? 'Active' : 'Inactive'}
									</button>
								</td>
								<td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
									{new Date(client.createdAt).toLocaleDateString()}
								</td>
								<td className="px-4 py-3">
									<div className="flex gap-2">
										<button
											onClick={() => openEdit(client)}
											className="text-xs text-blue-600 hover:underline dark:text-blue-400">
											Edit
										</button>
										<button
											onClick={() => setSelectedClient(client)}
											className="text-xs text-gray-600 hover:underline dark:text-gray-400">
											Files
										</button>
										<a
											href={`/client/`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-gray-600 hover:underline dark:text-gray-400">
											Preview
										</a>
										<button
											onClick={() => resendInvite(client)}
											className="text-xs text-gray-600 hover:underline dark:text-gray-400">
											Resend invite
										</button>
										<button
											onClick={() => { setDeleteTarget(client); setDeleteConfirm('') }}
											className="text-xs text-red-600 hover:underline dark:text-red-400">
											Delete
										</button>
									</div>
								</td>
							</tr>
						))}
						{clientList.length === 0 && (
							<tr>
								<td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
									No clients yet. Create one to get started.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* File manager pane */}
			{selectedClient && (
				<div className="mt-8">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
							Files — {selectedClient.name}
						</h3>
						<button
							onClick={() => setSelectedClient(null)}
							className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
							Close ✕
						</button>
					</div>
					<AdminClientFilesInline clientId={selectedClient.id} clientSlug={selectedClient.slug} />
				</div>
			)}

			{/* Create modal */}
			{showCreate && (
				<Modal title="New Client" onClose={() => setShowCreate(false)}>
					<form onSubmit={handleCreate}>
						<Field label="Company / Client Name" id="c-name" value={createName} onChange={v => { setCreateName(v); setCreateSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) }} required />
						<Field label="Email" id="c-email" type="email" value={createEmail} onChange={setCreateEmail} required />
						<Field label="Slug (URL identifier)" id="c-slug" value={createSlug} onChange={setCreateSlug} placeholder="auto-generated" />
						<p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
							The client receives an email with a one-time link to set their own password.
						</p>
						<div className="flex justify-end gap-3 pt-2">
							<button type="button" onClick={() => setShowCreate(false)} className="rounded-md border px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">Cancel</button>
							<button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
								{saving ? 'Creating…' : 'Create'}
							</button>
						</div>
					</form>
				</Modal>
			)}

			{/* Edit modal */}
			{editTarget && (
				<Modal title={`Edit — ${editTarget.name}`} onClose={() => setEditTarget(null)}>
					<form onSubmit={handleEdit}>
						<Field label="Name" id="e-name" value={editName} onChange={setEditName} required />
						<Field label="Email" id="e-email" type="email" value={editEmail} onChange={setEditEmail} required />
						<Field label="New Password (leave blank to keep current)" id="e-password" type="password" value={editPassword} onChange={setEditPassword} />
						<div className="flex justify-end gap-3 pt-2">
							<button type="button" onClick={() => setEditTarget(null)} className="rounded-md border px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">Cancel</button>
							<button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60">
								{saving ? 'Saving…' : 'Save'}
							</button>
						</div>
					</form>
				</Modal>
			)}

			{/* Delete modal — type-the-name confirmation (irreversible) */}
			{deleteTarget && (
				<Modal title="Delete client" onClose={() => { setDeleteTarget(null); setDeleteConfirm('') }}>
					<p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
						This permanently deletes <strong>{deleteTarget.name}</strong>, their portal
						access, and <strong>all their files</strong>. This cannot be undone.
					</p>
					<p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
						Type <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{deleteTarget.name}</code> to confirm:
					</p>
					<input
						value={deleteConfirm}
						onChange={e => setDeleteConfirm(e.target.value)}
						className="mb-4 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						placeholder={deleteTarget.name}
					/>
					<div className="flex justify-end gap-3 pt-1">
						<button type="button" onClick={() => { setDeleteTarget(null); setDeleteConfirm('') }} className="rounded-md border px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">Cancel</button>
						<button
							type="button"
							onClick={confirmDelete}
							disabled={saving || deleteConfirm !== deleteTarget.name}
							className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
							{saving ? 'Deleting…' : 'Delete permanently'}
						</button>
					</div>
				</Modal>
			)}
		</div>
	)
}

// Inline file manager used inside the same island
function AdminClientFilesInline({ clientId, clientSlug }: { clientId: number; clientSlug: string }) {
	const [nodes, setNodes] = useState<Array<{
		id: number
		parentId: number | null
		name: string
		type: string
		mimeType: string | null
		size: number | null
		pageSlug: string | null
		createdAt: string
	}>>([])
	const [loading, setLoading] = useState(true)
	const [currentParent, setCurrentParent] = useState<number | null>(null)
	const [breadcrumb, setBreadcrumb] = useState<Array<{ id: number | null; name: string }>>([{ id: null, name: 'Root' }])
	const [uploading, setUploading] = useState(false)
	const [addingFolder, setAddingFolder] = useState(false)
	const [addingPage, setAddingPage] = useState(false)
	const [folderName, setFolderName] = useState('')
	const [pageName, setPageName] = useState('')
	const [pageSlug, setPageSlug] = useState('')
	const [error, setError] = useState<string | null>(null)

	async function loadNodes(parentId: number | null) {
		setLoading(true)
		try {
			const params = new URLSearchParams({ clientId: String(clientId) })
			if (parentId !== null) params.set('parentId', String(parentId))
			const res = await fetch(`/api/admin/client-files.json?${params}`, { credentials: 'include' })
			const json = await res.json()
			if (json.success) setNodes(json.nodes ?? [])
		} catch {
			setError('Failed to load files')
		} finally {
			setLoading(false)
		}
	}

	// Load nodes on mount
	useEffect(() => { loadNodes(null) }, [])

	async function navigateTo(folderId: number | null, name: string) {
		setCurrentParent(folderId)
		if (folderId === null) {
			setBreadcrumb([{ id: null, name: 'Root' }])
		} else {
			setBreadcrumb(prev => [...prev, { id: folderId, name }])
		}
		await loadNodes(folderId)
	}

	async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		setUploading(true)
		setError(null)
		try {
			const form = new FormData()
			form.append('file', file)
			form.append('clientId', String(clientId))
			if (currentParent !== null) form.append('parentId', String(currentParent))

			const res = await fetch('/api/admin/client-files.json', {
				method: 'POST',
				credentials: 'include',
				body: form,
			})
			const json = await res.json()
			if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Upload failed')
			await loadNodes(currentParent)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Upload error')
		} finally {
			setUploading(false)
			e.target.value = ''
		}
	}

	async function handleCreateFolder(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		try {
			const res = await fetch('/api/admin/client-files.json', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ type: 'folder', name: folderName, clientId, parentId: currentParent }),
			})
			const json = await res.json()
			if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed')
			setFolderName('')
			setAddingFolder(false)
			await loadNodes(currentParent)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
		}
	}

	async function handleCreatePage(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		try {
			const res = await fetch('/api/admin/client-files.json', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ type: 'page', name: pageName, pageSlug, clientId, parentId: currentParent }),
			})
			const json = await res.json()
			if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed')
			setPageName('')
			setPageSlug('')
			setAddingPage(false)
			await loadNodes(currentParent)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
		}
	}

	async function handleDelete(nodeId: number) {
		if (!confirm('Delete this item? This cannot be undone.')) return
		try {
			const res = await fetch(`/api/admin/client-files.json?nodeId=${nodeId}`, {
				method: 'DELETE',
				credentials: 'include',
			})
			const json = await res.json()
			if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Delete failed')
			await loadNodes(currentParent)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
		}
	}

	return (
		<div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
			{error && (
				<div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
					{error}
				</div>
			)}

			{/* Breadcrumb */}
			<div className="mb-3 flex items-center gap-1 text-sm text-gray-500">
				{breadcrumb.map((item, i) => (
					<span key={i} className="flex items-center gap-1">
						{i > 0 && <span>/</span>}
						<button
							onClick={() => {
								const newCrumb = breadcrumb.slice(0, i + 1)
								setBreadcrumb(newCrumb)
								setCurrentParent(item.id)
								loadNodes(item.id)
							}}
							className="hover:text-gray-900 dark:hover:text-white">
							{item.name}
						</button>
					</span>
				))}
			</div>

			{/* Actions toolbar */}
			<div className="mb-4 flex flex-wrap gap-2">
				<label className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
					{uploading ? 'Uploading…' : 'Upload File'}
					<input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
				</label>
				<button
					onClick={() => setAddingFolder(!addingFolder)}
					className="rounded-md border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-300">
					+ Folder
				</button>
				<button
					onClick={() => setAddingPage(!addingPage)}
					className="rounded-md border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-300">
					+ Page reference
				</button>
			</div>

			{/* Inline folder creation */}
			{addingFolder && (
				<form onSubmit={handleCreateFolder} className="mb-3 flex gap-2">
					<input
						value={folderName}
						onChange={e => setFolderName(e.target.value)}
						placeholder="Folder name"
						required
						className="flex-1 rounded-md border px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
					<button type="submit" className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-white">Create</button>
					<button type="button" onClick={() => setAddingFolder(false)} className="px-2 text-sm text-gray-400">✕</button>
				</form>
			)}

			{/* Inline page creation */}
			{addingPage && (
				<form onSubmit={handleCreatePage} className="mb-3 flex flex-wrap gap-2">
					<input
						value={pageName}
						onChange={e => setPageName(e.target.value)}
						placeholder="Display name (e.g. Guía de APIs)"
						required
						className="flex-1 rounded-md border px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
					<input
						value={pageSlug}
						onChange={e => setPageSlug(e.target.value)}
						placeholder="Page slug (e.g. guia-apis)"
						required
						className="flex-1 rounded-md border px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
					<button type="submit" className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-white">Add</button>
					<button type="button" onClick={() => setAddingPage(false)} className="px-2 text-sm text-gray-400">✕</button>
				</form>
			)}

			{/* Node list */}
			{loading ? (
				<p className="py-4 text-center text-sm text-gray-400">Loading…</p>
			) : nodes.length === 0 ? (
				<p className="py-4 text-center text-sm text-gray-400">Empty folder</p>
			) : (
				<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead>
						<tr>
							{['Name', 'Type', 'Size', ''].map(h => (
								<th key={h} className="px-3 py-2 text-left text-xs text-gray-500">{h}</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100 dark:divide-gray-800">
						{nodes.map(node => (
							<tr key={node.id}>
								<td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
									{node.type === 'folder' ? (
										<button
											onClick={() => navigateTo(node.id, node.name)}
											className="text-yellow-600 hover:underline dark:text-yellow-400">
											📁 {node.name}
										</button>
									) : node.type === 'page' ? (
										<a
											href={`/clients/${clientSlug}/${node.pageSlug}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 hover:underline dark:text-blue-400">
											📄 {node.name}
										</a>
									) : (
										<span>📎 {node.name}</span>
									)}
								</td>
								<td className="px-3 py-2 text-xs text-gray-500">{node.type}</td>
								<td className="px-3 py-2 text-xs text-gray-500">
									{node.size ? `${(node.size / 1024).toFixed(1)} KB` : '—'}
								</td>
								<td className="px-3 py-2 text-right">
									<button
										onClick={() => handleDelete(node.id)}
										className="text-xs text-red-500 hover:underline">
										Delete
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	)
}
