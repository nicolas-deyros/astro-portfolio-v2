import { db, FormSubmissions, Links } from 'astro:db'

// https://astro.build/db/seed
export default async function seed() {
	// Insert form submission sample data
	await db.insert(FormSubmissions).values({
		fullName: 'John Doe',
		email: 'johndoe@example.com',
		message: 'This is a test message',
	})

	// Insert sample links data
	await db.insert(Links).values([
		{
			title: 'Context Engineering Framework',
			url: 'https://www.linkedin.com/posts/ruben-hassid_context-engineering-is-the-new-prompting-activity-7351203962965979136-JWwu',
			tags: 'LinkedIn, AI',
			date: '2025-07-16',
		},
		{
			title: 'Modern Books for Software Engineering Managers',
			url: 'https://dev.to/sibprogrammer/modern-books-for-software-engineering-managers-199p',
			tags: 'Dev, AI',
			date: '2025-02-22',
		},
		{
			title: 'The Complete Beginner’s Guide to Prompt Engineering',
			url: 'https://www.linkedin.com/posts/awa-k-penn_how-to-prompt-chatgpt-claude-gemini-ugcPost-7342821739741016064-TzqQ/',
			tags: 'LinkedIn, AI',
			date: '2025-06-09',
		},
		{
			title: 'Gemini can automate any task in your browser',
			url: 'https://www.linkedin.com/posts/paul-couvert_gemini-can-automate-any-task-in-your-browser-activity-7337211874461077505-gwMc/',
			tags: 'LinkedIn, AI, Gemini',
			date: '2025-06-03',
		},
		{
			title: 'Coding for the Future Agentic World',
			url: 'https://addyo.substack.com/p/coding-for-the-future-agentic-world',
			tags: 'AI',
			date: '2025-07-31',
		},
		{
			title: 'Parallax TechTrades™ Holographic Trading Card',
			url: 'https://codepen.io/jh3y/pen/EaVNNxa',
			tags: 'CSS, CodePen',
			date: '2025-07-30',
		},
		{
			title: '10x your LinkedIn growth with ChatGPT. ',
			url: 'https://www.linkedin.com/posts/khizer-abbas_you-can-10x-your-linkedin-growth-with-chatgpt-activity-7355578851990679553-FqpD',
			tags: 'LinkedIn, chatGPT, AI',
			date: '2025-07-29',
		},
		{
			title: 'MCP Illustrated Guidebo',
			url: 'https://www.linkedin.com/feed/update/urn:li:activity:7355551586552635394',
			tags: 'LinkedIn, MCP, AI',
			date: '2025-07-29',
		},
		{
			title: 'The AI Engineering Handbook',
			url: 'https://www.freecodecamp.org/news/the-ai-engineering-handbook-how-to-start-a-career-and-excel-as-an-ai-engineer/',
			tags: 'freecodecamp, AI',
			date: '2025-07-28',
		},
		{
			title: '12 must-know GenAI terms',
			url: 'https://www.linkedin.com/feed/update/urn:li:activity:7355550915702964224?utm_source=share',
			tags: 'GenAI, LinkedIn, AI',
			date: '2025-07-27',
		},
		{
			title: 'The state of AI',
			url: 'https://www.linkedin.com/posts/brianna-bentler-2397a11a3_the-state-of-ai-ugcPost-7354691689879334912-j5oB',
			tags: 'LinkedIn, AI',
			date: '2025-07-25',
		},
		{
			title: 'Smooth configurable extendable slider made for animation',
			url: 'https://smooothy.vercel.app/',
			tags: 'Library, Slider, Animation',
			date: '2025-07-23',
		},
		{
			title: 'AI Engineer roadmap in 2025 roadmap by Andrew Ng',
			url: 'https://www.linkedin.com/posts/giovanni-beggiato_how-to-build-an-ai-career-andrew-ng-ugcPost-7353188876082995200-KxLU',
			tags: 'LinkedIn, AI',
			date: '2025-07-20',
		},
		{
			title: 'CSS conditionals with the new if() function',
			url: 'https://developer.chrome.com/blog/if-article',
			tags: 'CSS',
			date: '2025-07-01',
		},
		{
			title: 'From scroll-stopping carousel covers',
			url: 'https://www.linkedin.com/posts/jaindl_how-to-show-stopping-carousel-covers-ugcPost-7345891918943318016-yUFz/',
			tags: 'LinkedIn, Design',
			date: '2025-06-15',
		},
		{
			title: 'Vibe coding in prod (reponsibly) by Erik Schluntz from Claude',
			url: 'https://www.youtube.com/watch?v=fHWFF_pnqDk&list=WL',
			tags: 'Youtube, AI, Vibe Coding',
			date: '2025-08-04',
		},
	])
}
