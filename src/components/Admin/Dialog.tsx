import { useEffect, useRef } from 'react'

interface DialogProps {
	id?: string
	/** Accessible name announced when the dialog opens. */
	label: string
	/** Called on Escape. */
	onClose: () => void
	children: React.ReactNode
}

// Native modal dialog: focus containment, Escape, and backdrop come from the platform.
export function Dialog({ id, label, onClose, children }: DialogProps) {
	const ref = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		const dialog = ref.current
		dialog?.showModal()
		return () => dialog?.close()
	}, [])

	return (
		<dialog
			ref={ref}
			id={id}
			aria-label={label}
			onCancel={event => {
				event.preventDefault()
				onClose()
			}}
			className="m-auto w-full max-w-md bg-transparent p-4 backdrop:bg-black/40">
			{children}
		</dialog>
	)
}
