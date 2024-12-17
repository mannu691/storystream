import { GamePostData } from "../types.js";

export const finishedStoryComment = (postData: GamePostData) => {
    const storyTitle = "Title";
    const mostUpvotedUser = "ME";
    // const story =Object.values() postData.data.join(" ");
    return `🎉 The Story is Complete!
🌟 Thank you to everyone who contributed to this epic tale! Here’s how the story unfolded:
📖 Story Title: ${storyTitle}
🔗 The Chapters:
${"Part1) \n".repeat(2)}
✨ Full Story:

🏆 Most Upvoted Contribution: ${mostUpvotedUser}`
};