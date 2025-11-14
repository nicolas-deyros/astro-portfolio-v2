const navData = [
	{
		text: 'Home',
		path: '/',
		icon: 'jam:home-f',
	},
	{
		text: 'Blog',
		path: '/blog',
		icon: 'jam:blogger',
	},
	{
		text: 'Links',
		path: '/links/',
		icon: 'mdi:link-variant',
	},
	{
		text: 'Contact',
		path: '/contact',
		icon: 'ic:baseline-alternate-email',
	},
]

// Admin-only navigation items
const adminNavData = [
	{
		text: 'Links',
		path: '/admin/links',
		icon: 'mdi:link-variant',
		title: 'Admin Links',
	},
	{
		text: 'CRM',
		path: '/admin/crm',
		icon: 'mdi:account-group',
		title: 'Admin CRM',
	},
]

export default navData
export { adminNavData }
