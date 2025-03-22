export type Post = {
  title: string;
  replies: number;
  date: string;
  author: string;
  url: string;
  text: string;
  tags: string;
};

export type Comment = {
  author: string | null;
  date: string | null;
  text: string | null;
  url: string | null;
};
