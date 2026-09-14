import Link from '@tiptap/extension-link'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface DescriptionEditorProps {
	value: string
	onChange: (html: string) => void
}

const toolbarBtnClass = (active: boolean) =>
	`rounded px-2 py-1 text-sm font-medium ${
		active
			? 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-400'
			: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-600'
	}`

export function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Link.configure({ openOnClick: false, autolink: false }),
		],
		content: value,
		onUpdate: ({ editor }) => onChange(editor.getHTML()),
		editorProps: {
			attributes: {
				class:
					'min-h-24 px-3 py-2 text-sm focus:outline-none dark:text-slate-100',
			},
		},
	})

	if (!editor) return null

	const setLink = () => {
		const url = window.prompt('URL')
		if (url === null) return
		if (url === '') {
			editor.chain().focus().unsetLink().run()
			return
		}
		editor.chain().focus().setLink({ href: url }).run()
	}

	return (
		<div className="mt-1 rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-slate-600 dark:bg-slate-700">
			<div className="flex gap-1 border-b border-slate-200 p-1 dark:border-slate-600">
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={toolbarBtnClass(editor.isActive('bold'))}
					aria-label="Bold">
					<strong>B</strong>
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={toolbarBtnClass(editor.isActive('italic'))}
					aria-label="Italic">
					<em>I</em>
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					className={toolbarBtnClass(editor.isActive('bulletList'))}
					aria-label="Bullet list">
					• List
				</button>
				<button
					type="button"
					onClick={setLink}
					className={toolbarBtnClass(editor.isActive('link'))}
					aria-label="Link">
					Link
				</button>
			</div>
			<EditorContent editor={editor} />
		</div>
	)
}
