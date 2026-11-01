// Run: npx tsx src/lib/video.check.ts — tiny self-check for the URL parser.
import assert from "node:assert";
import { videoFromUrl } from "./video";

const id = (u: string) => videoFromUrl(u, "t", "/x.webp")?.embedId ?? null;
assert.equal(id("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.equal(id("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.equal(id("https://www.youtube.com/shorts/abcDEF12345"), "abcDEF12345");
assert.equal(id("https://www.tiktok.com/@thegreennest77/video/7301234567890123456"), "7301234567890123456");
assert.equal(id("https://www.tiktok.com/@thegreennest77"), null, "profile link: open in new tab, no embed");
assert.equal(videoFromUrl(null, "t", "/x"), null);
assert.equal(videoFromUrl("not a url", "t", "/x"), null);
console.log("video.check ok");
