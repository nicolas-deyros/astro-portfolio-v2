import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

describe('Video Component Integration', () => {
    const blogDir = join(process.cwd(), 'src', 'content', 'blog')
    const mdxFiles = readdirSync(blogDir).filter(file => file.endsWith('.mdx'))

    mdxFiles.forEach(file => {
        describe(`in ${file}`, () => {
            const filePath = join(blogDir, file)
            const fileContent = readFileSync(filePath, 'utf-8')
            const { content } = matter(fileContent)

            const videoComponentRegex = /<Video\s+platform="(\w+)"\s+videoId="([\w-]+)"\s*\/>/g
            let match;
            let videoCount = 0;

            const matches = content.matchAll(videoComponentRegex);
            const videos = Array.from(matches);

            if (videos.length > 0) {
                videos.forEach((match, index) => {
                    const videoCount = index + 1;
                    const [, platform, videoId] = match;

                    it(`should have a valid platform for video ${videoCount}`, () => {
                        expect(['youtube', 'vimeo']).toContain(platform);
                    });

                    it(`should have a valid videoId for video ${videoCount}`, () => {
                        expect(videoId).toBeDefined();
                        expect(videoId.length).toBeGreaterThan(0);
                    });
                });
            } else {
                it('should not contain any video components', () => {
                    expect(true).toBe(true);
                });
            }
        })
    })
})
