export const PUB_SUB_TOPICS = {
  HELLO_MESSAGE: "hello-message",
  CHAT_MESSAGE: "chat-message",
  REPO_EMBED_PROGRESS: "repo-embed-progress",
} as const;

export type PubSubTopic = (typeof PUB_SUB_TOPICS)[keyof typeof PUB_SUB_TOPICS];
