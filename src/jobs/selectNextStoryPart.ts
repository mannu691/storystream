import { Devvit } from "@devvit/public-api";
import { Service } from "../service/Service.js";
import { PostId } from "../types.js";

export const selectNextStoryPart = Devvit.addSchedulerJob<{
  postId: PostId;
  first: boolean;
}>({
  name: "SELECT_NEXT_STORY_PART",
  onRun: async (event, context) => {
    if (event.data) {
      try {
        const service = new Service(context);
        const lastChance = !event.data.first;
        const res = service.progressStory(event.data.postId);
        if (!res) {
          if (lastChance) {
            await service.expirePost(event.data.postId);
          }
          else {
            await service.newSchedulerForStory(event.data.postId, 3, false);
          }
        }
      } catch (error) {
        console.error("Failed to select next story part:", error);
      }
    }
  },
});
