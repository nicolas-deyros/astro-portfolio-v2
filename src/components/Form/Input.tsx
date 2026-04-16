interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string
	error?: string | undefined
	touched?: boolean | undefined
}

const Input = ({ label, error, touched, className, ...props }: InputProps) => {
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
			<div className={hasError ? 'animate-shake' : ''}>
				<input className={`${baseClasses} ${stateClasses}`} {...props} />
			</div>
			{hasError && (
				<span className="mt-1 block text-sm font-medium text-red-600 transition-opacity duration-300">
					{error}
				</span>
			)}
		</div>
	)
}

export default Input
