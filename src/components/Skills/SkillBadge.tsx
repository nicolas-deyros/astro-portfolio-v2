import { Icon } from '@iconify/react'
import React from 'react'

interface SkillBadgeProps {
	name: string
	icon: string
	level?: string
	color?: string
	description?: string
}

const SkillBadge: React.FC<SkillBadgeProps> = ({
	name,
	icon,
	level,
	color = 'blue',
	description,
}) => {
	// Color mapping for gradients
	const colorMap: Record<string, string> = {
		blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400 shadow-blue-500/20',
		purple:
			'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400 shadow-purple-500/20',
		green:
			'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20',
		orange:
			'from-orange-500/20 to-yellow-500/20 border-orange-500/30 text-orange-400 shadow-orange-500/20',
		red: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400 shadow-red-500/20',
	}

	const activeColorClasses = colorMap[color] || colorMap.blue

	return (
		<div
			className={`group relative rounded-2xl p-[1px] transition-all duration-500 hover:scale-105 active:scale-95`}>
			{/* Animated Gradient Border Layer */}
			<div
				className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${activeColorClasses.split(' ').slice(0, 2).join(' ')} opacity-50 blur-[1px] transition-opacity group-hover:opacity-100`}
			/>

			{/* Glassmorphism Content Card */}
			<div className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl dark:border-white/5 dark:bg-black/20">
				{/* Background Accent Glow */}
				<div
					className={`absolute -top-4 -right-4 h-16 w-16 bg-gradient-to-br ${activeColorClasses.split(' ').slice(0, 2).join(' ')} opacity-20 blur-2xl transition-opacity duration-700 group-hover:opacity-40`}
				/>

				<div className="flex items-center justify-between gap-4">
					<div
						className={`rounded-xl border border-white/10 bg-white/5 p-2.5 shadow-inner transition-transform duration-500 group-hover:rotate-[10deg] dark:bg-black/40`}>
						<Icon
							icon={icon}
							className={`h-8 w-8 ${activeColorClasses.split(' ').pop()}`}
						/>
					</div>

					{level && (
						<span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase backdrop-blur-md">
							{level}
						</span>
					)}
				</div>

				<div className="flex flex-col gap-1">
					<h3 className="text-lg font-bold tracking-tight text-slate-100">
						{name}
					</h3>
					{description && (
						<p className="line-clamp-2 text-xs leading-relaxed text-slate-400 italic">
							{description}
						</p>
					)}
				</div>

				{/* Interactive Highlight */}
				<div className="absolute inset-x-0 bottom-0 h-[2px] scale-x-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
			</div>
		</div>
	)
}

export default SkillBadge
