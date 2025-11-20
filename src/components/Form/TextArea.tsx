import { AnimatePresence, motion } from 'framer-motion'

interface TextAreaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label: string
	error?: string | undefined
	touched?: boolean | undefined
}

const fadeInOut = {
	initial: { opacity: 0, y: -10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
	transition: { duration: 0.3 },
}

const shakeAnimation = {
	initial: { x: 0 },
	animate: { x: [-10, 10, -10, 10, 0] },
	transition: { duration: 0.4 },
}

const TextArea = ({
	label,
	error,
	touched,
	className,
	...props
}: TextAreaProps) => {
	const hasError = error && touched

	const baseClasses =
		'block w-full rounded-md border p-2.5 text-sm transition-colors duration-200'
	const stateClasses = hasError
		? 'border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500'
		: 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 dark:text-slate-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white'

	const labelClasses = `block text-sm font-medium mb-1 ${
		hasError ? 'text-red-700' : 'text-slate-700 dark:text-slate-200'
	}`

	return (
		<div className={className}>
			<label htmlFor={props.id || props.name} className={labelClasses}>
				{label}
			</label>
			<motion.div
				animate={hasError ? shakeAnimation.animate : {}}
				transition={shakeAnimation.transition}>
				<textarea className={`${baseClasses} ${stateClasses}`} {...props} />
			</motion.div>
			<AnimatePresence>
				{hasError && (
					<motion.span
						{...fadeInOut}
						className="mt-1 block text-sm font-medium text-red-600">
						{error}
					</motion.span>
				)}
			</AnimatePresence>
		</div>
	)
}

export default TextArea
