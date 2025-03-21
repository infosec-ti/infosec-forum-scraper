export type Post = {
  title: string;
  replies: number;
  date: string;
  author: string;
  url: string;
  type: "comment" | "post";
  text: string;
};
