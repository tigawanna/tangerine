export interface EmbedRepoShape {
  id: string;
  owner: string;
  name: string;
  description: string | null;
  languages: string[];
  tags: string[];
}

export function embedRepo(repo: EmbedRepoShape) {
  console.log("embedding repo ==", repo);
}
