import { FindCommunityMemberByIdsValidator } from './query-community-members.validator';

export const JoinCommunityValidator = FindCommunityMemberByIdsValidator.required();
