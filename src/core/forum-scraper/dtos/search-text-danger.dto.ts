import { Comment, Post } from "../../../domain/entities/post.entity";

export type SearchTextDangerDto = {
    post: Post;
    comments: Comment[];
};
