import { SearchTextDangerDto } from "./search-text-danger.dto";

export type SearchTextResponseDto = {
    source: string;
    search_text: string;
    danger_quantity: number;
    dangers: SearchTextDangerDto[];
}